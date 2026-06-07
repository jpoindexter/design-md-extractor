import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { parseCookieFile } from '../../src/crawl/cookies.js';

let dir = '';
afterEach(async () => {
  if (dir) {
    await rm(dir, { recursive: true, force: true });
    dir = '';
  }
});

async function tmpFile(name: string, content: string): Promise<string> {
  dir = await mkdtemp(join(tmpdir(), 'cookies-'));
  const path = join(dir, name);
  await writeFile(path, content, 'utf8');
  return path;
}

describe('parseCookieFile', () => {
  it('parses a Playwright/EditThisCookie JSON array', async () => {
    const path = await tmpFile(
      'c.json',
      JSON.stringify([
        {
          name: 'cf_clearance',
          value: 'abc',
          domain: '.example.com',
          path: '/',
          secure: true,
          sameSite: 'None',
        },
        {
          name: 'sid',
          value: 'xyz',
          domain: '.example.com',
          path: '/',
          expirationDate: 1893456000,
        },
      ]),
    );
    const cookies = await parseCookieFile(path);
    expect(cookies).toHaveLength(2);
    expect(cookies[0]).toMatchObject({
      name: 'cf_clearance',
      value: 'abc',
      domain: '.example.com',
      path: '/',
      secure: true,
      sameSite: 'None',
    });
    expect(cookies[1]?.expires).toBe(1893456000);
  });

  it('accepts a { cookies: [...] } wrapper', async () => {
    const path = await tmpFile(
      'c.json',
      JSON.stringify({
        cookies: [{ name: 'a', value: 'b', domain: 'x.com', path: '/' }],
      }),
    );
    expect(await parseCookieFile(path)).toHaveLength(1);
  });

  it('parses a Netscape cookies.txt', async () => {
    const path = await tmpFile(
      'cookies.txt',
      [
        '# Netscape HTTP Cookie File',
        '.example.com\tTRUE\t/\tTRUE\t1893456000\tcf_clearance\tabc123',
      ].join('\n'),
    );
    const cookies = await parseCookieFile(path);
    expect(cookies).toHaveLength(1);
    expect(cookies[0]).toMatchObject({
      name: 'cf_clearance',
      value: 'abc123',
      domain: '.example.com',
      path: '/',
      secure: true,
      expires: 1893456000,
    });
  });

  it('throws on an empty/garbage file', async () => {
    const path = await tmpFile('empty.txt', '\n\n# just a comment\n');
    await expect(parseCookieFile(path)).rejects.toThrow();
  });
});
