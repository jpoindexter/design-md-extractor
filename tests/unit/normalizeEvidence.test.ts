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
            {
              value: '#ff5900',
              property: 'backgroundColor',
              selector: 'a.button',
            },
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
              styles: {
                backgroundColor: '#ff5900',
                color: '#ffffff',
                borderRadius: '8px',
              },
              bounds: { width: 120, height: 40 },
            },
            {
              kind: 'button',
              selector: 'a.button',
              textSample: 'Get started',
              styles: {
                backgroundColor: '#ff5900',
                color: '#ffffff',
                borderRadius: '8px',
              },
              bounds: { width: 120, height: 40 },
            },
          ],
        },
      ],
    });

    expect(evidence.tokens.colors[0]?.value).toBe('#ffffff');
    expect(evidence.tokens.typography[0]?.role).toBe('heading');
    expect(evidence.components[0]?.name).toBe('Primary Button');
    expect(evidence.components).toHaveLength(1);
    expect(evidence.components[0]?.count).toBe(2);
    expect(evidence.surfaces[0]?.value).toBe('#ffffff');
  });

  it('ranks white rootBackground above a dark color with larger area and more occurrences', () => {
    const evidence = normalizeEvidence({
      primaryUrl: 'https://example.com',
      pages: [{ url: 'https://example.com', status: 'success' as const }],
      capturedAt: '2026-05-28T10:00:00.000Z',
      viewports: [{ name: 'desktop', width: 1440, height: 1000 }],
      screenshots: [],
      rawPages: [
        {
          viewport: 'desktop',
          rootBackground: '#ffffff',
          colors: [
            // Dark color — larger above-fold area + more occurrences than white
            {
              value: '#0a0a0a',
              property: 'backgroundColor' as const,
              selector: 'div.hero-dark',
              area: 1440 * 800,
              aboveFold: true,
            },
            ...Array.from({ length: 8 }, (_, i) => ({
              value: '#0a0a0a',
              property: 'backgroundColor' as const,
              selector: `.section-${i}`,
              area: 500,
              aboveFold: true,
            })),
            // White — small area, not above fold (except the synthetic html push)
            {
              value: '#ffffff',
              property: 'backgroundColor' as const,
              selector: 'footer',
              area: 100,
              aboveFold: false,
            },
          ],
          typography: [],
          components: [],
        },
      ],
    });

    // White wins ONLY because rootBackground pushed a synthetic html entry
    // giving it pageBackgroundCount=1 vs dark's pageBackgroundCount=0.
    // Without the synthetic push, dark would win on aboveFoldArea.
    expect(evidence.surfaces[0]?.value).toBe('#ffffff');
  });

  it('strips framework-hashed font tokens and selector classes from evidence', () => {
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
            {
              value: '#6083ff',
              property: 'backgroundColor',
              selector:
                'html.__variable_c5b537.__variable_2d6016 > body.bg-theme-bg',
            },
          ],
          typography: [
            {
              selector: 'html.__variable_c5b537 > body',
              role: 'body',
              fontFamily:
                '__polySans_c5b537, __polySans_Fallback_c5b537, Helvetica, Arial, sans-serif',
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '24px',
              letterSpacing: '0px',
            },
          ],
          components: [
            {
              kind: 'card',
              selector: 'div.card.__variable_2d6016',
              textSample: 'Voices of MAYHEM',
              styles: {
                backgroundColor: '#6083ff',
                color: '#ffffff',
                borderRadius: '10px',
                fontFamily: '__polySans_c5b537, Helvetica, Arial, sans-serif',
                font: '16px / 24px __polySans_c5b537, __polySans_Fallback_c5b537, Helvetica, Arial, sans-serif',
              },
              bounds: { width: 320, height: 200 },
            },
          ],
          fontFaces: [
            {
              family: '__polySans_c5b537',
              weight: '400',
              style: 'normal',
              src: 'https://yung.studio/_next/static/media/poly400.woff2',
            },
            {
              family: '__polySans_Fallback_c5b537',
              weight: '400',
              style: 'normal',
              src: 'https://yung.studio/_next/static/media/polyfallback.woff2',
            },
            {
              family: '__unused_aa11bb',
              weight: '400',
              style: 'normal',
              src: 'https://yung.studio/_next/static/media/unused.woff2',
            },
          ],
        },
      ],
    });

    // Real @font-face for the shown family is captured under the humanized name;
    // the metric-fallback duplicate and unreferenced families are dropped.
    expect(evidence.fontFaces).toEqual([
      {
        family: 'polySans',
        weight: '400',
        style: 'normal',
        src: 'https://yung.studio/_next/static/media/poly400.woff2',
      },
    ]);

    const serialized = JSON.stringify(evidence);
    // No build-hash noise survives, but the real family name is recovered.
    expect(serialized).not.toMatch(/__polySans|__[a-zA-Z]+_[a-f0-9]{6}/);
    expect(evidence.tokens.typography[0]?.fontFamily).toBe(
      'polySans, Helvetica, Arial, sans-serif',
    );
    expect(evidence.components[0]?.styles.fontFamily).toBe(
      'polySans, Helvetica, Arial, sans-serif',
    );
    expect(evidence.components[0]?.styles.font).toBe(
      '16px / 24px polySans, Helvetica, Arial, sans-serif',
    );
    expect(evidence.tokens.colors[0]?.sampleSelectors[0]).toBe(
      'html > body.bg-theme-bg',
    );
    expect(evidence.tokens.typography[0]?.sampleSelectors[0]).toBe(
      'html > body',
    );
    expect(evidence.components[0]?.selector).toBe('div.card');
  });

  it('passes clean font names through and drops quoted metric fallbacks', () => {
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
            {
              selector: 'body',
              role: 'body',
              fontFamily: 'Geist, "Geist Fallback", sans-serif',
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '24px',
              letterSpacing: '0px',
            },
          ],
          components: [],
        },
      ],
    });

    expect(evidence.tokens.typography[0]?.fontFamily).toBe('Geist, sans-serif');
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

    expect(
      evidence.tokens.typography.some(
        (item) => item.fontSize === '72px' && item.role === 'heading',
      ),
    ).toBe(true);
  });

  it('adds AMBIGUOUS_CANVAS warning and caps confidence from high to medium', () => {
    // Each rawPage contributes backgroundCount to its rootBackground color.
    // 6 viewport observations of '#ffffff' → backgroundCount=6 → normally 'high' confidence.
    // 5 viewport observations of '#fafafa' → pageBackgroundCount=5 → ratio=5/6=0.83 ≥ 0.75 → ambiguous.
    const rawPages = [
      ...Array.from({ length: 6 }, (_, i) => ({
        viewport: i % 2 === 0 ? 'desktop' : 'mobile',
        rootBackground: '#ffffff' as const,
        colors: [
          {
            value: '#ffffff',
            property: 'backgroundColor' as const,
            selector: 'body',
            area: 1440 * 900,
            aboveFold: true,
          },
        ],
        typography: [] as never[],
        components: [] as never[],
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        viewport: i % 2 === 0 ? 'desktop' : 'mobile',
        rootBackground: '#fafafa' as const,
        colors: [
          {
            value: '#fafafa',
            property: 'backgroundColor' as const,
            selector: 'body',
            area: 1440 * 900,
            aboveFold: true,
          },
        ],
        typography: [] as never[],
        components: [] as never[],
      })),
    ];

    const evidence = normalizeEvidence({
      primaryUrl: 'https://example.com',
      pages: [
        { url: 'https://example.com', status: 'success' as const },
        { url: 'https://example.com/about', status: 'success' as const },
      ],
      capturedAt: '2026-05-28T10:00:00.000Z',
      viewports: [
        { name: 'desktop', width: 1440, height: 1000 },
        { name: 'mobile', width: 375, height: 812 },
      ],
      screenshots: [],
      rawPages,
    });

    // Ambiguity warning must be present
    const ambiguous = evidence.warnings.find(
      (w) => w.code === 'AMBIGUOUS_CANVAS',
    );
    expect(ambiguous).toBeDefined();

    // surfaces[0] would have 'high' confidence from backgroundCount=6,
    // but the ambiguity cap must have downgraded it to 'medium'
    expect(evidence.surfaces[0]?.confidence).toBe('medium');
  });

  it('does NOT emit AMBIGUOUS_CANVAS when one page background is clearly dominant', () => {
    const evidence = normalizeEvidence({
      primaryUrl: 'https://example.com',
      pages: [{ url: 'https://example.com', status: 'success' as const }],
      capturedAt: '2026-05-28T10:00:00.000Z',
      viewports: [{ name: 'desktop', width: 1440, height: 1000 }],
      screenshots: [],
      rawPages: [
        {
          viewport: 'desktop',
          rootBackground: '#ffffff',
          colors: [
            {
              value: '#ffffff',
              property: 'backgroundColor' as const,
              selector: 'body',
              area: 1440 * 900,
              aboveFold: true,
            },
            {
              value: '#111111',
              property: 'backgroundColor' as const,
              selector: 'footer',
              area: 1440 * 100,
              aboveFold: false,
            },
          ],
          typography: [],
          components: [],
        },
      ],
    });

    expect(
      evidence.warnings.find((w) => w.code === 'AMBIGUOUS_CANVAS'),
    ).toBeUndefined();
  });

  it('deduplicates typography rows that differ only by viewport sub-pixel scaling', () => {
    const evidence = normalizeEvidence({
      primaryUrl: 'https://example.com',
      pages: [{ url: 'https://example.com', status: 'success' as const }],
      capturedAt: '2026-05-28T10:00:00.000Z',
      viewports: [
        { name: 'desktop', width: 1440, height: 1000 },
        { name: 'mobile', width: 375, height: 812 },
      ],
      screenshots: [],
      rawPages: [
        {
          viewport: 'desktop',
          colors: [],
          typography: [
            {
              selector: 'h1',
              role: 'heading',
              fontFamily: 'Inter',
              fontSize: '48.0001px',
              fontWeight: '700',
              lineHeight: '57.6001px',
              letterSpacing: '0px',
            },
          ],
          components: [],
        },
        {
          viewport: 'mobile',
          colors: [],
          typography: [
            {
              selector: 'h1',
              role: 'heading',
              fontFamily: 'Inter',
              fontSize: '47.9999px',
              fontWeight: '700',
              lineHeight: '57.5999px',
              letterSpacing: '0px',
            },
          ],
          components: [],
        },
      ],
    });

    const headingEntries = evidence.tokens.typography.filter(
      (t) => t.role === 'heading' && t.fontFamily === 'Inter',
    );
    expect(headingEntries).toHaveLength(1);
  });

  it('tracks viewports[] on components that appear across multiple viewports', () => {
    const evidence = normalizeEvidence({
      primaryUrl: 'https://example.com',
      pages: [{ url: 'https://example.com', status: 'success' as const }],
      capturedAt: '2026-05-28T10:00:00.000Z',
      viewports: [
        { name: 'desktop', width: 1440, height: 1000 },
        { name: 'mobile', width: 375, height: 812 },
      ],
      screenshots: [],
      rawPages: [
        {
          viewport: 'desktop',
          colors: [],
          typography: [],
          components: [
            {
              kind: 'button',
              selector: 'a.cta',
              textSample: 'Get started',
              styles: {
                backgroundColor: '#ff5900',
                borderRadius: '8px',
                padding: '12px 24px',
                color: '#fff',
              },
              bounds: { width: 140, height: 44 },
            },
          ],
        },
        {
          viewport: 'mobile',
          colors: [],
          typography: [],
          components: [
            {
              kind: 'button',
              selector: 'a.cta',
              textSample: 'Get started',
              styles: {
                backgroundColor: '#ff5900',
                borderRadius: '8px',
                padding: '12px 24px',
                color: '#fff',
              },
              bounds: { width: 140, height: 44 },
            },
          ],
        },
      ],
    });

    const btn = evidence.components.find((c) => c.kind === 'button');
    expect(btn?.viewports).toBeDefined();
    expect(btn?.viewports).toHaveLength(2);
    expect(btn?.viewports).toContain('desktop');
    expect(btn?.viewports).toContain('mobile');
  });

  it('aggregates repeated gradients across pages into ranked tokens', () => {
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
          typography: [],
          components: [],
          gradients: [
            {
              value: 'linear-gradient(90deg, #ff0000, #0000ff)',
              selector: '.hero',
            },
          ],
        },
        {
          viewport: 'mobile',
          colors: [],
          typography: [],
          components: [],
          gradients: [
            {
              value: 'linear-gradient(90deg, #ff0000, #0000ff)',
              selector: '.hero',
            },
          ],
        },
      ],
    });

    expect(evidence.tokens.gradients?.[0]?.value).toContain('linear-gradient');
    expect(evidence.tokens.gradients?.[0]?.name).toBe('Gradient 1');
    expect(evidence.tokens.gradients?.[0]?.confidence).toBeDefined();
    expect(evidence.tokens.gradients).toHaveLength(1);
  });

  it('aggregates motion durations and easings across pages', () => {
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
          typography: [],
          components: [],
          motion: { durations: ['0.3s'], easings: ['ease-out'] },
        },
      ],
    });

    expect(evidence.motion?.durations).toContain('0.3s');
    expect(evidence.motion?.easings).toContain('ease-out');
  });

  it('populates layout containerWidths and derives density from section gaps', () => {
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
          typography: [],
          components: [],
          containerWidths: [1120, 1120, 1120, 768],
          sectionGaps: [80, 80, 64, 80],
        },
      ],
    });

    expect(evidence.layout.containerWidths).toContain(1120);
    expect(evidence.layout.density).toBe('spacious');
  });

  it('derives a photography-led imagery strategy from photo-heavy signals', () => {
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
          typography: [],
          components: [],
          imagery: {
            images: 6,
            photos: 5,
            icons: 2,
            videos: 0,
            backgroundImages: 1,
          },
        },
      ],
    });

    expect(evidence.imagery.strategy).toBe('photography-led');
    expect(evidence.imagery.notes?.length ?? 0).toBeGreaterThan(0);
  });

  it('falls back to text-led when no imagery signals are present', () => {
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
          typography: [],
          components: [],
          imagery: {
            images: 0,
            photos: 0,
            icons: 0,
            videos: 0,
            backgroundImages: 0,
          },
        },
      ],
    });

    expect(evidence.imagery.strategy).toBe('text-led (minimal imagery)');
  });
});
