import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { ExtractConfig } from '../config/parseArgs.js';
import { normalizeEvidence } from '../evidence/normalizeEvidence.js';
import { collectPageEvidence, type RawPageEvidence } from '../extract/collectPageEvidence.js';
import { generateDesignMd } from '../generate/generateDesignMd.js';
import { generatePreviewHtml } from '../generate/generatePreviewHtml.js';
import { writeArtifacts } from '../io/writeArtifacts.js';
import { withBrowser } from './browserSession.js';
import { newLoadedPage } from './pageLoader.js';

function urlSlug(input: string): string {
  const parsed = new URL(input);
  if (parsed.protocol === 'file:') {
    const segments = parsed.pathname.split('/').filter(Boolean);
    const name = segments.at(-1) ?? 'local-file';
    return name.replace(/[^a-zA-Z0-9.-]+/g, '-').toLowerCase();
  }

  const host = parsed.hostname.replace(/^www\./, '');
  const pathSlug = parsed.pathname.replace(/\/+/g, '-').replace(/^-|-$/g, '');
  const base = pathSlug.length > 0 ? `${host}-${pathSlug}` : host;
  return base.replace(/[^a-zA-Z0-9.-]+/g, '-').toLowerCase();
}

export async function runExtraction(config: ExtractConfig): Promise<void> {
  const urls = Array.from(new Set([config.url, ...config.pages]));
  const screenshots: Array<{ viewport: string; url: string; path: string }> = [];
  const rawPages: Array<RawPageEvidence & { viewport: string }> = [];
  const pageResults = new Map<string, { success: boolean; errors: string[] }>();
  for (const url of urls) {
    pageResults.set(url, { success: false, errors: [] });
  }
  const screenshotDir = join(config.outDir, 'screenshots');
  await mkdir(screenshotDir, { recursive: true });

  await withBrowser(async (browser) => {
    for (const url of urls) {
      for (const viewport of config.viewports) {
        try {
          const page = await newLoadedPage({ browser, url, viewport, timeoutMs: config.timeoutMs });
          const raw = await collectPageEvidence(page, {
            viewport: viewport.name,
            maxComponents: config.maxComponents,
          });
          const screenshotPath = join('screenshots', `${urlSlug(url)}-${viewport.name}.png`);
          await page.screenshot({ path: join(config.outDir, screenshotPath), fullPage: false });
          screenshots.push({ viewport: viewport.name, url, path: screenshotPath });
          rawPages.push({ ...raw, viewport: viewport.name });
          await page.close();
          const result = pageResults.get(url);
          if (result) {
            result.success = true;
          }
        } catch (error) {
          const result = pageResults.get(url);
          if (result) {
            result.errors.push(error instanceof Error ? error.message : String(error));
          }
        }
      }
    }
  });

  if (rawPages.length === 0) {
    throw new Error(`No pages loaded successfully for ${config.url}`);
  }

  const pages: Array<{ url: string; status: 'success' | 'failed'; error?: string }> = urls.map((url) => {
    const result = pageResults.get(url);
    if (result?.success) {
      return { url, status: 'success' };
    }
    return {
      url,
      status: 'failed',
      error: result?.errors.join(' | ') || 'Failed to load page across all viewports.',
    };
  });

  const evidence = normalizeEvidence({
    primaryUrl: config.url,
    pages,
    capturedAt: new Date().toISOString(),
    viewports: config.viewports,
    screenshots,
    rawPages,
  });
  const designMd = generateDesignMd(evidence);
  const previewHtml = config.preview ? generatePreviewHtml(evidence) : undefined;
  await writeArtifacts({ outDir: config.outDir, evidence, designMd, previewHtml });
}
