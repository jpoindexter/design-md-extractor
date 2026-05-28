import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { describe, expect, it } from 'vitest';
import { collectPageEvidence } from '../../src/extract/collectPageEvidence.js';

describe('collectPageEvidence', () => {
  it('collects visible colors, typography, and components from a rendered page', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const html = await readFile(resolve('tests/fixtures/sample-site.html'), 'utf8');
    await page.setContent(html);

    const evidence = await collectPageEvidence(page, { viewport: 'desktop', maxComponents: 20 });
    await browser.close();

    expect(evidence.colors.some((color) => color.value === '#ff5900')).toBe(true);
    expect(evidence.typography.some((type) => type.fontSize === '48px')).toBe(true);
    expect(evidence.components.some((component) => component.kind === 'button')).toBe(true);
  });
});
