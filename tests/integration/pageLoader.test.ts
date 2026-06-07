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

  it('keeps scrolling past 12 screens while lazy-loading grows the page', async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    // The page starts ~1 screen tall and grows by 2000px each time the bottom is
    // neared, up to ~19000px (19 screens) — past the old fixed 12-screen cap. The
    // bottom marker only reveals once it scrolls into view, which requires the
    // adaptive loop to follow the growing height.
    const html = `
      <div id="grower" style="height: 1000px"></div>
      <p id="end" style="opacity: 0" data-seen="no">end</p>
      <script>
        let grown = 0;
        window.addEventListener('scroll', () => {
          const nearBottom =
            window.scrollY + window.innerHeight >=
            document.documentElement.scrollHeight - 200;
          if (nearBottom && grown < 18000) {
            grown += 2000;
            document.getElementById('grower').style.height = (1000 + grown) + 'px';
          }
        });
        new IntersectionObserver((entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              const el = document.getElementById('end');
              el.style.opacity = '1';
              el.setAttribute('data-seen', 'yes');
            }
          }
        }).observe(document.getElementById('end'));
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
      const seen = await page.evaluate(() =>
        document.getElementById('end')?.getAttribute('data-seen'),
      );
      await page.close();
      expect(seen).toBe('yes'); // adaptive scroll followed the growing page to the end
    } finally {
      await context.close();
      await browser.close();
    }
  }, 20000);
});
