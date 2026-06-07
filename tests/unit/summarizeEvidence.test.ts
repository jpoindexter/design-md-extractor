import { describe, expect, it } from 'vitest';
import { summarizeEvidence } from '../../src/gui/runGuiExtraction.js';
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
    colors: [],
    typography: [],
    spacing: [],
    radii: [],
    shadows: [],
    gradients: [
      {
        name: 'Gradient 1',
        value: 'linear-gradient(90deg, #ff0000, #0000ff)',
        confidence: 'high',
      },
    ],
  },
  surfaces: [],
  components: [],
  layout: {
    density: 'spacious',
    containerWidths: [1200],
    sectionGaps: ['80px'],
  },
  imagery: { strategy: 'photography-led', notes: ['12 images'] },
  responsive: { notes: [] },
  motion: { durations: ['0.3s'], easings: ['cubic-bezier(0.4, 0, 0.2, 1)'] },
  interactionStates: [
    {
      state: 'hover',
      selector: '.btn:hover',
      declarations: { 'background-color': '#ff0000' },
      source: 'live',
    },
  ],
  warnings: [],
};

describe('summarizeEvidence', () => {
  it('surfaces the newer captured dimensions to MCP/GUI consumers', () => {
    const summary = summarizeEvidence('run-1', evidence);

    expect(summary.gradients?.[0]?.value).toContain('linear-gradient');
    expect(summary.layout?.density).toBe('spacious');
    expect(summary.layout?.containerWidths).toContain(1200);
    expect(summary.imagery?.strategy).toBe('photography-led');
    expect(summary.motion?.durations).toContain('0.3s');
    expect(summary.motion?.easings?.[0]).toContain('cubic-bezier');
    expect(summary.interactionStates?.[0]?.state).toBe('hover');
    expect(summary.interactionStates?.[0]?.source).toBe('live');
  });
});
