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

export async function runExtraction(config: ExtractConfig): Promise<void> {
  const urls = [config.url, ...config.pages];
  const screenshots: Array<{ viewport: string; url: string; path: string }> = [];
  const rawPages: Array<RawPageEvidence & { viewport: string }> = [];
  const pages: Array<{ url: string; status: 'success' | 'failed'; error?: string }> = [];
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
          const screenshotPath = join('screenshots', `${viewport.name}-home.png`);
          await page.screenshot({ path: join(config.outDir, screenshotPath), fullPage: false });
          screenshots.push({ viewport: viewport.name, url, path: screenshotPath });
          rawPages.push({ ...raw, viewport: viewport.name });
          await page.close();
          pages.push({ url, status: 'success' });
        } catch (error) {
          pages.push({
            url,
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  });

  if (rawPages.length === 0) {
    throw new Error(`No pages loaded successfully for ${config.url}`);
  }

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
