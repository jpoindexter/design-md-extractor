import { ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { serveRunBundle } from '../../src/gui/server.js';

// Minimal ServerResponse stub — only the methods serveRunBundle calls.
function makeRes(): {
  res: ServerResponse;
  statusCode: number | null;
  body: string | null;
} {
  const state = {
    statusCode: null as number | null,
    body: null as string | null,
  };
  const res = {
    writeHead(code: number) {
      state.statusCode = code;
    },
    end(body?: string) {
      state.body = body ?? '';
    },
  } as unknown as ServerResponse;
  return {
    res,
    ...state,
    get statusCode() {
      return state.statusCode;
    },
    get body() {
      return state.body;
    },
  };
}

describe('serveRunBundle — path-traversal guard', () => {
  it('returns 403 when runId is "." (resolves to runsDir root)', async () => {
    const runsDir = join(tmpdir(), `guard-test-${process.pid}`);
    const stub = makeRes();
    await serveRunBundle(stub.res, runsDir, '.');
    expect(stub.statusCode).toBe(403);
  });

  it('returns 403 when runId resolves outside runsDir', async () => {
    const runsDir = join(tmpdir(), `guard-test-${process.pid}`);
    // resolve(runsDir, '../sibling') would escape root
    const stub = makeRes();
    await serveRunBundle(stub.res, runsDir, '../sibling');
    expect(stub.statusCode).toBe(403);
  });
});
