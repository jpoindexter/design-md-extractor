import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Evidence } from '../../src/types/evidence.js';
import { writeArtifacts } from '../../src/io/writeArtifacts.js';

const evidence: Evidence = {
  version: '0.1.0',
  source: {
    primaryUrl: 'https://example.com',
    pages: [{ url: 'https://example.com', status: 'success' }],
    capturedAt: '2026-05-28T10:00:00.000Z',
  },
  viewports: [],
  screenshots: [],
  tokens: { colors: [], typography: [], spacing: [], radii: [], shadows: [] },
  surfaces: [],
  components: [],
  layout: { density: 'comfortable' },
  imagery: { strategy: 'unknown' },
  responsive: { notes: [] },
  warnings: [],
};

describe('writeArtifacts', () => {
  it('writes evidence, markdown, and preview files', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'design-md-'));
    try {
      await writeArtifacts({ outDir: dir, evidence, designMd: '# Design', previewHtml: '<html></html>' });

      await expect(readFile(join(dir, 'evidence.json'), 'utf8')).resolves.toContain('"version": "0.1.0"');
      await expect(readFile(join(dir, 'DESIGN.md'), 'utf8')).resolves.toContain('# Design');
      await expect(readFile(join(dir, 'preview.html'), 'utf8')).resolves.toContain('<html>');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
