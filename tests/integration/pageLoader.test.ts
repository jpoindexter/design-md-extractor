import { chromium } from 'playwright';
import { describe, expect, it } from 'vitest';
import { newLoadedPage } from '../../src/crawl/pageLoader.js';

describe('newLoadedPage', () => {
  it('waits for delayed visible content before returning the page', async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
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
        context,
        url,
        viewport: { name: 'desktop', width: 1440, height: 1000 },
        timeoutMs: 5000,
      });

      const display = await page.evaluate(
        () => getComputedStyle(document.getElementById('hero')!).display,
      );
      await page.close();

      expect(display).toBe('block');
    } finally {
      await context.close();
      await browser.close();
    }
  });

  it('reveals lazy IntersectionObserver content via the scroll-through pass', async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const html = `
      <main style="height: 4000px">
        <div id="spacer" style="height: 3000px"></div>
        <p id="lazy" style="opacity: 0" data-revealed="no">Lazy content</p>
      </main>
      <script>
        const el = document.getElementById('lazy');
        new IntersectionObserver((entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              el.style.opacity = '1';
              el.setAttribute('data-revealed', 'yes');
            }
          }
        }).observe(el);
      </script>
    `;
    const url = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    try {
      const page = await newLoadedPage({
        context,
        url,
        viewport: { name: 'desktop', width: 1440, height: 1000 },
        timeoutMs: 5000,
      });
      const revealed = await page.evaluate(() =>
        document.getElementById('lazy')?.getAttribute('data-revealed'),
      );
      const scrollY = await page.evaluate(() => window.scrollY);
      await page.close();
      expect(revealed).toBe('yes'); // scroll-through tripped the observer
      expect(scrollY).toBe(0); // returned to top for correct first-viewport capture
    } finally {
      await context.close();
      await browser.close();
    }
  });
});
