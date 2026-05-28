import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generateStyleCss } from '../generate/generateStyleCss.js';
import type { Evidence } from '../types/evidence.js';
import { resolveOutputPath } from './safePaths.js';

export async function writeArtifacts(input: {
  outDir: string;
  evidence: Evidence;
  designMd: string;
  previewHtml?: string;
}): Promise<void> {
  const outDir = resolveOutputPath(input.outDir);
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'evidence.json'), `${JSON.stringify(input.evidence, null, 2)}\n`, 'utf8');
  await writeFile(join(outDir, 'DESIGN.md'), input.designMd, 'utf8');
  await writeFile(join(outDir, 'tokens.css'), generateStyleCss(input.evidence), 'utf8');

  if (input.previewHtml) {
    await writeFile(join(outDir, 'preview.html'), input.previewHtml, 'utf8');
  }
}
