import { describe, expect, it } from 'vitest';
import { EvidenceSchema } from '../../src/evidence/evidenceSchema.js';

describe('EvidenceSchema', () => {
  it('accepts a minimal valid evidence document', () => {
    const parsed = EvidenceSchema.parse({
      version: '0.1.0',
      source: {
        primaryUrl: 'https://example.com',
        pages: [{ url: 'https://example.com', status: 'success' }],
        capturedAt: '2026-05-28T10:00:00.000Z',
      },
      viewports: [{ name: 'desktop', width: 1440, height: 1000 }],
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
      imagery: { strategy: 'unknown' },
      responsive: { notes: [] },
      warnings: [],
    });

    expect(parsed.source.primaryUrl).toBe('https://example.com');
  });

  it('rejects invalid confidence values', () => {
    expect(() =>
      EvidenceSchema.parse({
        version: '0.1.0',
        source: {
          primaryUrl: 'https://example.com',
          pages: [],
          capturedAt: '2026-05-28T10:00:00.000Z',
        },
        viewports: [],
        screenshots: [],
        tokens: {
          colors: [
            {
              name: 'Canvas',
              value: '#ffffff',
              role: 'Page background',
              frequency: 1,
              properties: ['background-color'],
              sampleSelectors: ['body'],
              confidence: 'certain',
            },
          ],
          typography: [],
          spacing: [],
          radii: [],
          shadows: [],
        },
        surfaces: [],
        components: [],
        layout: { density: 'comfortable' },
        imagery: { strategy: 'unknown' },
        responsive: { notes: [] },
        warnings: [],
      }),
    ).toThrow();
  });
});
