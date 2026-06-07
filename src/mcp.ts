#!/usr/bin/env node
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { version } from './index.js';
import { runGuiExtraction, summarizeEvidence } from './gui/runGuiExtraction.js';
import { EvidenceSchema } from './evidence/evidenceSchema.js';

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaultRunsDir =
  process.env['DESIGN_MD_RUNS_DIR'] ?? join(packageDir, 'out', 'gui-runs');

const server = new McpServer({ name: 'design-md-extractor', version });

server.registerTool(
  'extract_design',
  {
    title: 'Extract Design System',
    description:
      'Extracts a live website’s visual system — colors, gradients, typography, spacing, radii, shadows, surfaces, components (semantic names + reuse counts), layout, imagery strategy, motion, and hover/focus interaction states — across desktop/tablet/mobile. Returns the full DESIGN.md content plus a structured summary; all artifacts (DESIGN.md, evidence.json, tokens.css, tailwind-theme.js, design-tokens.json, ai-prompt.txt, preview.html, screenshots) are written to disk. For Cloudflare/login-walled sites, pass a cookies file (and matching User-Agent).',
    inputSchema: {
      url: z.string().url().describe('URL of the website to extract'),
      maxPages: z
        .number()
        .int()
        .min(1)
        .max(12)
        .optional()
        .default(5)
        .describe('Maximum pages to crawl (1–12, default 5)'),
      cookies: z
        .string()
        .optional()
        .describe(
          'Path to a cookie file (Playwright JSON or Netscape cookies.txt) to inject for Cloudflare/login-walled sites',
        ),
      userAgent: z
        .string()
        .optional()
        .describe(
          'User-Agent matching the browser that produced the cookies (so cf_clearance validates)',
        ),
    },
  },
  async ({ url, maxPages, cookies, userAgent }) => {
    try {
      const result = await runGuiExtraction(
        { url, maxPages: maxPages ?? 5, cookies, userAgent },
        defaultRunsDir,
      );
      const designMd = await readFile(join(result.outDir, 'DESIGN.md'), 'utf8');
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                runId: result.runId,
                url: result.url,
                outDir: result.outDir,
                discoveredPages: result.discoveredPages,
                summary: result.summary,
                designMd,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: err instanceof Error ? err.message : String(err),
          },
        ],
      };
    }
  },
);

server.registerTool(
  'list_runs',
  {
    title: 'List Extraction Runs',
    description:
      'Lists previously completed design extractions stored on disk.',
  },
  async () => {
    try {
      if (!existsSync(defaultRunsDir)) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify([]) }],
        };
      }
      const entries = await readdir(defaultRunsDir, { withFileTypes: true });
      const runs: Array<{
        runId: string;
        url: string;
        capturedAt: string;
        outDir: string;
      }> = [];
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const evidencePath = join(defaultRunsDir, entry.name, 'evidence.json');
        if (!existsSync(evidencePath)) continue;
        try {
          const raw = JSON.parse(
            await readFile(evidencePath, 'utf8'),
          ) as unknown;
          const evidence = EvidenceSchema.parse(raw);
          runs.push({
            runId: entry.name,
            url: evidence.source.primaryUrl,
            capturedAt: evidence.source.capturedAt,
            outDir: join(defaultRunsDir, entry.name),
          });
        } catch {
          // skip malformed runs
        }
      }
      runs.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
      return {
        content: [
          { type: 'text' as const, text: JSON.stringify(runs, null, 2) },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: err instanceof Error ? err.message : String(err),
          },
        ],
      };
    }
  },
);

server.registerTool(
  'get_run',
  {
    title: 'Get Extraction Run',
    description:
      'Retrieves the DESIGN.md and summary for a previously completed extraction by runId.',
    inputSchema: {
      runId: z
        .string()
        .describe('The runId returned by extract_design or list_runs'),
    },
  },
  async ({ runId }) => {
    try {
      const runDir = join(defaultRunsDir, runId);
      const evidencePath = join(runDir, 'evidence.json');
      if (!existsSync(evidencePath)) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: `Run "${runId}" not found at ${runDir}`,
            },
          ],
        };
      }
      const raw = JSON.parse(await readFile(evidencePath, 'utf8')) as unknown;
      const designMd = await readFile(join(runDir, 'DESIGN.md'), 'utf8');
      const summary = summarizeEvidence(runId, raw);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              { runId, outDir: runDir, summary, designMd },
              null,
              2,
            ),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: err instanceof Error ? err.message : String(err),
          },
        ],
      };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
