import type { BrowserContext, Page } from 'playwright';
import type { ViewportConfig } from '../config/viewports.js';

type VisualSignature = {
  key: string;
  finiteRunningAnimations: number;
};

const visualSettle = {
  minMs: 800,
  stableMs: 300,
  pollMs: 100,
  timeoutMs: 2500,
};

async function readVisualSignature(page: Page): Promise<VisualSignature> {
  return page.evaluate(() => {
    const visibleElements = Array.from(
      document.querySelectorAll('body *'),
    ).filter((element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      );
    }).length;

    const finiteRunningAnimations =
      document.getAnimations?.().filter((animation) => {
        const timing = animation.effect?.getTiming();
        return (
          animation.playState === 'running' && timing?.iterations !== Infinity
        );
      }).length ?? 0;

    return {
      key: JSON.stringify({
        text: document.body?.innerText.trim().slice(0, 2500) ?? '',
        visibleElements,
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      }),
      finiteRunningAnimations,
    };
  });
}

async function waitForVisualSettle(page: Page): Promise<void> {
  const startedAt = Date.now();
  let lastKey = '';
  let stableSince = startedAt;

  while (Date.now() - startedAt < visualSettle.timeoutMs) {
    const signature = await readVisualSignature(page);
    const now = Date.now();

    if (signature.key !== lastKey) {
      lastKey = signature.key;
      stableSince = now;
    }

    const waitedLongEnough = now - startedAt >= visualSettle.minMs;
    const stableLongEnough = now - stableSince >= visualSettle.stableMs;
    if (
      waitedLongEnough &&
      stableLongEnough &&
      signature.finiteRunningAnimations === 0
    ) {
      return;
    }

    await page.waitForTimeout(visualSettle.pollMs);
  }
}

async function isChallengePage(page: Page): Promise<boolean> {
  return page
    .evaluate(() => {
      const title = document.title.toLowerCase();
      if (
        title.includes('just a moment') ||
        title.includes('attention required') ||
        title.includes('verifying you are human')
      ) {
        return true;
      }
      return Boolean(
        document.querySelector(
          '#challenge-form, #cf-challenge-running, .cf-turnstile, [id*="cf-chl"]',
        ),
      );
    })
    .catch(() => false);
}

// When a session window lands on a Cloudflare/Turnstile interstitial, give the
// human time to clear it (headed persistent mode) before we read the page. A
// no-op on normal pages, so CI/none-mode loads are unaffected.
async function waitForChallengeClear(
  page: Page,
  timeoutMs: number,
): Promise<void> {
  if (!(await isChallengePage(page))) return;
  const deadline = Date.now() + Math.max(timeoutMs, 60000);
  while (Date.now() < deadline) {
    await page.waitForTimeout(1000);
    if (!(await isChallengePage(page))) return;
  }
}

export async function newLoadedPage(input: {
  context: BrowserContext;
  url: string;
  viewport: ViewportConfig;
  timeoutMs: number;
}): Promise<Page> {
  const page = await input.context.newPage();
  try {
    await page.setViewportSize({
      width: input.viewport.width,
      height: input.viewport.height,
    });
    await page.goto(input.url, {
      waitUntil: 'domcontentloaded',
      timeout: input.timeoutMs,
    });
    await page
      .waitForLoadState('load', { timeout: Math.min(input.timeoutMs, 3000) })
      .catch(() => undefined);
    await waitForChallengeClear(page, input.timeoutMs);
    await page.evaluate(() => document.fonts?.ready).catch(() => undefined);
    await waitForVisualSettle(page);
    return page;
  } catch (error) {
    // A goto/challenge/settle failure must not leave an open page in the
    // shared context (gated sites hit this path often).
    await page.close().catch(() => undefined);
    throw error;
  }
}
