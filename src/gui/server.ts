import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { renderAppHtml } from './appHtml.js';
import { runGuiExtraction } from './runGuiExtraction.js';
import type { GuiRunner } from './types.js';

type CreateGuiServerOptions = {
  runExtraction?: GuiRunner;
  runsDir?: string;
};

function contentType(path: string): string {
  switch (extname(path)) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.md':
      return 'text/markdown; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.png':
      return 'image/png';
    default:
      return 'application/octet-stream';
  }
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readRequestJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolveRequest, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 64) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolveRequest(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON body.'));
      }
    });
    req.on('error', reject);
  });
}

async function serveRunFile(res: ServerResponse, runsDir: string, requestPath: string): Promise<void> {
  const relative = decodeURIComponent(requestPath.replace(/^\/runs\//, ''));
  const absolute = resolve(runsDir, relative);
  const root = resolve(runsDir);
  if (absolute !== root && !absolute.startsWith(`${root}${sep}`)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const fileStat = await stat(absolute);
    if (!fileStat.isFile()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'content-type': contentType(absolute) });
    createReadStream(absolute).pipe(res);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}

export function createGuiServer(options: CreateGuiServerOptions = {}): Server {
  const runsDir = resolve(options.runsDir ?? 'out/gui-runs');
  const runner = options.runExtraction ?? ((input) => runGuiExtraction(input, runsDir));

  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');

    if (req.method === 'GET' && url.pathname === '/') {
      const html = renderAppHtml();
      res.writeHead(200, {
        'content-type': 'text/html; charset=utf-8',
        'content-length': Buffer.byteLength(html),
      });
      res.end(html);
      return;
    }

    if (req.method === 'GET' && url.pathname.startsWith('/runs/')) {
      await serveRunFile(res, runsDir, url.pathname);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/extract') {
      try {
        const body = (await readRequestJson(req)) as { url?: unknown; maxPages?: unknown };
        const targetUrl = new URL(String(body.url ?? '')).toString();
        const maxPages = Number.isFinite(Number(body.maxPages)) ? Number(body.maxPages) : 7;
        const result = await runner({ url: targetUrl, maxPages });
        sendJson(res, 200, result);
      } catch (error) {
        sendJson(res, 400, { error: error instanceof Error ? error.message : String(error) });
      }
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });
}

export function startGuiServer(input: { port: number; host?: string; runsDir?: string }): Server {
  const server = createGuiServer({ runsDir: input.runsDir });
  const host = input.host ?? '127.0.0.1';
  server.listen(input.port, host, () => {
    console.log(`Design MD Extractor GUI running at http://${host}:${input.port}`);
  });
  return server;
}
