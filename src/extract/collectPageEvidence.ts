import type { Page } from 'playwright';

export type RawPageEvidence = {
  rootBackground?: string;
  colors: Array<{
    value: string;
    property: string;
    selector: string;
    area?: number;
    aboveFold?: boolean;
  }>;
  typography: Array<{
    selector: string;
    role: string;
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    letterSpacing: string;
  }>;
  components: Array<{
    kind: string;
    selector: string;
    textSample: string;
    styles: Record<string, string>;
    bounds: { width: number; height: number };
  }>;
  fontFaces?: Array<{
    family: string;
    weight: string;
    style: string;
    src: string;
  }>;
  gradients?: Array<{ value: string; selector: string }>;
  motion?: { durations: string[]; easings: string[] };
  containerWidths?: number[];
  sectionGaps?: number[];
  imagery?: {
    images: number;
    photos: number;
    icons: number;
    videos: number;
    backgroundImages: number;
  };
};

export async function collectPageEvidence(
  page: Page,
  options: { viewport: string; maxComponents: number },
): Promise<RawPageEvidence> {
  return page.evaluate(({ maxComponents }) => {
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = 1;
    colorCanvas.height = 1;
    const colorContext = colorCanvas.getContext('2d');

    function rgbToHex(
      red: number | string,
      green: number | string,
      blue: number | string,
    ): string {
      return `#${[red, green, blue]
        .map((part) =>
          Math.max(0, Math.min(255, Math.round(Number(part))))
            .toString(16)
            .padStart(2, '0'),
        )
        .join('')}`;
    }

    function alphaToString(alpha: number): string {
      return String(Math.round(alpha * 1000) / 1000)
        .replace(/0+$/, '')
        .replace(/\.$/, '');
    }

    function normalizeColor(value: string): string {
      const trimmed = value.trim();
      if (!trimmed) return value;
      if (trimmed === 'transparent') return trimmed;

      const rgbMatch = trimmed.match(
        /rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/,
      );
      if (rgbMatch) {
        const [, red, green, blue, alpha] = rgbMatch;
        if (alpha !== undefined && Number(alpha) === 0) return 'transparent';
        if (alpha !== undefined && Number(alpha) < 1) {
          return `rgba(${Math.round(Number(red))}, ${Math.round(Number(green))}, ${Math.round(Number(blue))}, ${alphaToString(Number(alpha))})`;
        }
        return rgbToHex(red, green, blue);
      }

      if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
        const [, red, green, blue] = trimmed;
        return `#${red}${red}${green}${green}${blue}${blue}`.toLowerCase();
      }

      if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
        return trimmed.toLowerCase();
      }

      if (!colorContext || !CSS.supports('color', trimmed)) {
        return trimmed;
      }

      colorContext.clearRect(0, 0, 1, 1);
      colorContext.fillStyle = trimmed;
      colorContext.fillRect(0, 0, 1, 1);

      const [red, green, blue, alpha] = colorContext.getImageData(
        0,
        0,
        1,
        1,
      ).data;
      if (alpha === 0) return 'transparent';
      if (alpha < 255) {
        return `rgba(${red}, ${green}, ${blue}, ${alphaToString(alpha / 255)})`;
      }
      return rgbToHex(red, green, blue);
    }

    function normalizeColorsInCssValue(value: string): string {
      return value.replace(
        /(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^)]+\)|#[0-9a-f]{3,8}\b/gi,
        (color) => normalizeColor(color),
      );
    }

    function borderValue(style: CSSStyleDeclaration): string {
      const color = normalizeColor(style.borderColor);
      if (!style.borderWidth || !style.borderStyle || color === 'transparent') {
        return style.border;
      }
      return `${style.borderWidth} ${style.borderStyle} ${color}`;
    }

    function hasVisibleBorder(style: CSSStyleDeclaration): boolean {
      return ['Top', 'Right', 'Bottom', 'Left'].some((side) => {
        const width = style[`border${side}Width` as keyof CSSStyleDeclaration];
        const borderStyle =
          style[`border${side}Style` as keyof CSSStyleDeclaration];
        const color = style[`border${side}Color` as keyof CSSStyleDeclaration];
        return (
          typeof width === 'string' &&
          typeof borderStyle === 'string' &&
          typeof color === 'string' &&
          numericPx(width) > 0 &&
          borderStyle !== 'none' &&
          borderStyle !== 'hidden' &&
          normalizeColor(color) !== 'transparent'
        );
      });
    }

    function selectorPath(element: Element): string {
      if (element.id) return `#${element.id}`;
      const parts: string[] = [];
      let current: Element | null = element;
      while (current && parts.length < 4) {
        const tag = current.tagName.toLowerCase();
        const className = Array.from(current.classList).slice(0, 2).join('.');
        parts.unshift(className ? `${tag}.${className}` : tag);
        current = current.parentElement;
      }
      return parts.join(' > ');
    }

    function isVisible(element: Element): boolean {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== 'hidden' &&
        style.display !== 'none'
      );
    }

    function roleFor(element: Element): string {
      const tag = element.tagName.toLowerCase();
      if (tag.match(/^h[1-6]$/)) return 'heading';
      if (tag === 'p' || tag === 'li') return 'body';
      if (tag === 'button' || element.getAttribute('role') === 'button')
        return 'button';
      if (tag === 'a')
        return element.className.toString().includes('button')
          ? 'button'
          : 'link';
      return 'text';
    }

    function hasVisiblePaint(style: CSSStyleDeclaration): boolean {
      return (
        normalizeColor(style.backgroundColor) !== 'transparent' ||
        hasVisibleBorder(style) ||
        style.boxShadow !== 'none'
      );
    }

    function hasButtonShape(
      style: CSSStyleDeclaration,
      rect: DOMRect,
    ): boolean {
      return (
        rect.width >= 24 &&
        rect.height >= 18 &&
        (numericPx(style.paddingLeft) + numericPx(style.paddingRight) > 8 ||
          numericPx(style.borderRadius) > 0) &&
        hasVisiblePaint(style)
      );
    }

    const MEDIA_TAGS = [
      'img',
      'svg',
      'picture',
      'video',
      'canvas',
      'source',
      'iframe',
    ];

    // A real card carries content — readable text or a structure of several
    // non-media children. A painted box that only frames a single image/decoration
    // is a media container, not a reusable component, so it must not count.
    function hasCardSubstance(element: Element): boolean {
      const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (text.length >= 10) return true;
      const meaningfulChildren = Array.from(element.children).filter(
        (child) => !MEDIA_TAGS.includes(child.tagName.toLowerCase()),
      );
      return meaningfulChildren.length >= 2;
    }

    function hasCardShape(
      element: Element,
      style: CSSStyleDeclaration,
      rect: DOMRect,
    ): boolean {
      if (element === document.body || element === document.documentElement)
        return false;
      return (
        rect.width >= 120 &&
        rect.height >= 60 &&
        hasVisiblePaint(style) &&
        hasCardSubstance(element) &&
        (numericPx(style.borderRadius) > 0 ||
          style.boxShadow !== 'none' ||
          normalizeColor(style.borderColor) !== 'transparent')
      );
    }

    function numericPx(value: string): number {
      const match = value.match(/([\\d.]+)/);
      return match ? Number.parseFloat(match[1]) : 0;
    }

    function componentKind(
      element: Element,
      style: CSSStyleDeclaration,
      rect: DOMRect,
    ): string | null {
      const tag = element.tagName.toLowerCase();
      // Media/leaf elements are content, not reusable components — even when their
      // class names contain "card"/"btn" (e.g. Webflow's `img.f-card-1-img`).
      if (MEDIA_TAGS.includes(tag)) return null;
      const classText = element.className.toString().toLowerCase();
      if (
        tag === 'button' ||
        element.getAttribute('role') === 'button' ||
        classText.includes('button') ||
        classText.includes('btn') ||
        (tag === 'a' && hasButtonShape(style, rect))
      ) {
        return 'button';
      }
      if (['input', 'textarea', 'select'].includes(tag)) return 'input';
      // Navbar-level containers only — not every `nav-link`/`nav-logo` sub-part,
      // which are links/decoration, not a distinct navigation component.
      if (
        tag === 'nav' ||
        tag === 'header' ||
        element.getAttribute('role') === 'navigation' ||
        /\bnavbar\b/.test(classText)
      )
        return 'navigation';
      if (classText.includes('badge') || classText.includes('pill'))
        return 'badge';
      if (
        classText.includes('card') ||
        classText.includes('tile') ||
        classText.includes('panel') ||
        hasCardShape(element, style, rect)
      ) {
        return 'card';
      }
      return null;
    }

    function textSampleFor(element: Element): string {
      return (element.textContent ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80);
    }

    function componentStyleScore(
      kind: string,
      style: CSSStyleDeclaration,
      rect: DOMRect,
      textSample: string,
      childElementCount: number,
    ): number {
      let score = 0;
      if (kind === 'button') score += 7;
      if (kind === 'navigation') score += 5;
      if (kind === 'card') score += 4;
      if (kind === 'input') score += 3;
      if (normalizeColor(style.backgroundColor) !== 'transparent') score += 5;
      if (hasVisibleBorder(style)) score += 4;
      if (numericPx(style.borderRadius) > 0) score += 4;
      if (style.boxShadow !== 'none') score += 4;
      if (
        numericPx(style.paddingTop) +
          numericPx(style.paddingRight) +
          numericPx(style.paddingBottom) +
          numericPx(style.paddingLeft) >
        0
      ) {
        score += 3;
      }
      if (textSample.length > 0) score += 1;
      if (rect.width >= 32 && rect.height >= 24) score += 1;
      if (rect.width >= 120 && rect.height >= 60) score += 1;
      if (childElementCount > 6 && !hasVisiblePaint(style)) score -= 4;
      return score;
    }

    function bodyOrHtmlBg(): string {
      const bodyBg = normalizeColor(
        window.getComputedStyle(document.body).backgroundColor,
      );
      if (bodyBg && bodyBg !== 'transparent') return bodyBg;
      return normalizeColor(
        window.getComputedStyle(document.documentElement).backgroundColor,
      );
    }

    // The canvas is whatever is actually PAINTED across the first viewport, not
    // the computed body background. Dark-themed pages (e.g. Framer) set body to a
    // dark color but render a full-bleed light section on top of it; sampling the
    // topmost painted background at a grid of points respects that stacking/
    // occlusion via elementFromPoint, where reading body's computed style cannot.
    function bgAtPoint(x: number, y: number): string {
      let element = document.elementFromPoint(x, y);
      while (element && element !== document.documentElement) {
        const bg = normalizeColor(
          window.getComputedStyle(element).backgroundColor,
        );
        if (bg && bg !== 'transparent') return bg;
        element = element.parentElement;
      }
      return bodyOrHtmlBg();
    }

    function sampledCanvasColor(): string {
      const counts = new Map<string, number>();
      const cols = 9;
      const rows = 6;
      for (let i = 1; i <= cols; i += 1) {
        for (let j = 1; j <= rows; j += 1) {
          const x = (window.innerWidth * i) / (cols + 1);
          const y = (window.innerHeight * j) / (rows + 1);
          const bg = bgAtPoint(x, y);
          if (!bg || bg === 'transparent') continue;
          counts.set(bg, (counts.get(bg) ?? 0) + 1);
        }
      }
      let best = '';
      let bestHits = 0;
      for (const [color, hits] of counts) {
        if (hits > bestHits) {
          best = color;
          bestHits = hits;
        }
      }
      return best || bodyOrHtmlBg();
    }

    const colors: RawPageEvidence['colors'] = [];
    const gradients: RawPageEvidence['gradients'] = [];
    const typography: RawPageEvidence['typography'] = [];
    const componentCandidates: Array<
      RawPageEvidence['components'][number] & { score: number; order: number }
    > = [];

    const rootBackground = sampledCanvasColor();

    if (rootBackground && rootBackground !== 'transparent') {
      colors.push({
        value: rootBackground,
        property: 'backgroundColor',
        selector: 'html',
        area: Math.round(window.innerWidth * window.innerHeight),
        aboveFold: true,
      });
    }

    const motionDurations = new Set<string>();
    const motionEasings = new Set<string>();
    let backgroundImageCount = 0;

    const elements = Array.from(
      document.querySelectorAll('body, body *'),
    ).filter(isVisible);

    for (const [order, element] of elements.entries()) {
      const style = window.getComputedStyle(element);
      const selector = selectorPath(element);
      const rect = element.getBoundingClientRect();

      if (
        style.backgroundImage &&
        style.backgroundImage !== 'none' &&
        style.backgroundImage.includes('url(')
      ) {
        backgroundImageCount += 1;
      }

      const transitionDuration = style.transitionDuration;
      const animationDuration = style.animationDuration;
      const hasMotion =
        /[1-9]/.test(transitionDuration) || /[1-9]/.test(animationDuration);
      if (hasMotion) {
        for (const dur of `${transitionDuration}, ${animationDuration}`.split(
          ',',
        )) {
          const d = dur.trim();
          if (d && d !== '0s' && d !== '0ms') motionDurations.add(d);
        }
        for (const ease of `${style.transitionTimingFunction}, ${style.animationTimingFunction}`.split(
          /,(?![^(]*\))/, // split on commas NOT inside cubic-bezier(...)
        )) {
          const e = ease.trim();
          if (e && e !== 'ease') motionEasings.add(e);
        }
      }

      for (const property of ['color', 'backgroundColor', 'borderColor']) {
        const value = (style as CSSStyleDeclaration & Record<string, string>)[
          property
        ];
        if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
          colors.push({
            value: normalizeColor(value),
            property,
            selector,
            area: Math.round(rect.width * rect.height),
            aboveFold: rect.top < window.innerHeight,
          });
        }
      }

      const bgImage = style.backgroundImage;
      if (bgImage && bgImage !== 'none' && /gradient\(/i.test(bgImage)) {
        gradients.push({
          value: normalizeColorsInCssValue(bgImage),
          selector,
        });
      }

      typography.push({
        selector,
        role: roleFor(element),
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
      });

      const kind = componentKind(element, style, rect);
      if (kind) {
        const textSample = textSampleFor(element);
        componentCandidates.push({
          kind,
          selector,
          textSample,
          styles: {
            color: normalizeColor(style.color),
            backgroundColor: normalizeColor(style.backgroundColor),
            border: borderValue(style),
            borderRadius: style.borderRadius,
            padding: style.padding,
            boxShadow: normalizeColorsInCssValue(style.boxShadow),
            font: style.font,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
          },
          bounds: { width: rect.width, height: rect.height },
          score: componentStyleScore(
            kind,
            style,
            rect,
            textSample,
            element.children.length,
          ),
          order,
        });
      }
    }

    const components = componentCandidates
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.order - b.order;
      })
      .slice(0, maxComponents)
      .map((component) => ({
        kind: component.kind,
        selector: component.selector,
        textSample: component.textSample,
        styles: component.styles,
        bounds: component.bounds,
      }));

    // Capture self-hosted @font-face rules so the report can render samples in
    // the site's real typeface. src URLs are resolved to absolute against their
    // stylesheet; woff2 is preferred. Cross-origin stylesheets (e.g. Google
    // Fonts) throw on .cssRules and are skipped — those samples fall back to name.
    const fontFaces: RawPageEvidence['fontFaces'] = [];
    const seenFace = new Set<string>();
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList | null = null;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        if (rule.type !== 5) continue; // CSSRule.FONT_FACE_RULE
        const faceStyle = (rule as CSSFontFaceRule).style;
        const family = faceStyle
          .getPropertyValue('font-family')
          .replace(/['"]/g, '')
          .trim();
        const srcRaw = faceStyle.getPropertyValue('src');
        if (!family || !srcRaw) continue;
        const urlMatch =
          srcRaw.match(/url\(\s*['"]?([^'")]+\.woff2)[^)]*\)/i) ||
          srcRaw.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
        if (!urlMatch) continue;
        let src: string;
        try {
          src = new URL(urlMatch[1], sheet.href || location.href).href;
        } catch {
          continue;
        }
        const weight =
          faceStyle.getPropertyValue('font-weight').trim() || '400';
        const fontStyle =
          faceStyle.getPropertyValue('font-style').trim() || 'normal';
        const key = `${family}|${weight}|${fontStyle}`;
        if (seenFace.has(key)) continue;
        seenFace.add(key);
        fontFaces.push({ family, weight, style: fontStyle, src });
        if (fontFaces.length >= 24) break;
      }
      if (fontFaces.length >= 24) break;
    }

    const layoutSections = Array.from(
      document.querySelectorAll(
        'section, main, article, header, footer, [class*="section"], [class*="container"], [class*="wrapper"]',
      ),
    ).filter(isVisible);

    const containerWidths: number[] = [];
    const sectionTops: number[] = [];

    for (const el of layoutSections) {
      const elStyle = window.getComputedStyle(el);
      const elRect = el.getBoundingClientRect();
      const mw = numericPx(elStyle.maxWidth);
      const cw = mw > 200 && mw < window.innerWidth - 1 ? mw : elRect.width;
      if (cw > 200 && cw < window.innerWidth - 1) {
        containerWidths.push(Math.round(cw));
      }
      sectionTops.push(Math.round(elRect.top + window.scrollY));
    }

    const sortedTops = sectionTops.slice().sort((a, b) => a - b);
    const sectionGaps: number[] = [];
    for (let i = 1; i < sortedTops.length; i++) {
      const gap = (sortedTops[i] ?? 0) - (sortedTops[i - 1] ?? 0);
      if (gap > 8 && gap < 400) sectionGaps.push(gap);
    }

    const imgElements = Array.from(document.querySelectorAll('img'));
    let photos = 0;
    let smallImages = 0;
    for (const img of imgElements) {
      const rect = img.getBoundingClientRect();
      const area = rect.width * rect.height;
      if (area >= 200 * 200) photos += 1;
      else if (area > 0) smallImages += 1;
    }
    const svgCount = document.querySelectorAll('svg').length;
    const videoCount = document.querySelectorAll('video').length;
    const imagery = {
      images: imgElements.length,
      photos,
      icons: smallImages + svgCount,
      videos: videoCount,
      backgroundImages: backgroundImageCount,
    };

    return {
      colors,
      gradients,
      typography,
      components,
      fontFaces,
      motion: {
        durations: Array.from(motionDurations).slice(0, 16),
        easings: Array.from(motionEasings).slice(0, 16),
      },
      containerWidths,
      sectionGaps,
      imagery,
      rootBackground: rootBackground || undefined,
    };
  }, options);
}
