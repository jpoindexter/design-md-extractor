export function utilsJs(): string {
  return `
      function escapeHtml(value) {
        return String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function slug(value) {
        return String(value ?? '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 40) || 'token';
      }

      function confidenceRank(value) {
        if (value === 'high') return 3;
        if (value === 'medium') return 2;
        return 1;
      }

      function normalizeList(input) {
        return Array.isArray(input) ? input : [];
      }

      function safeColorValue(input) {
        const value = String(input ?? '').trim();
        if (!value) return '#d9ddd7';
        if (/^[#a-zA-Z0-9(),.%\\s+-]+$/.test(value)) return value;
        return '#d9ddd7';
      }

      function safeCssValue(input, fallback) {
        const value = String(input ?? '').trim();
        if (!value) return fallback;
        if (/[;{}<>]/.test(value)) return fallback;
        return value;
      }

      function cssTokenValue(input, fallback) {
        return safeCssValue(input, fallback)
          .replace(/3\\.35544e\\+07px/g, '999px')
          .replace(/calc\\([^)]*\\)/g, fallback);
      }

      function isTransparentColor(value) {
        const normalized = String(value || '').trim().toLowerCase();
        return !normalized || normalized === 'transparent' || normalized === 'rgba(0, 0, 0, 0)' || normalized === '#00000000';
      }

      function visibleComponentBackground(component, tokenData) {
        const styles = component && component.styles ? component.styles : {};
        if (styles.backgroundColor && !isTransparentColor(styles.backgroundColor)) {
          return cssTokenValue(styles.backgroundColor, '#ffffff');
        }
        if (currentTheme && currentTheme.surface) return currentTheme.surface;
        return selectCanvasColor(tokenData || {});
      }

      function visibleComponentBorder(component) {
        const styles = component && component.styles ? component.styles : {};
        const border = String(styles.border || '').trim();
        if (border) {
          return cssTokenValue(border, '1px solid rgba(0,0,0,0.18)');
        }
        return '0 solid transparent';
      }

      function readableComponentText(component, background) {
        const styles = component && component.styles ? component.styles : {};
        const color = cssTokenValue(styles.color, '');
        if (color && Math.abs(colorLuminance(color) - colorLuminance(background)) >= 0.34) {
          return color;
        }
        return contrastTextColor(background);
      }

      function styleForComponent(component) {
        const styles = component && component.styles ? component.styles : {};
        const bounds = component && component.bounds ? component.bounds : {};
        const minWidth = bounds.width ? Math.min(Math.max(Number(bounds.width), 36), 220) + 'px' : '36px';
        const minHeight = bounds.height ? Math.min(Math.max(Number(bounds.height), 28), 72) + 'px' : '28px';
        return [
          'color:' + cssTokenValue(styles.color, 'inherit'),
          'background:' + cssTokenValue(styles.backgroundColor, 'transparent'),
          'border:' + cssTokenValue(styles.border, '1px solid currentColor'),
          'border-radius:' + cssTokenValue(styles.borderRadius, '0px'),
          'padding:' + cssTokenValue(styles.padding, '8px 12px'),
          'font-family:' + cssTokenValue(styles.fontFamily, 'inherit'),
          'font-size:' + cssTokenValue(styles.fontSize, '13px'),
          'font-weight:' + cssTokenValue(styles.fontWeight, '500'),
          'box-shadow:' + cssTokenValue(styles.boxShadow, 'none'),
          'min-width:' + minWidth,
          'min-height:' + minHeight,
        ].join(';');
      }

      function specimenStyleForComponent(component, tokenData) {
        const styles = component && component.styles ? component.styles : {};
        const kind = String(component && component.kind ? component.kind : '').toLowerCase();
        // "atoms" stay intrinsic + centered; "containers" fill a uniform box so
        // every specimen renders at the same size (the STYLE is what we preview,
        // not the original element's bounds — which made every card a different size).
        const isAtom = kind === 'button' || kind === 'link' || kind === 'badge';
        const promotesColorToBackground =
          isAtom &&
          (!styles.backgroundColor || isTransparentColor(styles.backgroundColor)) &&
          styles.color &&
          !isTransparentColor(styles.color);
        const background = promotesColorToBackground ? cssTokenValue(styles.color, '#111111') : visibleComponentBackground(component, tokenData);
        const textColor = promotesColorToBackground ? contrastTextColor(background) : readableComponentText(component, background);
        // Atoms keep their real padding (it shapes the pill); containers use a
        // comfortable fixed padding so the sample text sits nicely inset, never
        // jammed into the corner. The real padding is still shown in the meta + copy.
        const paddingRule = isAtom
          ? 'padding:' + cssTokenValue(styles.padding, '8px 12px')
          : 'padding: 18px 20px';
        const sizeRules = isAtom
          ? ['min-width: 88px', 'min-height: 38px', 'max-width: 100%']
          : ['width: 100%', 'height: 124px'];
        return [
          'color:' + textColor,
          'background:' + background,
          'border:' + visibleComponentBorder(component),
          'border-radius:' + cssTokenValue(styles.borderRadius, '0px'),
          paddingRule,
          'font-family:' + cssTokenValue(styles.fontFamily, 'inherit'),
          'font-size:' + cssTokenValue(styles.fontSize, '13px'),
          'font-weight:' + cssTokenValue(styles.fontWeight, '500'),
          'box-shadow:' + cssTokenValue(styles.boxShadow, 'none'),
          ...sizeRules,
        ].join(';');
      }

      function dedupeRepeatedText(text) {
        // collapse "Enable SoundEnable Sound" -> "Enable Sound" (sr-only + visible label both extracted)
        var t = String(text || '');
        var half = Math.floor(t.length / 2);
        var a = t.slice(0, half).trim();
        var b = t.slice(t.length - a.length).trim();
        if (a.length >= 4 && a === b) return a;
        var spaced = t.slice(0, half).trim();
        if (spaced.length >= 4 && t.slice(half).trim() === spaced) return spaced;
        return t;
      }

      function cleanComponentLabel(component, fallback) {
        const kind = String(component && component.kind ? component.kind : 'component').toLowerCase();
        const raw = dedupeRepeatedText(String(component && component.textSample ? component.textSample : '').replace(/\\s+/g, ' ').trim());
        const hasReadableSpacing = /\\s/.test(raw);
        const looksLikeMergedCopy = raw.length > 18 && !hasReadableSpacing;
        const hasSuspiciousWord = raw.split(/\\s+/).some((word) => word.length > 14);
        if (!raw || looksLikeMergedCopy || hasSuspiciousWord) {
          return fallback || component?.name || (kind.charAt(0).toUpperCase() + kind.slice(1));
        }
        return raw.slice(0, 72);
      }

      function componentArea(component) {
        const bounds = component && component.bounds ? component.bounds : {};
        return Math.max(0, Number(bounds.width || 0)) * Math.max(0, Number(bounds.height || 0));
      }

      function componentPreviewScore(component) {
        const kind = String(component && component.kind ? component.kind : '').toLowerCase();
        const styles = component && component.styles ? component.styles : {};
        const area = componentArea(component);
        const hasText = Boolean(String(component && component.textSample ? component.textSample : '').trim());
        const kindBonus = kind === 'button' || kind === 'navigation' || kind === 'card' ? 20 : 8;
        const visibleStyleBonus =
          (styles.backgroundColor && !isTransparentColor(styles.backgroundColor) ? 10 : 0) +
          (styles.color && !isTransparentColor(styles.color) ? 6 : 0) +
          (styles.borderRadius && styles.borderRadius !== '0px' ? 5 : 0) +
          (styles.padding && styles.padding !== '0px' ? 4 : 0);
        return kindBonus + visibleStyleBonus + (hasText ? 8 : 0) + Math.min(area / 12000, 10);
      }

      function pickPreviewComponents(components) {
        const ranked = normalizeList(components)
          .filter((component) => component && component.styles)
          .slice()
          .sort((a, b) => componentPreviewScore(b) - componentPreviewScore(a));
        const chosen = [];
        const seenKinds = new Set();
        ranked.forEach((component) => {
          const kind = String(component.kind || component.name || 'component').toLowerCase();
          if (chosen.length < 4 && !seenKinds.has(kind)) {
            chosen.push(component);
            seenKinds.add(kind);
          }
        });
        ranked.forEach((component) => {
          if (chosen.length < 4 && !chosen.includes(component)) chosen.push(component);
        });
        return chosen.slice(0, 4);
      }
  `;
}
