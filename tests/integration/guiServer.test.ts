import { request } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createGuiServer } from '../../src/gui/server.js';

function postJson(port: number, path: string, body: unknown): Promise<{ status: number; json: unknown }> {
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
          bestScreenshotHref: '/runs/example-com-123/screenshots/example-com-desktop.png',
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
          shadows: [{ name: 'Shadow 1', value: '0 4px 16px rgba(0,0,0,.12)', confidence: 'medium' }],
          surfaces: [
            {
              level: 1,
              name: 'Base Surface',
              value: '#ffffff',
              purpose: 'Primary canvas',
              confidence: 'high',
            },
          ],
          warnings: [{ code: 'PARTIAL_SCAN', message: 'Only one page inspected.', severity: 'info' }],
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
      const response = await postJson(port, '/api/extract', { url: 'https://example.com' });

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
          bestScreenshotHref: '/runs/example-com-123/screenshots/example-com-desktop.png',
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
