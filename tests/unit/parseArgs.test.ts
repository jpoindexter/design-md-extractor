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
    expect(config.viewports.map((viewport) => viewport.name)).toEqual([
      'desktop',
      'tablet',
      'mobile',
    ]);
  });

  it('rejects a missing output directory', () => {
    expect(() => parseExtractArgs(['extract', 'https://example.com'])).toThrow(
      '--out is required',
    );
  });

  it('defaults to no session when no session flags are given', () => {
    const config = parseExtractArgs([
      'extract',
      'https://example.com',
      '--out',
      './out',
    ]);
    expect(config.session).toEqual({ mode: 'none' });
  });

  it('builds a cookies session from --cookies and --user-agent', () => {
    const config = parseExtractArgs([
      'extract',
      'https://example.com',
      '--out',
      './out',
      '--cookies',
      './cookies.json',
      '--user-agent',
      'UA/9',
    ]);
    expect(config.session).toEqual({
      mode: 'cookies',
      cookiesPath: './cookies.json',
      userAgent: 'UA/9',
    });
  });

  it('builds a persistent session from --profile', () => {
    const config = parseExtractArgs([
      'extract',
      'https://example.com',
      '--out',
      './out',
      '--profile',
      './.chrome',
    ]);
    expect(config.session).toEqual({
      mode: 'persistent',
      profileDir: './.chrome',
    });
  });

  it('--headless makes the persistent session headless', () => {
    const config = parseExtractArgs([
      'extract',
      'https://example.com',
      '--out',
      './out',
      '--profile',
      './.chrome',
      '--headless',
    ]);
    expect(config.session).toEqual({
      mode: 'persistent',
      profileDir: './.chrome',
      headless: true,
    });
  });

  it('warns when cookies are given without a user agent', () => {
    const config = parseExtractArgs([
      'extract',
      'https://example.com',
      '--out',
      './out',
      '--cookies',
      './c.json',
    ]);
    expect(config.sessionWarnings?.some((w) => w.includes('User-Agent'))).toBe(
      true,
    );
  });
});
