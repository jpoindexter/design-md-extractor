import type { Browser, Page } from 'playwright';
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
    const visibleElements = Array.from(document.querySelectorAll('body *')).filter((element) => {
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
      document.getAnimations
        ?.()
        .filter((animation) => {
          const timing = animation.effect?.getTiming();
          return animation.playState === 'running' && timing?.iterations !== Infinity;
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
    if (waitedLongEnough && stableLongEnough && signature.finiteRunningAnimations === 0) {
      return;
    }

    await page.waitForTimeout(visualSettle.pollMs);
  }
}

export async function newLoadedPage(input: {
  browser: Browser;
  url: string;
  viewport: ViewportConfig;
  timeoutMs: number;
}): Promise<Page> {
  const page = await input.browser.newPage({
    viewport: { width: input.viewport.width, height: input.viewport.height },
  });
  await page.goto(input.url, { waitUntil: 'domcontentloaded', timeout: input.timeoutMs });
  await page.waitForLoadState('load', { timeout: Math.min(input.timeoutMs, 3000) }).catch(() => undefined);
  await page.evaluate(() => document.fonts?.ready).catch(() => undefined);
  await waitForVisualSettle(page);
  return page;
}
