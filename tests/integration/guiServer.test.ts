import { mkdir, rm, writeFile } from 'node:fs/promises';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createGuiServer } from '../../src/gui/server.js';

function getRaw(
  port: number,
  path: string,
): Promise<{
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: Buffer;
}> {
  return new Promise((resolve, reject) => {
    const req = request(
      { hostname: '127.0.0.1', port, path, method: 'GET' },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () =>
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            body: Buffer.concat(chunks),
          }),
        );
      },
    );
    req.on('error', reject);
    req.end();
  });
}

function postJson(
  port: number,
  path: string,
  body: unknown,
): Promise<{ status: number; json: unknown }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode ?? 0, json: JSON.parse(data) });
        });
      },
    );
    req.on('error', reject);
    req.end(payload);
  });
}

describe('createGuiServer', () => {
  it('normalizes bare hostnames in extraction requests', async () => {
    let receivedUrl = '';
    const server = createGuiServer({
      runExtraction: async (input) => {
        receivedUrl = input.url;
        return {
          runId: 'www-example-com-123',
          url: input.url,
          outDir: '/tmp/www-example-com-123',
          discoveredPages: [],
          artifacts: {
            designMd: '/runs/www-example-com-123/DESIGN.md',
            evidenceJson: '/runs/www-example-com-123/evidence.json',
            previewHtml: '/runs/www-example-com-123/preview.html',
          },
          summary: {
            source: {
              primaryUrl: input.url,
              capturedAt: '2026-05-28T12:00:00.000Z',
            },
            styleThesis: 'test thesis',
            bestScreenshotHref: null,
            pages: [{ url: input.url, status: 'success' }],
            colors: [],
            typography: [],
            spacing: [],
            radii: [],
            shadows: [],
            surfaces: [],
            warnings: [],
            components: [],
            screenshots: [],
          },
        };
      },
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });

    try {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      const response = await postJson(port, '/api/extract', {
        url: 'www.example.com',
      });

      expect(response.status).toBe(200);
      expect(receivedUrl).toBe('https://www.example.com/');
      expect(response.json).toMatchObject({
        url: 'https://www.example.com/',
      });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it('accepts extraction requests and returns artifact links', async () => {
    const server = createGuiServer({
      runExtraction: async (input) => ({
        runId: 'example-com-123',
        url: input.url,
        outDir: '/tmp/example-com-123',
        discoveredPages: ['https://example.com/pricing'],
        artifacts: {
          designMd: '/runs/example-com-123/DESIGN.md',
          evidenceJson: '/runs/example-com-123/evidence.json',
          previewHtml: '/runs/example-com-123/preview.html',
        },
        summary: {
          source: {
            primaryUrl: 'https://example.com/',
            capturedAt: '2026-05-28T12:00:00.000Z',
          },
          styleThesis:
            'sparse density, #111111 primary and #f5f5f5 secondary, Inter as the main typeface, and 2 distinct surface levels across 1 inspected pages.',
          bestScreenshotHref:
            '/runs/example-com-123/screenshots/example-com-desktop.png',
          pages: [{ url: 'https://example.com/', status: 'success' }],
          colors: [
            {
              name: 'Rich Black',
              value: '#111111',
              cssVariable: '--color-rich-black',
              role: 'Surface or background color',
              confidence: 'high',
            },
          ],
          typography: [
            {
              role: 'body',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '24px',
              letterSpacing: '0px',
              confidence: 'high',
            },
          ],
          spacing: [{ name: 'Space 1', value: '8px', confidence: 'high' }],
          radii: [{ name: 'Radius 1', value: '8px', confidence: 'high' }],
          shadows: [
            {
              name: 'Shadow 1',
              value: '0 4px 16px rgba(0,0,0,.12)',
              confidence: 'medium',
            },
          ],
          surfaces: [
            {
              level: 1,
              name: 'Base Surface',
              value: '#ffffff',
              purpose: 'Primary canvas',
              confidence: 'high',
            },
          ],
          warnings: [
            {
              code: 'PARTIAL_SCAN',
              message: 'Only one page inspected.',
              severity: 'info',
            },
          ],
          components: [],
          screenshots: [],
        },
      }),
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });

    try {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      const response = await postJson(port, '/api/extract', {
        url: 'https://example.com',
      });

      expect(response.status).toBe(200);
      expect(response.json).toMatchObject({
        runId: 'example-com-123',
        artifacts: {
          designMd: '/runs/example-com-123/DESIGN.md',
        },
        summary: {
          source: {
            primaryUrl: 'https://example.com/',
            capturedAt: '2026-05-28T12:00:00.000Z',
          },
          styleThesis: expect.stringContaining('sparse density'),
          bestScreenshotHref:
            '/runs/example-com-123/screenshots/example-com-desktop.png',
          colors: [{ cssVariable: '--color-rich-black' }],
          typography: [{ lineHeight: '24px', letterSpacing: '0px' }],
          spacing: [{ name: 'Space 1' }],
          radii: [{ name: 'Radius 1' }],
          shadows: [{ name: 'Shadow 1' }],
          surfaces: [{ name: 'Base Surface' }],
          warnings: [{ code: 'PARTIAL_SCAN', severity: 'info' }],
        },
      });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});

describe('GET /runs/:id/bundle.zip', () => {
  let runsDir = '';

  afterEach(async () => {
    if (runsDir) {
      await rm(runsDir, { recursive: true, force: true });
      runsDir = '';
    }
  });

  it('streams a valid zip of the run directory', async () => {
    runsDir = join(tmpdir(), `gui-runs-${process.pid}-${Date.now()}`);
    const runDir = join(runsDir, 'example-com-123');
    await mkdir(runDir, { recursive: true });
    await writeFile(join(runDir, 'DESIGN.md'), '# Design');
    await writeFile(join(runDir, 'evidence.json'), '{"ok":true}');

    const server = createGuiServer({
      runsDir,
      runExtraction: async (input) => ({
        runId: 'unused',
        url: input.url,
        outDir: runDir,
        discoveredPages: [],
        artifacts: {
          designMd: '',
          evidenceJson: '',
          previewHtml: '',
        },
        summary: {
          source: { primaryUrl: input.url, capturedAt: '' },
          styleThesis: '',
          bestScreenshotHref: null,
          pages: [],
          colors: [],
          typography: [],
          spacing: [],
          radii: [],
          shadows: [],
          surfaces: [],
          warnings: [],
          components: [],
          screenshots: [],
        },
      }),
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });

    try {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;

      const ok = await getRaw(port, '/runs/example-com-123/bundle.zip');
      expect(ok.status).toBe(200);
      expect(ok.headers['content-type']).toBe('application/zip');
      expect(ok.headers['content-disposition']).toBe(
        'attachment; filename="example-com-123.zip"',
      );
      expect(ok.body[0]).toBe(0x50);
      expect(ok.body[1]).toBe(0x4b);
      expect(ok.body.length).toBeGreaterThan(100);

      const missing = await getRaw(port, '/runs/does-not-exist/bundle.zip');
      expect(missing.status).toBe(404);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it('blocks runId "." path-traversal at the HTTP layer (returns non-200)', async () => {
    // Note: new URL(req.url, base) in the server normalises /runs/./bundle.zip
    // to /runs/bundle.zip before routing, so the bundle-route regex never
    // matches and the request returns 404 — not 403. The 403 guard in
    // serveRunBundle is exercised directly in tests/unit/serveRunBundle.test.ts.
    // This test verifies that the HTTP endpoint never returns 200 for the
    // traversal path, confirming no data leaks regardless of which layer blocks.
    runsDir = join(tmpdir(), `gui-runs-${process.pid}-${Date.now()}`);
    await mkdir(runsDir, { recursive: true });

    const server = createGuiServer({
      runsDir,
      runExtraction: async (input) => ({
        runId: 'unused',
        url: input.url,
        outDir: runsDir,
        discoveredPages: [],
        artifacts: { designMd: '', evidenceJson: '', previewHtml: '' },
        summary: {
          source: { primaryUrl: input.url, capturedAt: '' },
          styleThesis: '',
          bestScreenshotHref: null,
          pages: [],
          colors: [],
          typography: [],
          spacing: [],
          radii: [],
          shadows: [],
          surfaces: [],
          warnings: [],
          components: [],
          screenshots: [],
        },
      }),
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });

    try {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      // Use getRaw so the raw path string is sent without client-side normalisation.
      const res = await getRaw(port, '/runs/./bundle.zip');
      expect(res.status).not.toBe(200);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
