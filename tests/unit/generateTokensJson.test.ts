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
});
