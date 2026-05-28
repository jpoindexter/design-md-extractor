import type { Page } from 'playwright';

export type RawPageEvidence = {
  colors: Array<{ value: string; property: string; selector: string }>;
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

    function rgbToHex(red: number | string, green: number | string, blue: number | string): string {
      return `#${[red, green, blue]
        .map((part) => Math.max(0, Math.min(255, Math.round(Number(part)))).toString(16).padStart(2, '0'))
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

      const rgbMatch = trimmed.match(/rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
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

      const [red, green, blue, alpha] = colorContext.getImageData(0, 0, 1, 1).data;
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
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }

    function roleFor(element: Element): string {
      const tag = element.tagName.toLowerCase();
      if (tag.match(/^h[1-6]$/)) return 'heading';
      if (tag === 'p' || tag === 'li') return 'body';
      if (tag === 'button' || element.getAttribute('role') === 'button') return 'button';
      if (tag === 'a') return element.className.toString().includes('button') ? 'button' : 'link';
      return 'text';
    }

    function hasVisiblePaint(style: CSSStyleDeclaration): boolean {
      return (
        normalizeColor(style.backgroundColor) !== 'transparent' ||
        normalizeColor(style.borderColor) !== 'transparent' ||
        style.boxShadow !== 'none'
      );
    }

    function hasButtonShape(style: CSSStyleDeclaration, rect: DOMRect): boolean {
      return (
        rect.width >= 24 &&
        rect.height >= 18 &&
        (numericPx(style.paddingLeft) + numericPx(style.paddingRight) > 8 || numericPx(style.borderRadius) > 0) &&
        hasVisiblePaint(style)
      );
    }

    function hasCardShape(element: Element, style: CSSStyleDeclaration, rect: DOMRect): boolean {
      if (element === document.body || element === document.documentElement) return false;
      return (
        rect.width >= 120 &&
        rect.height >= 60 &&
        hasVisiblePaint(style) &&
        (numericPx(style.borderRadius) > 0 || style.boxShadow !== 'none' || normalizeColor(style.borderColor) !== 'transparent')
      );
    }

    function numericPx(value: string): number {
      const match = value.match(/([\\d.]+)/);
      return match ? Number.parseFloat(match[1]) : 0;
    }

    function componentKind(element: Element, style: CSSStyleDeclaration, rect: DOMRect): string | null {
      const tag = element.tagName.toLowerCase();
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
      if (tag === 'nav' || tag === 'header' || classText.includes('nav')) return 'navigation';
      if (classText.includes('badge') || classText.includes('pill')) return 'badge';
      if (classText.includes('card') || classText.includes('tile') || classText.includes('panel') || hasCardShape(element, style, rect)) {
        return 'card';
      }
      return null;
    }

    const elements = Array.from(document.querySelectorAll('body, body *')).filter(isVisible);
    const colors: RawPageEvidence['colors'] = [];
    const typography: RawPageEvidence['typography'] = [];
    const components: RawPageEvidence['components'] = [];

    for (const element of elements) {
      const style = window.getComputedStyle(element);
      const selector = selectorPath(element);

      for (const property of ['color', 'backgroundColor', 'borderColor']) {
        const value = (style as CSSStyleDeclaration & Record<string, string>)[property];
        if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
          colors.push({ value: normalizeColor(value), property, selector });
        }
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

      const rect = element.getBoundingClientRect();
      const kind = componentKind(element, style, rect);
      if (kind && components.length < maxComponents) {
        components.push({
          kind,
          selector,
          textSample: element.textContent?.trim().slice(0, 80) ?? '',
          styles: {
            color: normalizeColor(style.color),
            backgroundColor: normalizeColor(style.backgroundColor),
            borderRadius: style.borderRadius,
            padding: style.padding,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            boxShadow: normalizeColorsInCssValue(style.boxShadow),
            border: borderValue(style),
          },
          bounds: { width: rect.width, height: rect.height },
        });
      }
    }

    return { colors, typography, components };
  }, options);
}
