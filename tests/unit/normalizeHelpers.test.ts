import { describe, expect, it } from 'vitest';
import {
  tokenNameFromColor,
  structuralSignature,
} from '../../src/evidence/normalizeHelpers.js';

describe('tokenNameFromColor', () => {
  it('returns canonical names for pure black and white', () => {
    expect(tokenNameFromColor('#ffffff', 0)).toBe('Canvas White');
    expect(tokenNameFromColor('#000000', 0)).toBe('Rich Black');
  });

  it('names grays and near-neutrals by lightness', () => {
    expect(tokenNameFromColor('#f5f5f5', 0)).toBe('Off White');
    expect(tokenNameFromColor('#888888', 0)).toBe('Gray');
    expect(tokenNameFromColor('#aaaaaa', 0)).toBe('Light Gray');
    expect(tokenNameFromColor('#333333', 0)).toBe('Dark Gray');
    expect(tokenNameFromColor('#111111', 0)).toBe('Near Black');
  });

  it('maps hue ranges to color names', () => {
    expect(tokenNameFromColor('#ff2200', 0)).toBe('Red');
    expect(tokenNameFromColor('#ff6600', 0)).toBe('Orange');
    expect(tokenNameFromColor('#ffdd00', 0)).toBe('Yellow');
    expect(tokenNameFromColor('#22aa44', 0)).toBe('Green');
    expect(tokenNameFromColor('#00bbcc', 0)).toBe('Teal');
    expect(tokenNameFromColor('#2244ff', 0)).toBe('Blue');
    expect(tokenNameFromColor('#8833ee', 0)).toBe('Purple');
    expect(tokenNameFromColor('#ff44aa', 0)).toBe('Pink');
  });

  it('falls back to Color N for rgba and malformed values', () => {
    expect(tokenNameFromColor('rgba(255,0,0,0.5)', 2)).toBe('Color 3');
    expect(tokenNameFromColor('transparent', 0)).toBe('Color 1');
  });
});

describe('structuralSignature', () => {
  it('is stable across viewport-scaled size values', () => {
    const desktop = structuralSignature('button', 'a.cta', {
      fontFamily: 'Inter',
      fontSize: '16px',
      padding: '6px 24px',
      borderRadius: '160px',
    });
    const mobile = structuralSignature('button', 'a.cta', {
      fontFamily: 'Inter',
      fontSize: '13.0134px',
      padding: '4.88002px 19.5201px',
      borderRadius: '130.134px',
    });
    expect(desktop).toBe(mobile);
  });

  it('discriminates by kind, selector, and fontFamily', () => {
    const a = structuralSignature('button', 'a.cta', { fontFamily: 'Inter' });
    expect(
      structuralSignature('card', 'a.cta', { fontFamily: 'Inter' }),
    ).not.toBe(a);
    expect(
      structuralSignature('button', 'a.other', { fontFamily: 'Inter' }),
    ).not.toBe(a);
    expect(
      structuralSignature('button', 'a.cta', { fontFamily: 'Roboto' }),
    ).not.toBe(a);
  });
});
