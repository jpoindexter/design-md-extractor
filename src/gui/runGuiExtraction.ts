import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defaultViewports } from '../config/viewports.js';
import { discoverStylePages } from '../crawl/discoverPages.js';
import { runExtraction } from '../crawl/runExtraction.js';
import { EvidenceSchema } from '../evidence/evidenceSchema.js';
import type { GuiRunInput, GuiRunResult } from './types.js';

function slugForRun(url: string): string {
  const parsed = new URL(url);
  const host = parsed.hostname.replace(/^www\./, '') || 'site';
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  return `${host}-${stamp}`.replace(/[^a-zA-Z0-9.-]+/g, '-').toLowerCase();
}

function artifactUrl(runId: string, path: string): string {
  return `/runs/${runId}/${path.split(/[\\/]/).join('/')}`;
}

export function summarizeEvidence(runId: string, evidenceJson: unknown): GuiRunResult['summary'] {
  const evidence = EvidenceSchema.parse(evidenceJson);
  return {
    pages: evidence.source.pages,
    colors: evidence.tokens.colors.slice(0, 12).map((color) => ({
      name: color.name,
      value: color.value,
      role: color.role,
      confidence: color.confidence,
    })),
    typography: evidence.tokens.typography.slice(0, 8).map((typography) => ({
      role: typography.role,
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      confidence: typography.confidence,
    })),
    components: evidence.components.slice(0, 12).map((component) => ({
      name: component.name,
      kind: component.kind,
      role: component.role,
      count: component.count,
      confidence: component.confidence,
    })),
    screenshots: evidence.screenshots.map((screenshot) => ({
      ...screenshot,
      href: artifactUrl(runId, screenshot.path),
    })),
  };
}

export async function runGuiExtraction(input: GuiRunInput, runsDir = resolve('out/gui-runs')): Promise<GuiRunResult> {
  const url = new URL(input.url).toString();
  const runId = slugForRun(url);
  const outDir = resolve(runsDir, runId);
  const maxPages = Math.max(1, Math.min(input.maxPages, 12));
  const discoveredPages = await discoverStylePages({
    url,
    limit: maxPages - 1,
    timeoutMs: 30000,
  });

  await runExtraction({
    url,
    outDir,
    pages: discoveredPages,
    viewports: defaultViewports,
    maxComponents: 180,
    preview: true,
    timeoutMs: 30000,
  });

  const evidenceJson = JSON.parse(await readFile(resolve(outDir, 'evidence.json'), 'utf8'));

  return {
    runId,
    url,
    outDir,
    discoveredPages,
    artifacts: {
      designMd: artifactUrl(runId, 'DESIGN.md'),
      evidenceJson: artifactUrl(runId, 'evidence.json'),
      previewHtml: artifactUrl(runId, 'preview.html'),
    },
    summary: summarizeEvidence(runId, evidenceJson),
  };
}
