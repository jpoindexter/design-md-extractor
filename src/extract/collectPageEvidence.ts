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
    function toHex(value: string): string {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!match) return value;
      const [, r, g, b] = match;
      return `#${[r, g, b].map((part) => Number(part).toString(16).padStart(2, '0')).join('')}`;
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

    function componentKind(element: Element): string | null {
      const tag = element.tagName.toLowerCase();
      const classText = element.className.toString().toLowerCase();
      if (tag === 'button' || element.getAttribute('role') === 'button' || classText.includes('button')) {
        return 'button';
      }
      if (['input', 'textarea', 'select'].includes(tag)) return 'input';
      if (classText.includes('card')) return 'card';
      if (tag === 'nav') return 'navigation';
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
          colors.push({ value: toHex(value), property, selector });
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

      const kind = componentKind(element);
      if (kind && components.length < maxComponents) {
        const rect = element.getBoundingClientRect();
        components.push({
          kind,
          selector,
          textSample: element.textContent?.trim().slice(0, 80) ?? '',
          styles: {
            color: toHex(style.color),
            backgroundColor: toHex(style.backgroundColor),
            borderRadius: style.borderRadius,
            padding: style.padding,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            boxShadow: style.boxShadow,
            border: style.border,
          },
          bounds: { width: rect.width, height: rect.height },
        });
      }
    }

    return { colors, typography, components };
  }, options);
}
