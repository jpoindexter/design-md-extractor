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

// Adaptive scroll-through to trigger lazy-loaded / IntersectionObserver content,
// then return to the top so first-viewport capture stays correct. Keeps going as
// long as lazy-loading keeps growing the page, so long pages fully load — while a
// time budget plus a height-stabilization check stop infinite-scroll pages from
// hanging the load. `budgetMs` bounds total time; a hard step cap is the backstop.
async function scrollThroughPage(page: Page, budgetMs = 8000): Promise<void> {
  await page
    .evaluate(async (budget: number) => {
      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      const startedAt = Date.now();
      const step = window.innerHeight || 800;
      const hardCap = 200; // backstop: never more than 200 steps
      let y = step;
      let steps = 0;
      let lastHeight = 0;
      let stablePasses = 0;

      while (steps < hardCap && Date.now() - startedAt < budget) {
        window.scrollTo(0, y);
        await sleep(150);
        const height = document.documentElement.scrollHeight;
        // Stop once we've reached the bottom AND the page height has settled
        // for two consecutive passes (lazy-loading has stopped extending it).
        if (y >= height) {
          if (height === lastHeight) {
            stablePasses += 1;
            if (stablePasses >= 2) break;
          } else {
            stablePasses = 0;
          }
        }
        lastHeight = height;
        y += step;
        steps += 1;
      }

      window.scrollTo(0, 0);
      await sleep(100);
    }, budgetMs)
    .catch(() => undefined);
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
    await scrollThroughPage(page);
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
