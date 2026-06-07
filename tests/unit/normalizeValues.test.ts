import { describe, expect, it } from 'vitest';
import {
  roundPxValue,
  normalizeShadowValue,
  normalizeTypographyKey,
} from '../../src/evidence/normalizeValues.js';

describe('roundPxValue', () => {
  it('rounds fractional px to integers', () => {
    expect(roundPxValue('67.1635px')).toBe('67px');
    expect(roundPxValue('4.88002px')).toBe('5px');
    expect(roundPxValue('19.5201px')).toBe('20px');
  });

  it('rounds all parts of a multi-value string', () => {
    expect(roundPxValue('4.88002px 19.5201px')).toBe('5px 20px');
    expect(roundPxValue('12.5px 24.9px 6.1px')).toBe('13px 25px 6px');
  });

  it('leaves integer px values unchanged', () => {
    expect(roundPxValue('8px')).toBe('8px');
    expect(roundPxValue('16px 32px')).toBe('16px 32px');
  });

  it('leaves non-px values unchanged', () => {
    expect(roundPxValue('1.5rem')).toBe('1.5rem');
    expect(roundPxValue('none')).toBe('none');
    expect(roundPxValue('')).toBe('');
  });
});

describe('normalizeShadowValue', () => {
  it('collapses extra whitespace', () => {
    expect(normalizeShadowValue('0  4px  8px  rgba(0,0,0,0.1)')).toBe(
      '0 4px 8px rgba(0,0,0,0.1)',
    );
  });

  it('passes a clean shadow through', () => {
    expect(normalizeShadowValue('0 2px 4px rgba(0,0,0,0.1)')).toBe(
      '0 2px 4px rgba(0,0,0,0.1)',
    );
  });
});

describe('normalizeTypographyKey', () => {
  it('rounds px values in the key so scaled duplicates collapse', () => {
    const a = normalizeTypographyKey({
      role: 'body',
      fontFamily: 'Inter',
      fontSize: '16.0001px',
      fontWeight: '400',
      lineHeight: '24.0002px',
      letterSpacing: '0.0001px',
    });
    const b = normalizeTypographyKey({
      role: 'body',
      fontFamily: 'Inter',
      fontSize: '15.9999px',
      fontWeight: '400',
      lineHeight: '23.9998px',
      letterSpacing: '0px',
    });
    expect(a).toBe(b);
  });
});
