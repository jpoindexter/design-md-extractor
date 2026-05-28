import { chromium } from 'playwright';
import { describe, expect, it } from 'vitest';
import { newLoadedPage } from '../../src/crawl/pageLoader.js';

describe('newLoadedPage', () => {
  it('waits for delayed visible content before returning the page', async () => {
    const browser = await chromium.launch();
    const html = `
      <main>
        <h1 id="hero" style="display: none; color: rgb(255, 59, 21)">Delayed Hero</h1>
      </main>
      <script>
        setTimeout(() => {
          document.getElementById('hero').style.display = 'block';
        }, 500);
      </script>
    `;
    const url = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

    try {
      const page = await newLoadedPage({
        browser,
        url,
        viewport: { name: 'desktop', width: 1440, height: 1000 },
        timeoutMs: 5000,
      });

      const display = await page.evaluate(() => getComputedStyle(document.getElementById('hero')!).display);
      await page.close();

      expect(display).toBe('block');
    } finally {
      await browser.close();
    }
  });
});
