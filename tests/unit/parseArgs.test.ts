import { describe, expect, it } from 'vitest';
import { parseExtractArgs } from '../../src/config/parseArgs.js';

describe('parseExtractArgs', () => {
  it('parses a valid extract command', () => {
    const config = parseExtractArgs([
      'extract',
      'https://example.com',
      '--out',
      'out/example',
      '--max-components',
      '25',
    ]);

    expect(config.url).toBe('https://example.com/');
    expect(config.outDir).toBe('out/example');
    expect(config.maxComponents).toBe(25);
    expect(config.viewports.map((viewport) => viewport.name)).toEqual(['desktop', 'tablet', 'mobile']);
  });

  it('rejects a missing output directory', () => {
    expect(() => parseExtractArgs(['extract', 'https://example.com'])).toThrow('--out is required');
  });
});
