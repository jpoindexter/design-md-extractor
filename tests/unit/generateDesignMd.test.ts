import { describe, expect, it } from 'vitest';
import { generateDesignMd } from '../../src/generate/generateDesignMd.js';
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
        name: 'Canvas White',
        value: '#ffffff',
        cssVariable: '--color-canvas-white',
        role: 'Page background',
        properties: ['background-color'],
        frequency: 12,
        sampleSelectors: ['body'],
        confidence: 'high',
      },
    ],
    typography: [
      {
        role: 'display',
        fontFamily: 'Inter',
        fallback: 'system-ui',
        fontSize: '48px',
        fontWeight: '600',
        lineHeight: '1.1',
        letterSpacing: '-0.04em',
        sampleSelectors: ['h1'],
        confidence: 'high',
      },
    ],
    spacing: [],
    radii: [],
    shadows: [],
  },
  surfaces: [
    {
      level: 0,
      name: 'Canvas',
      value: '#ffffff',
      purpose: 'Page background',
      sampleSelectors: ['body'],
      confidence: 'high',
    },
  ],
  components: [],
  layout: { density: 'comfortable' },
  imagery: { strategy: 'product-focused', notes: ['No photography observed.'] },
  responsive: { notes: ['Desktop captured.'] },
  warnings: [],
};

describe('generateDesignMd', () => {
  it('writes every required section', () => {
    const markdown = generateDesignMd(evidence);

    expect(markdown).toContain('# Design System: example.com');
    expect(markdown).toContain('## 1. Style Thesis');
    expect(markdown).toContain('## 3. Tokens');
    expect(markdown).toContain('| Canvas White | `#ffffff` | `--color-canvas-white` | Page background | high |');
    expect(markdown).toContain('## 11. Known Gaps');
  });
});
