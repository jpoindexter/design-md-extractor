import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generateAiPrompt } from '../generate/generateAiPrompt.js';
import { generateStyleCss } from '../generate/generateStyleCss.js';
import { generateTailwind } from '../generate/generateTailwind.js';
import { generateTokensJson } from '../generate/generateTokensJson.js';
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
  await Promise.all([
    writeFile(
      join(outDir, 'evidence.json'),
      `${JSON.stringify(input.evidence, null, 2)}\n`,
      'utf8',
    ),
    writeFile(join(outDir, 'DESIGN.md'), input.designMd, 'utf8'),
    writeFile(
      join(outDir, 'tokens.css'),
      generateStyleCss(input.evidence),
      'utf8',
    ),
    writeFile(
      join(outDir, 'tailwind-theme.js'),
      generateTailwind(input.evidence),
      'utf8',
    ),
    writeFile(
      join(outDir, 'design-tokens.json'),
      generateTokensJson(input.evidence),
      'utf8',
    ),
    writeFile(
      join(outDir, 'ai-prompt.txt'),
      generateAiPrompt(input.evidence),
      'utf8',
    ),
    ...(input.previewHtml
      ? [writeFile(join(outDir, 'preview.html'), input.previewHtml, 'utf8')]
      : []),
  ]);
}
