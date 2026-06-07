import { describe, expect, it } from 'vitest';
import { generateTailwind } from '../../src/generate/generateTailwind.js';
import type { Evidence } from '../../src/types/evidence.js';

const evidence: Evidence = {
  version: '0.1.0',
  source: {
    primaryUrl: 'https://example.com',
    pages: [{ url: 'https://example.com', status: 'success' }],
    capturedAt: '2026-01-01T00:00:00.000Z',
  },
  viewports: [{ name: 'desktop', width: 1440, height: 900 }],
  screenshots: [],
  tokens: {
    colors: [
      {
        name: 'Canvas White',
        value: '#ffffff',
        cssVariable: '--color-canvas-white',
        role: 'background',
        properties: [],
        frequency: 5,
        sampleSelectors: [],
        confidence: 'high',
      },
    ],
    typography: [
      {
        role: 'heading',
        fontFamily: 'Inter',
        fontSize: '32px',
        fontWeight: '700',
        lineHeight: '40px',
        letterSpacing: '0px',
        sampleSelectors: [],
        confidence: 'high',
      },
    ],
    spacing: [{ name: 'Space 1', value: '16px', confidence: 'high' }],
    radii: [{ name: 'Radius 1', value: '8px', confidence: 'high' }],
    shadows: [],
  },
  surfaces: [],
  components: [],
  layout: { density: 'comfortable' },
  imagery: { strategy: 'unknown', notes: [] },
  responsive: { notes: [] },
  warnings: [],
};

describe('generateTailwind', () => {
  it('produces valid tailwind.config.js theme shape', () => {
    const config = generateTailwind(evidence);
    expect(config).toContain('module.exports = {');
    expect(config).toContain("'canvas-white': '#ffffff'");
    expect(config).toContain("'heading':");
    expect(config).toContain("'32px'");
    expect(config).toContain('spacing:');
    expect(config).toContain('borderRadius:');
  });

  it('emits unique font keys for distinct roles without spurious suffixes', () => {
    const multi: Evidence = {
      ...evidence,
      tokens: {
        ...evidence.tokens,
        typography: [
          {
            role: 'heading',
            fontFamily: 'Inter',
            fontSize: '32px',
            fontWeight: '700',
            lineHeight: '40px',
            letterSpacing: '0px',
            sampleSelectors: [],
            confidence: 'high',
          },
          {
            role: 'body',
            fontFamily: 'Inter',
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '24px',
            letterSpacing: '0px',
            sampleSelectors: [],
            confidence: 'high',
          },
          {
            role: 'caption',
            fontFamily: 'Inter',
            fontSize: '12px',
            fontWeight: '400',
            lineHeight: '16px',
            letterSpacing: '0px',
            sampleSelectors: [],
            confidence: 'medium',
          },
        ],
      },
    };
    const config = generateTailwind(multi);
    expect(config).toContain("'heading':");
    expect(config).toContain("'body':");
    expect(config).toContain("'caption':");
    expect(config).not.toContain("'body-1':");
    expect(config).not.toContain("'caption-2':");
  });

  it('produces unique color keys when two colors slug to the same name', () => {
    const dup: Evidence = {
      ...evidence,
      tokens: {
        ...evidence.tokens,
        colors: [
          {
            name: 'Gray',
            value: '#888888',
            cssVariable: '--color-gray',
            role: 'text',
            properties: [],
            frequency: 3,
            sampleSelectors: [],
            confidence: 'medium',
          },
          {
            name: 'Gray',
            value: '#aaaaaa',
            cssVariable: '--color-gray',
            role: 'text',
            properties: [],
            frequency: 2,
            sampleSelectors: [],
            confidence: 'low',
          },
        ],
      },
    };
    const config = generateTailwind(dup);
    expect(config).toContain("'gray': '#888888'");
    expect(config).toContain("'gray-1': '#aaaaaa'");
  });
});
