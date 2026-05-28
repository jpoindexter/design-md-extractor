import { describe, expect, it } from 'vitest';
import { version } from '../../src/index.js';

describe('version', () => {
  it('exports the package version', () => {
    expect(version).toBe('0.1.0');
  });
});
