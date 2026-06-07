import { createServer, type Server } from 'node:http';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { withBrowserSession } from '../../src/crawl/browserSession.js';

let server: Server;
let port = 0;
let dir = '';

beforeEach(async () => {
  server = createServer((req, res) => {
    const cookie = req.headers.cookie ?? '';
    if (cookie.includes('gate=open')) {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('<html><body><h1 id="ok">Through the gate</h1></body></html>');
    } else {
      res.writeHead(403, { 'content-type': 'text/html' });
      res.end('<html><body><h1 id="blocked">Blocked</h1></body></html>');
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  port = typeof address === 'object' && address ? address.port : 0;
});

afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  if (dir) {
    await rm(dir, { recursive: true, force: true });
    dir = '';
  }
});

describe('cookies session', () => {
  it('injects cookies so a gated page loads', async () => {
    dir = await mkdtemp(join(tmpdir(), 'session-'));
    const cookiesPath = join(dir, 'cookies.json');
    await writeFile(
      cookiesPath,
      JSON.stringify([
        { name: 'gate', value: 'open', domain: '127.0.0.1', path: '/' },
      ]),
      'utf8',
    );

    const heading = await withBrowserSession(
      { mode: 'cookies', cookiesPath },
      async (context) => {
        const page = await context.newPage();
        await page.goto(`http://127.0.0.1:${port}/`, {
          waitUntil: 'domcontentloaded',
        });
        return page.evaluate(() => document.querySelector('h1')?.id ?? '');
      },
    );

    expect(heading).toBe('ok');
  });

  it('without cookies the same page is blocked', async () => {
    const heading = await withBrowserSession(
      { mode: 'none' },
      async (context) => {
        const page = await context.newPage();
        await page.goto(`http://127.0.0.1:${port}/`, {
          waitUntil: 'domcontentloaded',
        });
        return page.evaluate(() => document.querySelector('h1')?.id ?? '');
      },
    );
    expect(heading).toBe('blocked');
  });
});
