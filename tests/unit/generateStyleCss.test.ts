import { describe, expect, it } from 'vitest';
import { generateStyleCss } from '../../src/generate/generateStyleCss.js';
import type { Evidence } from '../../src/types/evidence.js';

const base: Evidence = {
  version: '0.1.0',
  source: {
    primaryUrl: 'https://example.com',
    pages: [{ url: 'https://example.com', status: 'success' }],
    capturedAt: '2026-01-01T00:00:00.000Z',
  },
  viewports: [{ name: 'desktop', width: 1440, height: 900 }],
  screenshots: [],
  tokens: {
    colors: [],
    typography: [],
    spacing: [],
    radii: [],
    shadows: [],
  },
  surfaces: [],
  components: [],
  layout: { density: 'comfortable' },
  imagery: { strategy: 'unknown', notes: [] },
  responsive: { notes: [] },
  warnings: [],
};

describe('generateStyleCss', () => {
  it('emits no duplicate CSS variable names when typography roles repeat', () => {
    const evidence: Evidence = {
      ...base,
      tokens: {
        ...base.tokens,
        typography: [
          {
            role: 'text',
            fontFamily: 'Inter',
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '24px',
            letterSpacing: '0px',
            sampleSelectors: [],
            confidence: 'high',
          },
          {
            role: 'text',
            fontFamily: 'Inter',
            fontSize: '14px',
            fontWeight: '400',
            lineHeight: '20px',
            letterSpacing: '0px',
            sampleSelectors: [],
            confidence: 'medium',
          },
          {
            role: 'heading',
            fontFamily: 'Inter',
            fontSize: '32px',
            fontWeight: '700',
            lineHeight: '40px',
            letterSpacing: '-0.5px',
            sampleSelectors: [],
            confidence: 'high',
          },
        ],
      },
    };

    const css = generateStyleCss(evidence);
    const varNames = [...css.matchAll(/--([a-z][a-z0-9-]*)\s*:/g)].map(
      (m) => m[1],
    );
    expect(new Set(varNames).size).toBe(varNames.length);
    expect(css).toContain('--font-text:');
    expect(css).toContain('--font-size-text:');
    expect(css).toContain('--font-text-1:');
    expect(css).toContain('--font-size-text-1:');
    expect(css).toContain('--font-heading:');
  });
});
