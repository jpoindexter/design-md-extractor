import { describe, expect, it } from 'vitest';
import { resolveSessionConfig } from '../../src/config/sessionConfig.js';

describe('resolveSessionConfig', () => {
  it('returns none when no session options given', () => {
    expect(resolveSessionConfig({}).session).toEqual({ mode: 'none' });
  });

  it('profile takes precedence over cookies', () => {
    const { session } = resolveSessionConfig({
      profile: '/tmp/p',
      cookies: '/tmp/c.json',
    });
    expect(session).toEqual({
      mode: 'persistent',
      profileDir: '/tmp/p',
    });
  });

  it('persistent session can opt into headless', () => {
    const { session } = resolveSessionConfig({
      profile: '/tmp/p',
      headless: true,
    });
    expect(session).toEqual({
      mode: 'persistent',
      profileDir: '/tmp/p',
      headless: true,
    });
  });

  it('cookies mode carries the user agent', () => {
    const { session } = resolveSessionConfig({
      cookies: '/tmp/c.json',
      userAgent: 'UA/1',
    });
    expect(session).toEqual({
      mode: 'cookies',
      cookiesPath: '/tmp/c.json',
      userAgent: 'UA/1',
    });
  });

  it('warns when cookies are given without a user agent', () => {
    const { session, warnings } = resolveSessionConfig({
      cookies: '/tmp/c.json',
    });
    expect(session.mode).toBe('cookies');
    expect(warnings.some((w) => w.includes('User-Agent'))).toBe(true);
  });
});
