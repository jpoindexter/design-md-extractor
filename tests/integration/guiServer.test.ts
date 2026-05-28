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
          pages: [{ url: 'https://example.com/', status: 'success' }],
          colors: [],
          typography: [],
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
      });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
