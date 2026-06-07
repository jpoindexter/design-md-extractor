import { describe, expect, it } from 'vitest';
import { generateAiPrompt } from '../../src/generate/generateAiPrompt.js';
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
    spacing: [],
    radii: [],
    shadows: [],
  },
  surfaces: [
    {
      level: 0,
      name: 'Base Surface',
      value: '#ffffff',
      purpose: 'background',
      sampleSelectors: [],
      confidence: 'high',
    },
  ],
  components: [],
  layout: { density: 'comfortable' },
  imagery: { strategy: 'unknown', notes: [] },
  responsive: { notes: [] },
  warnings: [],
};

describe('generateAiPrompt', () => {
  it('contains site name, canvas, typography, and surfaces', () => {
    const prompt = generateAiPrompt(evidence);
    expect(prompt).toContain('example.com');
    expect(prompt).toContain('#ffffff');
    expect(prompt).toContain('Inter');
    expect(prompt).toContain('Level 0');
  });
});
