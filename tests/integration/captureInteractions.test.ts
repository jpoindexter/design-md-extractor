import { chromium } from 'playwright';
import { describe, expect, it } from 'vitest';
import { captureLiveInteractions } from '../../src/extract/captureInteractions.js';

describe('captureLiveInteractions', () => {
  it('captures a JS-driven hover effect (mouseenter handler)', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    await page.setContent(`
        <button id="b" style="background: rgb(0, 0, 0); color: rgb(255,255,255)">Hi</button>
        <script>
          const b = document.getElementById('b');
          b.addEventListener('mouseenter', () => { b.style.background = 'rgb(255, 0, 0)'; });
          b.addEventListener('mouseleave', () => { b.style.background = 'rgb(0, 0, 0)'; });
        </script>
      `);
    const states = await captureLiveInteractions(page, [
      { kind: 'button', selector: '#b' },
    ]);
    await browser.close();
    const hover = states.find((s) => s.state === 'hover');
    expect(hover).toBeDefined();
    expect(hover?.declarations.backgroundColor).toBe('rgb(255, 0, 0)');
    expect(hover?.source).toBe('live');
  }, 20000);

  it('skips invalid/missing selectors without throwing', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    await page.setContent('<div>nothing</div>');
    const states = await captureLiveInteractions(page, [
      { kind: 'button', selector: '#does-not-exist' },
      { kind: 'card', selector: 'div:::bad' },
    ]);
    await browser.close();
    expect(states).toEqual([]);
  }, 20000);
});
