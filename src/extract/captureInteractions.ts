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
      { selector, props: [...STATE_PROPS] },
    )
    .catch(() => null);
}

// A state change only matters if it's visible. Filter out invisible churn
// (a focus ring of width 0 / style none, opacity returning to 1, transform none)
// so the captured states are real visual effects, not computed-style noise.
function isMeaningful(prop: string, value: string): boolean {
  if (!value || value === 'none' || value === 'normal') return false;
  if (prop === 'outline' && (value.includes('none') || /\b0px\b/.test(value))) {
    return false;
  }
  if (prop === 'opacity' && value === '1') return false;
  return true;
}

function diff(
  base: Record<string, string>,
  next: Record<string, string>,
): Record<string, string> {
  const changes: Record<string, string> = {};
  for (const prop of STATE_PROPS) {
    const before = base[prop] ?? '';
    const after = next[prop] ?? '';
    if (after !== before && isMeaningful(prop, after)) {
      changes[prop] = after;
    }
  }
  return changes;
}

/**
 * Trigger real hover (and focus for inputs/buttons) on detected components and
 * record the visible computed-style changes. Catches JS-driven hover that CSS-rule
 * parsing misses. Fully defensive: any selector/timeout failure skips that
 * component without failing the run. Bounded by `limit` elements AND a total
 * `budgetMs` wall-clock budget so a slow page can't blow up extraction time;
 * actionability waits are kept short for the same reason. Settles briefly after
 * each trigger so CSS transitions reach their target before the read.
 */
export async function captureLiveInteractions(
  page: Page,
  components: ComponentRef[],
  options: { limit?: number; budgetMs?: number } = {},
): Promise<LiveInteractionState[]> {
  const limit = options.limit ?? 10;
  const budgetMs = options.budgetMs ?? 8000;
  const deadline = Date.now() + budgetMs;
  const actionTimeout = 350;

  const results: LiveInteractionState[] = [];
  const seen = new Set<string>();
  let processed = 0;

  for (const component of components) {
    if (processed >= limit || Date.now() > deadline) break;
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
      await locator.hover({ timeout: actionTimeout });
      await page.waitForTimeout(180);
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
    } catch {
      // not hoverable — skip hover for this element
    }

    // FOCUS (inputs and buttons mainly)
    if (component.kind === 'input' || component.kind === 'button') {
      try {
        await locator.focus({ timeout: actionTimeout });
        await page.waitForTimeout(100);
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
