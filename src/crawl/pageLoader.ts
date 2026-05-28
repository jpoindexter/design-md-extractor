import type { Browser, Page } from 'playwright';
import type { ViewportConfig } from '../config/viewports.js';

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
  return page;
}
