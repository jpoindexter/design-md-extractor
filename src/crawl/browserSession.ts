import { chromium, type Browser } from 'playwright';

export async function withBrowser<T>(callback: (browser: Browser) => Promise<T>): Promise<T> {
  const browser = await chromium.launch();
  try {
    return await callback(browser);
  } finally {
    await browser.close();
  }
}
