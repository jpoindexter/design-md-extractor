import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { defaultViewports } from '../../src/config/viewports.js';
import { runExtraction } from '../../src/crawl/runExtraction.js';

describe('runExtraction', () => {
  it('creates output artifacts from a local file URL', async () => {
    const outDir = await mkdtemp(join(tmpdir(), 'design-md-run-'));
    const fixtureUrl = pathToFileURL(resolve('tests/fixtures/sample-site.html')).toString();

    try {
      await runExtraction({
        url: fixtureUrl,
        outDir,
        pages: [],
        viewports: [defaultViewports[0]],
        maxComponents: 20,
        preview: true,
        timeoutMs: 30000,
      });

      await expect(readFile(join(outDir, 'evidence.json'), 'utf8')).resolves.toContain('"primaryUrl"');
      await expect(readFile(join(outDir, 'DESIGN.md'), 'utf8')).resolves.toContain('# Design System:');
      await expect(readFile(join(outDir, 'preview.html'), 'utf8')).resolves.toContain('Design MD Preview');
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
