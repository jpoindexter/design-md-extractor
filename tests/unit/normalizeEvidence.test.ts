import { describe, expect, it } from 'vitest';
import { normalizeEvidence } from '../../src/evidence/normalizeEvidence.js';

describe('normalizeEvidence', () => {
  it('promotes repeated colors and component samples into schema evidence', () => {
    const evidence = normalizeEvidence({
      primaryUrl: 'https://example.com',
      pages: [{ url: 'https://example.com', status: 'success' as const }],
      capturedAt: '2026-05-28T10:00:00.000Z',
      viewports: [{ name: 'desktop', width: 1440, height: 1000 }],
      screenshots: [],
      rawPages: [
        {
          viewport: 'desktop',
          colors: [
            { value: '#ffffff', property: 'backgroundColor', selector: 'body' },
            { value: '#ffffff', property: 'backgroundColor', selector: 'main' },
            { value: '#ff5900', property: 'backgroundColor', selector: 'a.button' },
            { value: '#000000', property: 'color', selector: 'body' },
            { value: '#000000', property: 'color', selector: 'h1' },
            { value: '#000000', property: 'color', selector: 'p' },
          ],
          typography: [
            {
              selector: 'h1',
              role: 'heading',
              fontFamily: 'Inter',
              fontSize: '48px',
              fontWeight: '600',
              lineHeight: '52.8px',
              letterSpacing: '-1.92px',
            },
          ],
          components: [
            {
              kind: 'button',
              selector: 'a.button',
              textSample: 'Get started',
              styles: { backgroundColor: '#ff5900', color: '#ffffff', borderRadius: '8px' },
              bounds: { width: 120, height: 40 },
            },
            {
              kind: 'button',
              selector: 'a.button',
              textSample: 'Get started',
              styles: { backgroundColor: '#ff5900', color: '#ffffff', borderRadius: '8px' },
              bounds: { width: 120, height: 40 },
            },
          ],
        },
      ],
    });

    expect(evidence.tokens.colors[0]?.value).toBe('#ffffff');
    expect(evidence.tokens.typography[0]?.role).toBe('heading');
    expect(evidence.components[0]?.name).toBe('Button');
    expect(evidence.components).toHaveLength(1);
    expect(evidence.components[0]?.count).toBe(2);
    expect(evidence.surfaces[0]?.value).toBe('#ffffff');
  });

  it('keeps rare large display typography alongside frequent body text', () => {
    const frequentBodyTypography = Array.from({ length: 13 }, (_, index) => [
      {
        selector: `.body-${index}-a`,
        role: 'body',
        fontFamily: 'Inter, sans-serif',
        fontSize: `${12 + index}px`,
        fontWeight: '400',
        lineHeight: `${18 + index}px`,
        letterSpacing: '0px',
      },
      {
        selector: `.body-${index}-b`,
        role: 'body',
        fontFamily: 'Inter, sans-serif',
        fontSize: `${12 + index}px`,
        fontWeight: '400',
        lineHeight: `${18 + index}px`,
        letterSpacing: '0px',
      },
    ]).flat();

    const evidence = normalizeEvidence({
      primaryUrl: 'https://example.com',
      pages: [{ url: 'https://example.com', status: 'success' as const }],
      capturedAt: '2026-05-28T10:00:00.000Z',
      viewports: [{ name: 'desktop', width: 1440, height: 1000 }],
      screenshots: [],
      rawPages: [
        {
          viewport: 'desktop',
          colors: [],
          typography: [
            ...frequentBodyTypography,
            {
              selector: 'h1.hero-title',
              role: 'heading',
              fontFamily: 'Inter, sans-serif',
              fontSize: '72px',
              fontWeight: '700',
              lineHeight: '76px',
              letterSpacing: '-2px',
            },
          ],
          components: [],
        },
      ],
    });

    expect(evidence.tokens.typography.some((item) => item.fontSize === '72px' && item.role === 'heading')).toBe(true);
  });
});
