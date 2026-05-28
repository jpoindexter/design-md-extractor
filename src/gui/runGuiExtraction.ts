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

function pickBestScreenshotHref(
  runId: string,
  screenshots: Array<{ viewport: string; url: string; path: string }>,
  primaryUrl: string,
): string | null {
  const desktopForPrimary = screenshots.find((shot) => shot.viewport === 'desktop' && shot.url === primaryUrl);
  if (desktopForPrimary) {
    return artifactUrl(runId, desktopForPrimary.path);
  }

  const desktop = screenshots.find((shot) => shot.viewport === 'desktop');
  if (desktop) {
    return artifactUrl(runId, desktop.path);
  }

  const primary = screenshots.find((shot) => shot.url === primaryUrl);
  if (primary) {
    return artifactUrl(runId, primary.path);
  }

  const fallback = screenshots.at(0);
  return fallback ? artifactUrl(runId, fallback.path) : null;
}

function generateStyleThesis(evidence: ReturnType<typeof EvidenceSchema.parse>): string {
  const density = evidence.layout.density;
  const dominantColor = evidence.tokens.colors[0]?.value;
  const accentColor = evidence.tokens.colors[1]?.value;
  const primaryFont = evidence.tokens.typography[0]?.fontFamily;
  const surfaceCount = evidence.surfaces.length;
  const successfulPages = evidence.source.pages.filter((page) => page.status === 'success').length;

  const colorPhrase =
    dominantColor && accentColor
      ? `${dominantColor} primary and ${accentColor} secondary`
      : dominantColor
      ? dominantColor
      : 'a restrained neutral palette';
  const typographyPhrase = primaryFont ? `${primaryFont} as the main typeface` : 'a compact typography stack';
  const surfacePhrase = surfaceCount > 0 ? `${surfaceCount} distinct surface levels` : 'minimal surface layering';

  return `${density} density, ${colorPhrase}, ${typographyPhrase}, and ${surfacePhrase} across ${successfulPages} inspected pages.`;
}

export function summarizeEvidence(runId: string, evidenceJson: unknown): GuiRunResult['summary'] {
  const evidence = EvidenceSchema.parse(evidenceJson);

  return {
    source: {
      primaryUrl: evidence.source.primaryUrl,
      capturedAt: evidence.source.capturedAt,
    },
    styleThesis: generateStyleThesis(evidence),
    bestScreenshotHref: pickBestScreenshotHref(runId, evidence.screenshots, evidence.source.primaryUrl),
    pages: evidence.source.pages,
    colors: evidence.tokens.colors.slice(0, 12).map((color) => ({
      name: color.name,
      value: color.value,
      cssVariable: color.cssVariable,
      role: color.role,
      confidence: color.confidence,
    })),
    typography: evidence.tokens.typography.slice(0, 8).map((typography) => ({
      role: typography.role,
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      lineHeight: typography.lineHeight,
      letterSpacing: typography.letterSpacing,
      confidence: typography.confidence,
    })),
    spacing: evidence.tokens.spacing.slice(0, 12).map((spacing) => ({
      name: spacing.name,
      value: spacing.value,
      confidence: spacing.confidence,
    })),
    radii: evidence.tokens.radii.slice(0, 12).map((radius) => ({
      name: radius.name,
      value: radius.value,
      confidence: radius.confidence,
    })),
    shadows: evidence.tokens.shadows.slice(0, 12).map((shadow) => ({
      name: shadow.name,
      value: shadow.value,
      confidence: shadow.confidence,
    })),
    surfaces: evidence.surfaces.slice(0, 12).map((surface) => ({
      level: surface.level,
      name: surface.name,
      value: surface.value,
      purpose: surface.purpose,
      confidence: surface.confidence,
    })),
    warnings: evidence.warnings,
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
