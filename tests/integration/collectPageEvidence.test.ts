import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { describe, expect, it } from 'vitest';
import { collectPageEvidence } from '../../src/extract/collectPageEvidence.js';

describe('collectPageEvidence', () => {
  it('collects visible colors, typography, and components from a rendered page', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const html = await readFile(
      resolve('tests/fixtures/sample-site.html'),
      'utf8',
    );
    await page.setContent(html);

    const evidence = await collectPageEvidence(page, {
      viewport: 'desktop',
      maxComponents: 20,
    });
    await browser.close();

    expect(evidence.colors.some((color) => color.value === '#ff5900')).toBe(
      true,
    );
    expect(evidence.typography.some((type) => type.fontSize === '48px')).toBe(
      true,
    );
    expect(
      evidence.components.some((component) => component.kind === 'button'),
    ).toBe(true);
  });

  it('samples the painted canvas, not the body bg, when a light hero covers a dark body', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    // Dark body with a full-bleed white hero painted on top — the Framer/Webflow
    // pattern that made the ranker pick a dark canvas for a visually-white page.
    await page.setContent(`
      <style>
        html, body { margin: 0; }
        body { background: rgb(17, 17, 17); }
        .hero { width: 100vw; height: 100vh; background: #ffffff; }
        .footer { width: 100vw; height: 600px; background: rgb(17, 17, 17); }
      </style>
      <section class="hero"><h1>Visually white</h1></section>
      <section class="footer"></section>
    `);

    const evidence = await collectPageEvidence(page, {
      viewport: 'desktop',
      maxComponents: 20,
    });
    await browser.close();

    // Body computed bg is #111111, but the first viewport is painted white.
    expect(evidence.rootBackground).toBe('#ffffff');
  });

  it('normalizes modern browser color functions into reusable CSS colors', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    await page.setContent(`
      <style>
        button {
          color: oklab(0.46 0.09 -0.12);
          background: lab(82 -20 28);
          border: 2px solid color(display-p3 0.88 0.2 0.16);
          box-shadow: 0 0 0 1px oklab(0.46 0.09 -0.12 / 0.2);
        }
      </style>
      <button>Extract style</button>
    `);

    const evidence = await collectPageEvidence(page, {
      viewport: 'desktop',
      maxComponents: 20,
    });
    await browser.close();

    const button = evidence.components.find(
      (component) => component.kind === 'button',
    );
    const extractedValues = [
      ...evidence.colors.map((color) => color.value),
      button?.styles.color,
      button?.styles.backgroundColor,
    ].filter(Boolean);

    expect(extractedValues).not.toContain('oklab(0.46 0.09 -0.12)');
    expect(extractedValues).not.toContain('lab(82 -20 28)');
    expect(
      extractedValues.every((value) => /^#[0-9a-f]{6}$/i.test(value)),
    ).toBe(true);
    expect(button?.styles.border).not.toMatch(/color\(/);
    expect(button?.styles.boxShadow).not.toMatch(/oklab\(/);
  });

  it('prioritizes styled controls and cards over unstyled wrappers when capped', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    await page.setContent(`
      <style>
        .card-shell {
          display: block;
          width: 320px;
          min-height: 80px;
        }

        .product-card {
          width: 320px;
          padding: 24px;
          color: #1d2433;
          background: #ffffff;
          border: 1px solid #d9e2ef;
          border-radius: 18px;
          box-shadow: 0 18px 50px rgba(29, 36, 51, 0.18);
          font: 500 16px / 24px Inter, sans-serif;
        }

        .primary-action {
          display: inline-flex;
          padding: 12px 18px;
          color: #ffffff;
          background: #0f5bff;
          border: 2px solid #093bb0;
          border-radius: 999px;
          box-shadow: 0 10px 24px rgba(15, 91, 255, 0.28);
          font: 700 15px / 20px Inter, sans-serif;
        }
      </style>
      <main>
        <section class="card-shell"><div class="card-shell"><div class="card-shell">Wrapper one</div></div></section>
        <section class="card-shell"><div class="card-shell"><div class="card-shell">Wrapper two</div></div></section>
        <article class="product-card">
          <h2>Design audit</h2>
          <p>Inspect key styles before generating previews.</p>
          <button class="primary-action">Start audit</button>
        </article>
      </main>
    `);

    const evidence = await collectPageEvidence(page, {
      viewport: 'desktop',
      maxComponents: 2,
    });
    await browser.close();

    const button = evidence.components.find(
      (component) => component.kind === 'button',
    );
    const card = evidence.components.find(
      (component) =>
        component.kind === 'card' &&
        component.selector.includes('product-card'),
    );

    expect(button?.textSample).toBe('Start audit');
    expect(button?.styles).toMatchObject({
      color: '#ffffff',
      backgroundColor: '#0f5bff',
      borderRadius: '999px',
      padding: '12px 18px',
      border: '2px solid #093bb0',
      fontSize: '15px',
      fontWeight: '700',
    });
    expect(button?.styles.boxShadow).toContain('rgba(15, 91, 255, 0.28)');
    expect(button?.bounds.width).toBeGreaterThan(80);

    expect(card?.kind).toBe('card');
    expect(card?.styles.borderRadius).toBe('18px');
    expect(card?.styles.padding).toBe('24px');
    expect(card?.styles.border).toBe('1px solid #d9e2ef');
    expect(card?.styles.boxShadow).toContain('rgba(29, 36, 51, 0.18)');
  });
});
