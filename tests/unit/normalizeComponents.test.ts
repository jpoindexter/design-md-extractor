import { describe, expect, it } from 'vitest';
import type { RawPageEvidence } from '../../src/extract/collectPageEvidence.js';
import { normalizeComponents } from '../../src/evidence/normalizeComponents.js';

type Component = RawPageEvidence['components'][number];

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 768, height: 1000 },
  { name: 'mobile', width: 375, height: 812 },
];

function rawPage(
  viewport: string,
  components: Component[],
): RawPageEvidence & { viewport: string } {
  return { viewport, colors: [], typography: [], components };
}

describe('normalizeComponents', () => {
  it('collapses a responsive triple into one row keeping desktop values', () => {
    const btn = (fontSize: string, padding: string, radius: string) => ({
      kind: 'button',
      selector: 'div.main-form > div.button',
      textSample: 'Continue to checkout',
      styles: {
        fontFamily: 'Inter',
        color: '#fff',
        backgroundColor: '#000',
        fontSize,
        padding,
        borderRadius: radius,
      },
      bounds: { width: 163, height: 48 },
    });
    const result = normalizeComponents(
      [
        rawPage('desktop', [btn('16px', '16px 20px', '80px')]),
        rawPage('tablet', [
          btn('14.3147px', '13.0134px 16.2667px', '65.067px'),
        ]),
        rawPage('mobile', [
          btn('13.4327px', '13.4327px 20.149px', '67.1635px'),
        ]),
      ],
      viewports,
    );
    const buttons = result.filter((c) => c.kind === 'button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]?.viewports).toHaveLength(3);
    // desktop (widest) values are the representative
    expect(buttons[0]?.styles.fontSize).toBe('16px');
    expect(buttons[0]?.styles.borderRadius).toBe('80px');
  });

  it('merges identical-style instances at different selectors into one type', () => {
    const mk = (selector: string) => ({
      kind: 'button',
      selector,
      textSample: 'x',
      styles: {
        fontFamily: 'Inter',
        backgroundColor: '#000',
        borderRadius: '8px',
        padding: '8px',
      },
      bounds: { width: 100, height: 40 },
    });
    const result = normalizeComponents(
      [rawPage('desktop', [mk('a.one'), mk('a.two')])],
      viewports,
    );
    const buttons = result.filter((c) => c.kind === 'button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]?.count).toBe(2);
  });

  it('keeps size-distinct components separate (pill vs sharp)', () => {
    const mk = (selector: string, radius: string) => ({
      kind: 'button',
      selector,
      textSample: 'go',
      styles: {
        fontFamily: 'Inter',
        color: '#fff',
        backgroundColor: '#000',
        borderRadius: radius,
        padding: '8px 16px',
      },
      bounds: { width: 120, height: 44 },
    });
    const result = normalizeComponents(
      [rawPage('desktop', [mk('a.pill', '160px'), mk('a.sharp', '8px')])],
      viewports,
    );
    expect(result.filter((c) => c.kind === 'button')).toHaveLength(2);
  });

  it('rounds displayed style values', () => {
    const result = normalizeComponents(
      [
        rawPage('desktop', [
          {
            kind: 'card',
            selector: 'div.card',
            textSample: 'hi',
            styles: {
              fontFamily: 'Inter',
              padding: '40.4px 48.6px',
              borderRadius: '67.1635px',
            },
            bounds: { width: 300, height: 200 },
          },
        ]),
      ],
      viewports,
    );
    expect(result[0]?.styles.padding).toBe('40px 49px');
    expect(result[0]?.styles.borderRadius).toBe('67px');
  });

  it('count is max instances across viewports, not total', () => {
    const mk = () => ({
      kind: 'button',
      selector: 'a.cta',
      textSample: 'go',
      styles: {
        fontFamily: 'Inter',
        backgroundColor: '#000',
        borderRadius: '8px',
        padding: '8px',
      },
      bounds: { width: 100, height: 40 },
    });
    const result = normalizeComponents(
      [
        rawPage('desktop', [mk()]),
        rawPage('tablet', [mk()]),
        rawPage('mobile', [mk()]),
      ],
      viewports,
    );
    const btn = result.find((c) => c.kind === 'button');
    expect(btn?.count).toBe(1);
    expect(btn?.confidence).toBe('low');
  });

  it('derives descriptive component names from style signals', () => {
    const result = normalizeComponents(
      [
        rawPage('desktop', [
          {
            kind: 'button',
            selector: 'a.primary',
            textSample: 'Buy',
            styles: {
              fontFamily: 'Inter',
              backgroundColor: '#000',
              color: '#fff',
              borderRadius: '160px',
              border: 'none',
            },
            bounds: { width: 140, height: 48 },
          },
          {
            kind: 'button',
            selector: 'a.ghost',
            textSample: 'Learn',
            styles: {
              fontFamily: 'Inter',
              backgroundColor: 'transparent',
              color: '#000',
              borderRadius: '0px',
              border: 'none',
            },
            bounds: { width: 100, height: 40 },
          },
          {
            kind: 'card',
            selector: 'div.c',
            textSample: 'Feature text here',
            styles: {
              fontFamily: 'Inter',
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            },
            bounds: { width: 300, height: 200 },
          },
        ]),
      ],
      viewports,
    );
    const names = result.map((c) => c.name);
    expect(names).toContain('Primary Pill Button');
    expect(names).toContain('Text Button');
    expect(names).toContain('Elevated Card');
  });

  it('prefers the widest viewport even when a narrower one scores higher', () => {
    // mobile sample has a shadow (higher signalScore) but desktop is wider → desktop wins
    const result = normalizeComponents(
      [
        rawPage('desktop', [
          {
            kind: 'card',
            selector: 'div.c',
            textSample: 'd',
            styles: {
              fontFamily: 'Inter',
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: 'none',
            },
            bounds: { width: 600, height: 400 },
          },
        ]),
        rawPage('mobile', [
          {
            kind: 'card',
            selector: 'div.c',
            textSample: 'd',
            styles: {
              fontFamily: 'Inter',
              backgroundColor: '#fff',
              borderRadius: '9px',
              padding: '18px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            },
            bounds: { width: 300, height: 200 },
          },
        ]),
      ],
      viewports,
    );
    const card = result.find((c) => c.kind === 'card');
    expect(card?.styles.borderRadius).toBe('12px'); // desktop value
    expect(card?.styles.padding).toBe('24px');
  });
});
