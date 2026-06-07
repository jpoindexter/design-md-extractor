import { describe, expect, it } from 'vitest';
import { generateTokensJson } from '../../src/generate/generateTokensJson.js';
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
    typography: [],
    spacing: [{ name: 'Space 1', value: '16px', confidence: 'high' }],
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

describe('generateTokensJson', () => {
  it('produces valid JSON with W3C $type annotations', () => {
    const json = generateTokensJson(evidence);
    const parsed = JSON.parse(json);
    expect(parsed.color?.['canvas-white']?.['$value']).toBe('#ffffff');
    expect(parsed.color?.['canvas-white']?.['$type']).toBe('color');
    expect(parsed.spacing?.['space-1']?.['$value']).toBe('16px');
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
        ],
      },
    };
    const json = generateTokensJson(multi);
    const parsed = JSON.parse(json);
    expect(parsed.typography?.['heading']).toBeDefined();
    expect(parsed.typography?.['body']).toBeDefined();
    expect(parsed.typography?.['body-1']).toBeUndefined();
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
    const json = generateTokensJson(dup);
    const parsed = JSON.parse(json);
    expect(parsed.color?.['gray']?.['$value']).toBe('#888888');
    expect(parsed.color?.['gray-1']?.['$value']).toBe('#aaaaaa');
  });
});
