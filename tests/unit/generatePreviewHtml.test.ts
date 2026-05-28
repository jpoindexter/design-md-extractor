import { describe, expect, it } from 'vitest';
import { generatePreviewHtml } from '../../src/generate/generatePreviewHtml.js';
import type { Evidence } from '../../src/types/evidence.js';

const evidence: Evidence = {
  version: '0.1.0',
  source: {
    primaryUrl: 'https://example.com',
    pages: [{ url: 'https://example.com', status: 'success' }],
    capturedAt: '2026-05-28T10:00:00.000Z',
  },
  viewports: [{ name: 'desktop', width: 1440, height: 1000 }],
  screenshots: [],
  tokens: {
    colors: [
      {
        name: 'Ink Black',
        value: '#111111',
        cssVariable: '--color-ink-black',
        role: 'Primary text',
        properties: ['color'],
        frequency: 8,
        sampleSelectors: ['body'],
        confidence: 'high',
      },
    ],
    typography: [],
    spacing: [{ name: 'Space 1', value: '8px', confidence: 'high' }],
    radii: [],
    shadows: [],
  },
  surfaces: [],
  components: [],
  layout: { density: 'comfortable' },
  imagery: { strategy: 'unknown' },
  responsive: { notes: [] },
  warnings: [],
};

describe('generatePreviewHtml', () => {
  it('includes artifact download links and a CSS token preview', () => {
    const html = generatePreviewHtml(evidence);

    expect(html).toContain('href="DESIGN.md"');
    expect(html).toContain('href="evidence.json"');
    expect(html).toContain('href="tokens.css"');
    expect(html).toContain('--color-ink-black: #111111;');
    expect(html).toContain('--space-1: 8px;');
  });
});
