import type { Page } from 'playwright';

const STATE_PROPS = [
  'color',
  'backgroundColor',
  'borderColor',
  'boxShadow',
  'transform',
  'opacity',
  'outline',
  'textDecorationLine',
  'filter',
] as const;

export type LiveInteractionState = {
  state: 'hover' | 'focus';
  selector: string;
  declarations: Record<string, string>;
  source: 'live';
};

type ComponentRef = { kind: string; selector: string };

async function readStyles(
  page: Page,
  selector: string,
): Promise<Record<string, string> | null> {
  return page
    .evaluate(
      ({ selector, props }) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        const out: Record<string, string> = {};
        for (const p of props) {
          out[p] =
            (cs as CSSStyleDeclaration & Record<string, string>)[p] ?? '';
        }
        return out;
      },
      { selector, props: STATE_PROPS as unknown as string[] },
    )
    .catch(() => null);
}

function diff(
  base: Record<string, string>,
  next: Record<string, string>,
): Record<string, string> {
  const changes: Record<string, string> = {};
  for (const prop of STATE_PROPS) {
    const before = base[prop] ?? '';
    const after = next[prop] ?? '';
    // Ignore no-ops and the 'none'->'none' / empty churn.
    if (after && after !== before && after !== 'none' && after !== 'normal') {
      changes[prop] = after;
    }
  }
  return changes;
}

/**
 * Trigger real hover (and focus for inputs/buttons) on up to `limit` components
 * and record the computed-style changes. Catches JS-driven hover that CSS-rule
 * parsing misses. Fully defensive: any selector/timeout failure skips that
 * component without failing the run. Settles ~250ms after the trigger so CSS
 * transitions reach their target state before reading.
 */
export async function captureLiveInteractions(
  page: Page,
  components: ComponentRef[],
  limit = 12,
): Promise<LiveInteractionState[]> {
  const results: LiveInteractionState[] = [];
  const seen = new Set<string>();
  let processed = 0;

  for (const component of components) {
    if (processed >= limit) break;
    const selector = component.selector;
    if (!selector || seen.has(selector)) continue;
    seen.add(selector);

    let locator;
    try {
      locator = page.locator(selector).first();
      if ((await locator.count()) === 0) continue;
    } catch {
      continue; // invalid selector
    }
    processed += 1;

    const base = await readStyles(page, selector);
    if (!base) continue;

    // HOVER
    try {
      await locator.hover({ timeout: 800 });
      await page.waitForTimeout(250);
      const hovered = await readStyles(page, selector);
      if (hovered) {
        const changes = diff(base, hovered);
        if (Object.keys(changes).length > 0) {
          results.push({
            state: 'hover',
            selector,
            declarations: changes,
            source: 'live',
          });
        }
      }
      await page.mouse.move(0, 0); // reset hover
      await page.waitForTimeout(50);
    } catch {
      // not hoverable — skip hover for this element
    }

    // FOCUS (inputs and buttons mainly)
    if (component.kind === 'input' || component.kind === 'button') {
      try {
        await locator.focus({ timeout: 800 });
        await page.waitForTimeout(150);
        const focused = await readStyles(page, selector);
        if (focused) {
          const changes = diff(base, focused);
          if (Object.keys(changes).length > 0) {
            results.push({
              state: 'focus',
              selector,
              declarations: changes,
              source: 'live',
            });
          }
        }
        await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (el && 'blur' in el) (el as HTMLElement).blur();
        }, selector);
      } catch {
        // not focusable — skip
      }
    }
  }

  return results;
}
