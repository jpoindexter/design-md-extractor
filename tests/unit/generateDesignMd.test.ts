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
      {
        name: 'Ink Black',
        value: '#111111',
        cssVariable: '--color-ink-black',
        role: 'Primary text',
        properties: ['color'],
        frequency: 8,
        sampleSelectors: ['h1', 'p'],
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
    spacing: [{ name: 'Space 1', value: '8px', confidence: 'high' }],
    radii: [{ name: 'Radius 1', value: '6px', confidence: 'medium' }],
    shadows: [
      {
        name: 'Shadow 1',
        value: '0 8px 24px rgba(0,0,0,.12)',
        confidence: 'medium',
      },
    ],
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
  components: [
    {
      name: 'Button',
      kind: 'button',
      role: 'Primary action',
      textSample: 'Start',
      viewport: 'desktop',
      selector: '.button',
      count: 2,
      styles: {
        backgroundColor: '#111111',
        color: '#ffffff',
        fontFamily: 'Inter',
        fontSize: '16px',
        fontWeight: '600',
        borderRadius: '6px',
        boxShadow: '0 8px 24px rgba(0,0,0,.12)',
        padding: '12px 18px',
      },
      bounds: { width: 120, height: 44 },
      confidence: 'high',
    },
  ],
  layout: {
    density: 'comfortable',
    containerWidths: [1120],
    sectionGaps: ['64px'],
  },
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
    expect(markdown).toContain(
      '| Canvas White | `#ffffff` | `--color-canvas-white` | Page background | high |',
    );
    expect(markdown).toContain('### Spacing');
    expect(markdown).toContain('| Space 1 | `8px` | high |');
    expect(markdown).toContain('### Radii');
    expect(markdown).toContain('### Shadows');
    expect(markdown).toContain('### Gradients');
    expect(markdown).toContain('No gradients detected.');
    expect(markdown).toContain('### Button');
    expect(markdown).toContain(
      '- Color: background `#111111`, text `#ffffff`.',
    );
    expect(markdown).toContain('- Radius: `6px`.');
    expect(markdown).toContain('### CSS Token Starter');
    expect(markdown).toContain('--color-ink-black: #111111;');
    expect(markdown).toContain('Container widths: `1120px`.');
    expect(markdown).toContain('- Preserve the comfortable density');
    expect(markdown).toContain('## 11. Known Gaps');
    expect(markdown).toContain('## Interaction States');
    expect(markdown).toContain(
      'No interaction states (hover/focus/active/disabled) were found in the stylesheets.',
    );
    expect(markdown).toContain('## Motion');
    expect(markdown).toContain(
      'No motion (transitions or animations) detected.',
    );
  });

  it('renders gradient tokens when present in evidence', () => {
    const withGradients: Evidence = {
      ...evidence,
      tokens: {
        ...evidence.tokens,
        gradients: [
          {
            name: 'Gradient 1',
            value: 'linear-gradient(90deg, #ff0000, #0000ff)',
            confidence: 'high',
          },
        ],
      },
    };
    const markdown = generateDesignMd(withGradients);
    expect(markdown).toContain('### Gradients');
    expect(markdown).toContain(
      '| Gradient 1 | `linear-gradient(90deg, #ff0000, #0000ff)` | high |',
    );
    expect(markdown).not.toContain('No gradients detected.');
  });

  it('renders the viewport list when a component carries viewports[]', () => {
    const multiViewport: Evidence = {
      ...evidence,
      components: [
        {
          ...evidence.components[0]!,
          viewports: ['desktop', 'tablet', 'mobile'],
        },
      ],
    };
    const markdown = generateDesignMd(multiViewport);
    expect(markdown).toContain('across desktop, tablet, mobile; count 2.');
  });

  it('falls back to the singular viewport when viewports[] is absent', () => {
    const markdown = generateDesignMd(evidence);
    expect(markdown).toContain('in desktop; count 2.');
  });

  it('marks live-observed interaction states distinctly from CSS-parsed ones', () => {
    const withStates: Evidence = {
      ...evidence,
      interactionStates: [
        {
          state: 'hover',
          selector: '.button',
          declarations: { backgroundColor: 'rgb(255, 0, 0)' },
          source: 'live',
        },
        {
          state: 'focus',
          selector: '.input',
          declarations: { outline: '2px solid blue' },
        },
      ],
    };
    const markdown = generateDesignMd(withStates);
    expect(markdown).toContain(
      '- **hover** _(observed live)_ on `.button`: `backgroundColor: rgb(255, 0, 0)`',
    );
    expect(markdown).toContain(
      '- **focus** on `.input`: `outline: 2px solid blue`',
    );
    expect(markdown).not.toContain('- **focus** _(observed live)_');
  });
});
