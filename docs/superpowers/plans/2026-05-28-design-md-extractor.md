# Design MD Extractor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local TypeScript CLI that extracts public website style evidence and generates `evidence.json`, `DESIGN.md`, `preview.html`, and screenshots, then package a Codex skill workflow around it.

**Architecture:** Use Playwright for browser evidence, Zod for schema validation, deterministic TypeScript generators for markdown and HTML, and a separate Codex skill wrapper for agent refinement. Keep extraction, normalization, generation, and IO in separate modules.

**Tech Stack:** Node.js 20+, TypeScript, Playwright, Commander, Zod, Vitest, ESLint, Prettier.

---

## File Structure

Create this structure:

```text
package.json
tsconfig.json
vitest.config.ts
eslint.config.js
prettier.config.cjs
src/
  cli.ts
  index.ts
  config/
    parseArgs.ts
    viewports.ts
  crawl/
    runExtraction.ts
    browserSession.ts
    pageLoader.ts
  extract/
    collectPageEvidence.ts
    collectColors.ts
    collectTypography.ts
    collectComponents.ts
    collectLayout.ts
    selectorPath.ts
  evidence/
    evidenceSchema.ts
    normalizeEvidence.ts
    confidence.ts
  generate/
    generateDesignMd.ts
    generatePreviewHtml.ts
  io/
    safePaths.ts
    writeArtifacts.ts
  types/
    evidence.ts
tests/
  fixtures/
    sample-site.html
  unit/
  integration/
skill/
  SKILL.md
  references/
    design-md-format.md
    evidence-rubric.md
  scripts/
    extract-website-style.sh
```

## Task 1: Scaffold TypeScript Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `eslint.config.js`
- Create: `prettier.config.cjs`
- Create: `src/index.ts`
- Test: `tests/unit/version.test.ts`

- [ ] **Step 1: Create package metadata**

Create `package.json`:

```json
{
  "name": "design-md-extractor",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": {
    "design-md-extractor": "./dist/cli.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint .",
    "format": "prettier --write .",
    "check": "npm run build && npm run lint && npm test"
  },
  "dependencies": {
    "commander": "^14.0.1",
    "playwright": "^1.54.0",
    "zod": "^4.0.15"
  },
  "devDependencies": {
    "@eslint/js": "^9.33.0",
    "@types/node": "^24.3.0",
    "eslint": "^9.33.0",
    "prettier": "^3.6.2",
    "typescript": "^5.9.2",
    "typescript-eslint": "^8.40.0",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Create TypeScript config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "rootDir": ".",
    "outDir": "dist",
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*.ts", "tests/**/*.ts", "vitest.config.ts", "eslint.config.js"]
}
```

- [ ] **Step 3: Create test and lint config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

Create `eslint.config.js`:

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**', 'out/**'],
  },
);
```

Create `prettier.config.cjs`:

```js
module.exports = {
  singleQuote: true,
  trailingComma: 'all',
};
```

- [ ] **Step 4: Create empty public API**

Create `src/index.ts`:

```ts
export const version = '0.1.0';
```

Create `tests/unit/version.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { version } from '../../src/index.js';

describe('version', () => {
  it('exports the package version', () => {
    expect(version).toBe('0.1.0');
  });
});
```

- [ ] **Step 5: Install and verify**

Run:

```bash
npm install
npm run build
npm test
```

Expected: build succeeds and Vitest reports one passing test.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts eslint.config.js prettier.config.cjs src/index.ts tests/unit/version.test.ts
git commit -m "chore: scaffold typescript project"
```

## Task 2: Define Evidence Types and Schema

**Files:**
- Create: `src/types/evidence.ts`
- Create: `src/evidence/evidenceSchema.ts`
- Test: `tests/unit/evidenceSchema.test.ts`

- [ ] **Step 1: Write failing schema test**

Create `tests/unit/evidenceSchema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { EvidenceSchema } from '../../src/evidence/evidenceSchema.js';

describe('EvidenceSchema', () => {
  it('accepts a minimal valid evidence document', () => {
    const parsed = EvidenceSchema.parse({
      version: '0.1.0',
      source: {
        primaryUrl: 'https://example.com',
        pages: [{ url: 'https://example.com', status: 'success' }],
        capturedAt: '2026-05-28T10:00:00.000Z',
      },
      viewports: [{ name: 'desktop', width: 1440, height: 1000 }],
      screenshots: [],
      tokens: {
        colors: [],
        typography: [],
        spacing: [],
        radii: [],
        shadows: [],
      },
      surfaces: [],
      components: [],
      layout: { density: 'comfortable' },
      imagery: { strategy: 'unknown' },
      responsive: { notes: [] },
      warnings: [],
    });

    expect(parsed.source.primaryUrl).toBe('https://example.com');
  });

  it('rejects invalid confidence values', () => {
    expect(() =>
      EvidenceSchema.parse({
        version: '0.1.0',
        source: {
          primaryUrl: 'https://example.com',
          pages: [],
          capturedAt: '2026-05-28T10:00:00.000Z',
        },
        viewports: [],
        screenshots: [],
        tokens: {
          colors: [
            {
              name: 'Canvas',
              value: '#ffffff',
              role: 'Page background',
              frequency: 1,
              properties: ['background-color'],
              sampleSelectors: ['body'],
              confidence: 'certain',
            },
          ],
          typography: [],
          spacing: [],
          radii: [],
          shadows: [],
        },
        surfaces: [],
        components: [],
        layout: { density: 'comfortable' },
        imagery: { strategy: 'unknown' },
        responsive: { notes: [] },
        warnings: [],
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/evidenceSchema.test.ts
```

Expected: FAIL because `src/evidence/evidenceSchema.ts` does not exist.

- [ ] **Step 3: Implement schema and types**

Create `src/types/evidence.ts`:

```ts
import type { z } from 'zod';
import type { EvidenceSchema } from '../evidence/evidenceSchema.js';

export type Evidence = z.infer<typeof EvidenceSchema>;
export type Confidence = 'high' | 'medium' | 'low';
export type ViewportName = 'desktop' | 'tablet' | 'mobile' | string;
```

Create `src/evidence/evidenceSchema.ts`:

```ts
import { z } from 'zod';

export const ConfidenceSchema = z.enum(['high', 'medium', 'low']);

export const EvidenceSchema = z.object({
  version: z.string(),
  source: z.object({
    primaryUrl: z.string().url(),
    pages: z.array(
      z.object({
        url: z.string().url(),
        status: z.enum(['success', 'failed']),
        error: z.string().optional(),
      }),
    ),
    capturedAt: z.string(),
  }),
  viewports: z.array(
    z.object({
      name: z.string(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    }),
  ),
  screenshots: z.array(
    z.object({
      viewport: z.string(),
      url: z.string().url(),
      path: z.string(),
    }),
  ),
  tokens: z.object({
    colors: z.array(
      z.object({
        name: z.string(),
        value: z.string(),
        cssVariable: z.string().optional(),
        role: z.string(),
        properties: z.array(z.string()),
        frequency: z.number().int().nonnegative(),
        sampleSelectors: z.array(z.string()),
        confidence: ConfidenceSchema,
      }),
    ),
    typography: z.array(
      z.object({
        role: z.string(),
        fontFamily: z.string(),
        fallback: z.string().optional(),
        fontSize: z.string(),
        fontWeight: z.string(),
        lineHeight: z.string(),
        letterSpacing: z.string(),
        sampleSelectors: z.array(z.string()),
        confidence: ConfidenceSchema,
      }),
    ),
    spacing: z.array(z.object({ name: z.string(), value: z.string(), confidence: ConfidenceSchema })),
    radii: z.array(z.object({ name: z.string(), value: z.string(), confidence: ConfidenceSchema })),
    shadows: z.array(z.object({ name: z.string(), value: z.string(), confidence: ConfidenceSchema })),
  }),
  surfaces: z.array(
    z.object({
      level: z.number().int().nonnegative(),
      name: z.string(),
      value: z.string(),
      purpose: z.string(),
      sampleSelectors: z.array(z.string()),
      confidence: ConfidenceSchema,
    }),
  ),
  components: z.array(
    z.object({
      name: z.string(),
      kind: z.string(),
      role: z.string(),
      textSample: z.string().optional(),
      viewport: z.string(),
      selector: z.string(),
      count: z.number().int().positive(),
      styles: z.record(z.string(), z.string()),
      bounds: z.object({
        width: z.number().nonnegative(),
        height: z.number().nonnegative(),
      }),
      confidence: ConfidenceSchema,
    }),
  ),
  layout: z.object({
    density: z.string(),
    containerWidths: z.array(z.number()).optional(),
    sectionGaps: z.array(z.string()).optional(),
  }),
  imagery: z.object({
    strategy: z.string(),
    notes: z.array(z.string()).optional(),
  }),
  responsive: z.object({
    notes: z.array(z.string()),
  }),
  warnings: z.array(
    z.object({
      code: z.string(),
      message: z.string(),
      severity: z.enum(['info', 'warning', 'error']),
    }),
  ),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/unit/evidenceSchema.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/evidence.ts src/evidence/evidenceSchema.ts tests/unit/evidenceSchema.test.ts
git commit -m "feat: define evidence schema"
```

## Task 3: Parse CLI Arguments

**Files:**
- Create: `src/config/viewports.ts`
- Create: `src/config/parseArgs.ts`
- Create: `src/cli.ts`
- Test: `tests/unit/parseArgs.test.ts`

- [ ] **Step 1: Write failing argument parser test**

Create `tests/unit/parseArgs.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseExtractArgs } from '../../src/config/parseArgs.js';

describe('parseExtractArgs', () => {
  it('parses a valid extract command', () => {
    const config = parseExtractArgs([
      'extract',
      'https://example.com',
      '--out',
      'out/example',
      '--max-components',
      '25',
    ]);

    expect(config.url).toBe('https://example.com/');
    expect(config.outDir).toBe('out/example');
    expect(config.maxComponents).toBe(25);
    expect(config.viewports.map((viewport) => viewport.name)).toEqual(['desktop', 'tablet', 'mobile']);
  });

  it('rejects a missing output directory', () => {
    expect(() => parseExtractArgs(['extract', 'https://example.com'])).toThrow('--out is required');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/parseArgs.test.ts
```

Expected: FAIL because `parseArgs.ts` does not exist.

- [ ] **Step 3: Implement parser**

Create `src/config/viewports.ts`:

```ts
export type ViewportConfig = {
  name: string;
  width: number;
  height: number;
};

export const defaultViewports: ViewportConfig[] = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 768, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
];
```

Create `src/config/parseArgs.ts`:

```ts
import { Command } from 'commander';
import { defaultViewports, type ViewportConfig } from './viewports.js';

export type ExtractConfig = {
  url: string;
  outDir: string;
  pages: string[];
  viewports: ViewportConfig[];
  maxComponents: number;
  preview: boolean;
  timeoutMs: number;
};

export function parseExtractArgs(argv: string[]): ExtractConfig {
  const program = new Command();
  program.exitOverride();
  program.name('design-md-extractor');

  let config: ExtractConfig | undefined;

  program
    .command('extract')
    .argument('<url>')
    .option('--out <directory>')
    .option('--pages <urls...>', 'additional URLs to inspect', [])
    .option('--viewports <list>', 'comma-separated viewport names', 'desktop,tablet,mobile')
    .option('--max-components <number>', 'maximum component samples', '80')
    .option('--no-preview', 'skip preview.html')
    .option('--timeout <ms>', 'page load timeout', '30000')
    .action((url: string, options: Record<string, unknown>) => {
      if (!String(options.out).trim()) {
        throw new Error('--out is required');
      }

      const selectedNames = String(options.viewports)
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);
      const selectedViewports = defaultViewports.filter((viewport) => selectedNames.includes(viewport.name));

      config = {
        url: new URL(url).toString(),
        outDir: String(options.out),
        pages: Array.isArray(options.pages) ? options.pages.map((page) => new URL(String(page)).toString()) : [],
        viewports: selectedViewports.length > 0 ? selectedViewports : defaultViewports,
        maxComponents: Number.parseInt(String(options.maxComponents), 10),
        preview: options.preview !== false,
        timeoutMs: Number.parseInt(String(options.timeout), 10),
      };
    });

  program.parse(argv, { from: 'user' });

  if (!config) {
    throw new Error('extract command is required');
  }

  return config;
}
```

Create `src/cli.ts`:

```ts
#!/usr/bin/env node
import { parseExtractArgs } from './config/parseArgs.js';

async function main(): Promise<void> {
  const config = parseExtractArgs(process.argv.slice(2));
  console.log(JSON.stringify(config, null, 2));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/unit/parseArgs.test.ts
npm run build
```

Expected: PASS and build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/config/viewports.ts src/config/parseArgs.ts src/cli.ts tests/unit/parseArgs.test.ts
git commit -m "feat: parse extract command"
```

## Task 4: Add Deterministic Markdown Generator

**Files:**
- Create: `src/generate/generateDesignMd.ts`
- Test: `tests/unit/generateDesignMd.test.ts`

- [ ] **Step 1: Write failing generator test**

Create `tests/unit/generateDesignMd.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { generateDesignMd } from '../../src/generate/generateDesignMd.js';
import type { Evidence } from '../../src/types/evidence.js';

const evidence: Evidence = {
  version: '0.1.0',
  source: {
    primaryUrl: 'https://example.com',
    pages: [{ url: 'https://example.com', status: 'success' }],
    capturedAt: '2026-05-28T10:00:00.000Z',
  },
  viewports: [{ name: 'desktop', width: 1440, height: 1000 }],
  screenshots: [],
  tokens: {
    colors: [
      {
        name: 'Canvas White',
        value: '#ffffff',
        cssVariable: '--color-canvas-white',
        role: 'Page background',
        properties: ['background-color'],
        frequency: 12,
        sampleSelectors: ['body'],
        confidence: 'high',
      },
    ],
    typography: [
      {
        role: 'display',
        fontFamily: 'Inter',
        fallback: 'system-ui',
        fontSize: '48px',
        fontWeight: '600',
        lineHeight: '1.1',
        letterSpacing: '-0.04em',
        sampleSelectors: ['h1'],
        confidence: 'high',
      },
    ],
    spacing: [],
    radii: [],
    shadows: [],
  },
  surfaces: [
    {
      level: 0,
      name: 'Canvas',
      value: '#ffffff',
      purpose: 'Page background',
      sampleSelectors: ['body'],
      confidence: 'high',
    },
  ],
  components: [],
  layout: { density: 'comfortable' },
  imagery: { strategy: 'product-focused', notes: ['No photography observed.'] },
  responsive: { notes: ['Desktop captured.'] },
  warnings: [],
};

describe('generateDesignMd', () => {
  it('writes every required section', () => {
    const markdown = generateDesignMd(evidence);

    expect(markdown).toContain('# Design System: example.com');
    expect(markdown).toContain('## 1. Style Thesis');
    expect(markdown).toContain('## 3. Tokens');
    expect(markdown).toContain('| Canvas White | `#ffffff` | `--color-canvas-white` | Page background | high |');
    expect(markdown).toContain('## 11. Known Gaps');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/generateDesignMd.test.ts
```

Expected: FAIL because generator does not exist.

- [ ] **Step 3: Implement markdown generator**

Create `src/generate/generateDesignMd.ts`:

```ts
import type { Evidence } from '../types/evidence.js';

function siteName(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '');
}

function colorRows(evidence: Evidence): string {
  if (evidence.tokens.colors.length === 0) {
    return '| Name | Value | Token | Role | Confidence |\\n|------|-------|-------|------|------------|\\n';
  }

  return [
    '| Name | Value | Token | Role | Confidence |',
    '|------|-------|-------|------|------------|',
    ...evidence.tokens.colors.map(
      (color) =>
        `| ${color.name} | \\`${color.value}\\` | \\`${color.cssVariable ?? ''}\\` | ${color.role} | ${color.confidence} |`,
    ),
  ].join('\\n');
}

function typographyRows(evidence: Evidence): string {
  return [
    '| Role | Font | Size | Weight | Line Height | Letter Spacing | Confidence |',
    '|------|------|------|--------|-------------|----------------|------------|',
    ...evidence.tokens.typography.map(
      (type) =>
        `| ${type.role} | ${type.fontFamily} | ${type.fontSize} | ${type.fontWeight} | ${type.lineHeight} | ${type.letterSpacing} | ${type.confidence} |`,
    ),
  ].join('\\n');
}

function surfaceRows(evidence: Evidence): string {
  return [
    '| Level | Name | Value | Purpose | Confidence |',
    '|-------|------|-------|---------|------------|',
    ...evidence.surfaces.map(
      (surface) =>
        `| ${surface.level} | ${surface.name} | \\`${surface.value}\\` | ${surface.purpose} | ${surface.confidence} |`,
    ),
  ].join('\\n');
}

export function generateDesignMd(evidence: Evidence): string {
  const name = siteName(evidence.source.primaryUrl);
  const inspectedPages = evidence.source.pages.map((page) => `- ${page.url}: ${page.status}`).join('\\n');
  const viewportList = evidence.viewports
    .map((viewport) => `- ${viewport.name}: ${viewport.width}x${viewport.height}`)
    .join('\\n');
  const warnings =
    evidence.warnings.length === 0
      ? '- No extraction warnings recorded.'
      : evidence.warnings.map((warning) => `- ${warning.severity}: ${warning.message}`).join('\\n');

  return `# Design System: ${name}

## 1. Style Thesis

${name} uses a ${evidence.layout.density} visual density. The extracted style reference below is grounded in computed browser evidence and should be refined by reviewing screenshots before use in production.

## 2. Source Evidence

Captured at: ${evidence.source.capturedAt}

Inspected pages:

${inspectedPages}

Viewports:

${viewportList}

## 3. Tokens

### Colors

${colorRows(evidence)}

### Typography

${typographyRows(evidence)}

## 4. Surfaces

${surfaceRows(evidence)}

## 5. Components

${evidence.components.length === 0 ? 'No reusable components were confidently detected.' : evidence.components.map((component) => `### ${component.name}\\n\\nRole: ${component.role}\\n\\nConfidence: ${component.confidence}`).join('\\n\\n')}

## 6. Layout System

Density: ${evidence.layout.density}

## 7. Imagery & Media

Strategy: ${evidence.imagery.strategy}

${evidence.imagery.notes?.map((note) => `- ${note}`).join('\\n') ?? '- No imagery notes recorded.'}

## 8. Responsive Behavior

${evidence.responsive.notes.map((note) => `- ${note}`).join('\\n')}

## 9. Do's and Don'ts

### Do
- Use the extracted tokens by semantic role.
- Preserve confidence notes when adapting the design.

### Don't
- Do not copy proprietary assets, logos, or licensed typefaces.
- Do not treat sparse evidence as a complete brand system.

## 10. Agent Prompt Guide

Use the color, typography, surface, and component tables above as the source of truth. Build one component at a time and reference token names instead of raw values where possible.

## 11. Known Gaps

${warnings}
`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/unit/generateDesignMd.test.ts
npm run build
```

Expected: PASS and build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/generate/generateDesignMd.ts tests/unit/generateDesignMd.test.ts
git commit -m "feat: generate design markdown"
```

## Task 5: Implement Fixture-Based Extraction

**Files:**
- Create: `tests/fixtures/sample-site.html`
- Create: `src/extract/selectorPath.ts`
- Create: `src/extract/collectPageEvidence.ts`
- Test: `tests/integration/collectPageEvidence.test.ts`

- [ ] **Step 1: Create local fixture**

Create `tests/fixtures/sample-site.html`:

```html
<!doctype html>
<html>
  <head>
    <style>
      :root {
        --brand: #ff5900;
        --canvas: #ffffff;
        --ink: #000000;
        --muted: #60646c;
      }
      body {
        margin: 0;
        background: var(--canvas);
        color: var(--ink);
        font-family: Inter, system-ui, sans-serif;
      }
      main {
        max-width: 1120px;
        margin: 0 auto;
        padding: 80px 24px;
      }
      h1 {
        font-size: 48px;
        line-height: 1.1;
        letter-spacing: -0.04em;
      }
      p {
        color: var(--muted);
        font-size: 16px;
        line-height: 1.6;
      }
      .button {
        display: inline-flex;
        background: var(--brand);
        color: white;
        border-radius: 8px;
        padding: 10px 16px;
        text-decoration: none;
        font-weight: 600;
      }
      .card {
        border: 1px solid #e5e5e5;
        border-radius: 14px;
        padding: 24px;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Design evidence that agents can use</h1>
      <p>Extract tokens, components, and layout rules from rendered pages.</p>
      <a class="button" href="/start">Get started</a>
      <section class="card">
        <h2>Fast local capture</h2>
        <p>Run the extractor against public websites.</p>
      </section>
    </main>
  </body>
</html>
```

- [ ] **Step 2: Write failing integration test**

Create `tests/integration/collectPageEvidence.test.ts`:

```ts
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { describe, expect, it } from 'vitest';
import { collectPageEvidence } from '../../src/extract/collectPageEvidence.js';

describe('collectPageEvidence', () => {
  it('collects visible colors, typography, and components from a rendered page', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const html = await readFile(resolve('tests/fixtures/sample-site.html'), 'utf8');
    await page.setContent(html);

    const evidence = await collectPageEvidence(page, { viewport: 'desktop', maxComponents: 20 });
    await browser.close();

    expect(evidence.colors.some((color) => color.value === '#ff5900')).toBe(true);
    expect(evidence.typography.some((type) => type.fontSize === '48px')).toBe(true);
    expect(evidence.components.some((component) => component.kind === 'button')).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
npm test -- tests/integration/collectPageEvidence.test.ts
```

Expected: FAIL because collector does not exist.

- [ ] **Step 4: Implement browser-side collector**

Create `src/extract/selectorPath.ts`:

```ts
export function selectorPath(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 4) {
    const tag = current.tagName.toLowerCase();
    const className = Array.from(current.classList).slice(0, 2).join('.');
    parts.unshift(className ? `${tag}.${className}` : tag);
    current = current.parentElement;
  }

  return parts.join(' > ');
}
```

Create `src/extract/collectPageEvidence.ts`:

```ts
import type { Page } from 'playwright';

export type RawPageEvidence = {
  colors: Array<{ value: string; property: string; selector: string }>;
  typography: Array<{
    selector: string;
    role: string;
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    letterSpacing: string;
  }>;
  components: Array<{
    kind: string;
    selector: string;
    textSample: string;
    styles: Record<string, string>;
    bounds: { width: number; height: number };
  }>;
};

export async function collectPageEvidence(
  page: Page,
  options: { viewport: string; maxComponents: number },
): Promise<RawPageEvidence> {
  return page.evaluate(({ maxComponents }) => {
    function toHex(value: string): string {
      const match = value.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
      if (!match) return value;
      const [, r, g, b] = match;
      return `#${[r, g, b].map((part) => Number(part).toString(16).padStart(2, '0')).join('')}`;
    }

    function selectorPath(element: Element): string {
      if (element.id) return `#${element.id}`;
      const parts: string[] = [];
      let current: Element | null = element;
      while (current && parts.length < 4) {
        const tag = current.tagName.toLowerCase();
        const className = Array.from(current.classList).slice(0, 2).join('.');
        parts.unshift(className ? `${tag}.${className}` : tag);
        current = current.parentElement;
      }
      return parts.join(' > ');
    }

    function isVisible(element: Element): boolean {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }

    function roleFor(element: Element): string {
      const tag = element.tagName.toLowerCase();
      if (tag.match(/^h[1-6]$/)) return 'heading';
      if (tag === 'p' || tag === 'li') return 'body';
      if (tag === 'button' || element.getAttribute('role') === 'button') return 'button';
      if (tag === 'a') return element.className.toString().includes('button') ? 'button' : 'link';
      return 'text';
    }

    function componentKind(element: Element): string | null {
      const tag = element.tagName.toLowerCase();
      const classText = element.className.toString().toLowerCase();
      if (tag === 'button' || element.getAttribute('role') === 'button' || classText.includes('button')) return 'button';
      if (['input', 'textarea', 'select'].includes(tag)) return 'input';
      if (classText.includes('card')) return 'card';
      if (tag === 'nav') return 'navigation';
      return null;
    }

    const elements = Array.from(document.querySelectorAll('body, body *')).filter(isVisible);
    const colors: RawPageEvidence['colors'] = [];
    const typography: RawPageEvidence['typography'] = [];
    const components: RawPageEvidence['components'] = [];

    for (const element of elements) {
      const style = window.getComputedStyle(element);
      const selector = selectorPath(element);

      for (const property of ['color', 'backgroundColor', 'borderColor']) {
        const value = (style as CSSStyleDeclaration & Record<string, string>)[property];
        if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
          colors.push({ value: toHex(value), property, selector });
        }
      }

      typography.push({
        selector,
        role: roleFor(element),
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
      });

      const kind = componentKind(element);
      if (kind && components.length < maxComponents) {
        const rect = element.getBoundingClientRect();
        components.push({
          kind,
          selector,
          textSample: element.textContent?.trim().slice(0, 80) ?? '',
          styles: {
            color: toHex(style.color),
            backgroundColor: toHex(style.backgroundColor),
            borderRadius: style.borderRadius,
            padding: style.padding,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            boxShadow: style.boxShadow,
            border: style.border,
          },
          bounds: { width: rect.width, height: rect.height },
        });
      }
    }

    return { colors, typography, components };
  }, options);
}
```

- [ ] **Step 5: Run integration test**

Run:

```bash
npm test -- tests/integration/collectPageEvidence.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/fixtures/sample-site.html src/extract/selectorPath.ts src/extract/collectPageEvidence.ts tests/integration/collectPageEvidence.test.ts
git commit -m "feat: collect browser style evidence"
```

## Task 6: Normalize Raw Evidence

**Files:**
- Create: `src/evidence/confidence.ts`
- Create: `src/evidence/normalizeEvidence.ts`
- Test: `tests/unit/normalizeEvidence.test.ts`

- [ ] **Step 1: Write failing normalization test**

Create `tests/unit/normalizeEvidence.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { normalizeEvidence } from '../../src/evidence/normalizeEvidence.js';

describe('normalizeEvidence', () => {
  it('promotes repeated colors and component samples into schema evidence', () => {
    const evidence = normalizeEvidence({
      primaryUrl: 'https://example.com',
      pages: [{ url: 'https://example.com', status: 'success' as const }],
      capturedAt: '2026-05-28T10:00:00.000Z',
      viewports: [{ name: 'desktop', width: 1440, height: 1000 }],
      screenshots: [],
      rawPages: [
        {
          viewport: 'desktop',
          colors: [
            { value: '#ffffff', property: 'backgroundColor', selector: 'body' },
            { value: '#ffffff', property: 'backgroundColor', selector: 'main' },
            { value: '#ff5900', property: 'backgroundColor', selector: 'a.button' },
          ],
          typography: [
            {
              selector: 'h1',
              role: 'heading',
              fontFamily: 'Inter',
              fontSize: '48px',
              fontWeight: '600',
              lineHeight: '52.8px',
              letterSpacing: '-1.92px',
            },
          ],
          components: [
            {
              kind: 'button',
              selector: 'a.button',
              textSample: 'Get started',
              styles: { backgroundColor: '#ff5900', color: '#ffffff', borderRadius: '8px' },
              bounds: { width: 120, height: 40 },
            },
          ],
        },
      ],
    });

    expect(evidence.tokens.colors[0]?.value).toBe('#ffffff');
    expect(evidence.tokens.typography[0]?.role).toBe('heading');
    expect(evidence.components[0]?.name).toBe('Button');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/normalizeEvidence.test.ts
```

Expected: FAIL because normalizer does not exist.

- [ ] **Step 3: Implement confidence and normalizer**

Create `src/evidence/confidence.ts`:

```ts
import type { Confidence } from '../types/evidence.js';

export function confidenceFromFrequency(frequency: number): Confidence {
  if (frequency >= 5) return 'high';
  if (frequency >= 2) return 'medium';
  return 'low';
}
```

Create `src/evidence/normalizeEvidence.ts`:

```ts
import { EvidenceSchema } from './evidenceSchema.js';
import { confidenceFromFrequency } from './confidence.js';
import type { RawPageEvidence } from '../extract/collectPageEvidence.js';
import type { Evidence } from '../types/evidence.js';

type NormalizeInput = {
  primaryUrl: string;
  pages: Array<{ url: string; status: 'success' | 'failed'; error?: string }>;
  capturedAt: string;
  viewports: Array<{ name: string; width: number; height: number }>;
  screenshots: Array<{ viewport: string; url: string; path: string }>;
  rawPages: Array<RawPageEvidence & { viewport: string }>;
};

function tokenNameFromColor(value: string, index: number): string {
  if (value === '#ffffff') return 'Canvas White';
  if (value === '#000000') return 'Rich Black';
  return `Color ${index + 1}`;
}

function componentName(kind: string): string {
  return kind
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

export function normalizeEvidence(input: NormalizeInput): Evidence {
  const colorCounts = new Map<string, { frequency: number; properties: Set<string>; selectors: Set<string> }>();

  for (const page of input.rawPages) {
    for (const color of page.colors) {
      const current = colorCounts.get(color.value) ?? {
        frequency: 0,
        properties: new Set<string>(),
        selectors: new Set<string>(),
      };
      current.frequency += 1;
      current.properties.add(color.property);
      current.selectors.add(color.selector);
      colorCounts.set(color.value, current);
    }
  }

  const colors = Array.from(colorCounts.entries())
    .sort((a, b) => b[1].frequency - a[1].frequency)
    .slice(0, 16)
    .map(([value, data], index) => ({
      name: tokenNameFromColor(value, index),
      value,
      cssVariable: `--color-${tokenNameFromColor(value, index).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      role: data.properties.has('backgroundColor') ? 'Surface or background color' : 'Text, border, or accent color',
      properties: Array.from(data.properties),
      frequency: data.frequency,
      sampleSelectors: Array.from(data.selectors).slice(0, 5),
      confidence: confidenceFromFrequency(data.frequency),
    }));

  const typography = input.rawPages
    .flatMap((page) => page.typography)
    .slice(0, 12)
    .map((type) => ({
      role: type.role,
      fontFamily: type.fontFamily,
      fallback: 'system-ui',
      fontSize: type.fontSize,
      fontWeight: type.fontWeight,
      lineHeight: type.lineHeight,
      letterSpacing: type.letterSpacing,
      sampleSelectors: [type.selector],
      confidence: 'medium' as const,
    }));

  const components = input.rawPages
    .flatMap((page) =>
      page.components.map((component) => ({
        name: componentName(component.kind),
        kind: component.kind,
        role: `${componentName(component.kind)} component`,
        textSample: component.textSample,
        viewport: page.viewport,
        selector: component.selector,
        count: 1,
        styles: component.styles,
        bounds: component.bounds,
        confidence: 'medium' as const,
      })),
    )
    .slice(0, 80);

  const evidence = {
    version: '0.1.0',
    source: {
      primaryUrl: input.primaryUrl,
      pages: input.pages,
      capturedAt: input.capturedAt,
    },
    viewports: input.viewports,
    screenshots: input.screenshots,
    tokens: {
      colors,
      typography,
      spacing: [],
      radii: [],
      shadows: [],
    },
    surfaces: colors.slice(0, 4).map((color, index) => ({
      level: index,
      name: index === 0 ? 'Base Surface' : `Surface ${index}`,
      value: color.value,
      purpose: color.role,
      sampleSelectors: color.sampleSelectors,
      confidence: color.confidence,
    })),
    components,
    layout: {
      density: 'comfortable',
    },
    imagery: {
      strategy: 'unknown',
      notes: [],
    },
    responsive: {
      notes: input.viewports.map((viewport) => `${viewport.name} captured at ${viewport.width}x${viewport.height}.`),
    },
    warnings:
      input.pages.length <= 1
        ? [
            {
              code: 'limited-pages',
              message: 'Only one page was inspected, so site-wide coverage is limited.',
              severity: 'info' as const,
            },
          ]
        : [],
  };

  return EvidenceSchema.parse(evidence);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/unit/normalizeEvidence.test.ts
npm run build
```

Expected: PASS and build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/evidence/confidence.ts src/evidence/normalizeEvidence.ts tests/unit/normalizeEvidence.test.ts
git commit -m "feat: normalize extracted evidence"
```

## Task 7: Write Artifacts and Preview HTML

**Files:**
- Create: `src/generate/generatePreviewHtml.ts`
- Create: `src/io/safePaths.ts`
- Create: `src/io/writeArtifacts.ts`
- Test: `tests/unit/writeArtifacts.test.ts`

- [ ] **Step 1: Write failing artifact test**

Create `tests/unit/writeArtifacts.test.ts`:

```ts
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { writeArtifacts } from '../../src/io/writeArtifacts.js';
import type { Evidence } from '../../src/types/evidence.js';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/writeArtifacts.test.ts
```

Expected: FAIL because IO module does not exist.

- [ ] **Step 3: Implement preview and artifact writer**

Create `src/generate/generatePreviewHtml.ts`:

```ts
import type { Evidence } from '../types/evidence.js';

export function generatePreviewHtml(evidence: Evidence): string {
  const swatches = evidence.tokens.colors
    .map(
      (color) => `<section class="swatch"><div style="background:${color.value}"></div><strong>${color.name}</strong><code>${color.value}</code><p>${color.role}</p></section>`,
    )
    .join('\\n');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Design MD Preview</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; padding: 32px; color: #111; background: #fff; }
      main { max-width: 1120px; margin: 0 auto; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
      .swatch { border: 1px solid #e5e5e5; border-radius: 8px; padding: 12px; }
      .swatch div { height: 80px; border-radius: 6px; border: 1px solid rgba(0,0,0,.1); }
      code { display: block; margin-top: 6px; color: #555; }
    </style>
  </head>
  <body>
    <main>
      <h1>Design MD Preview</h1>
      <h2>Colors</h2>
      <div class="grid">${swatches}</div>
    </main>
  </body>
</html>`;
}
```

Create `src/io/safePaths.ts`:

```ts
import { resolve } from 'node:path';

export function resolveOutputPath(outDir: string): string {
  return resolve(outDir);
}
```

Create `src/io/writeArtifacts.ts`:

```ts
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
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
  await writeFile(join(outDir, 'evidence.json'), `${JSON.stringify(input.evidence, null, 2)}\\n`, 'utf8');
  await writeFile(join(outDir, 'DESIGN.md'), input.designMd, 'utf8');

  if (input.previewHtml) {
    await writeFile(join(outDir, 'preview.html'), input.previewHtml, 'utf8');
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/unit/writeArtifacts.test.ts
npm run build
```

Expected: PASS and build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/generate/generatePreviewHtml.ts src/io/safePaths.ts src/io/writeArtifacts.ts tests/unit/writeArtifacts.test.ts
git commit -m "feat: write generated artifacts"
```

## Task 8: Orchestrate Playwright Extraction

**Files:**
- Create: `src/crawl/browserSession.ts`
- Create: `src/crawl/pageLoader.ts`
- Create: `src/crawl/runExtraction.ts`
- Modify: `src/cli.ts`
- Test: `tests/integration/runExtraction.test.ts`

- [ ] **Step 1: Write failing orchestration test**

Create `tests/integration/runExtraction.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/integration/runExtraction.test.ts
```

Expected: FAIL because orchestration module does not exist.

- [ ] **Step 3: Implement browser session and extraction orchestration**

Create `src/crawl/browserSession.ts`:

```ts
import { chromium, type Browser } from 'playwright';

export async function withBrowser<T>(callback: (browser: Browser) => Promise<T>): Promise<T> {
  const browser = await chromium.launch();
  try {
    return await callback(browser);
  } finally {
    await browser.close();
  }
}
```

Create `src/crawl/pageLoader.ts`:

```ts
import type { Browser, Page } from 'playwright';
import type { ViewportConfig } from '../config/viewports.js';

export async function newLoadedPage(input: {
  browser: Browser;
  url: string;
  viewport: ViewportConfig;
  timeoutMs: number;
}): Promise<Page> {
  const page = await input.browser.newPage({
    viewport: { width: input.viewport.width, height: input.viewport.height },
  });
  await page.goto(input.url, { waitUntil: 'domcontentloaded', timeout: input.timeoutMs });
  return page;
}
```

Create `src/crawl/runExtraction.ts`:

```ts
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { ExtractConfig } from '../config/parseArgs.js';
import { collectPageEvidence } from '../extract/collectPageEvidence.js';
import { normalizeEvidence } from '../evidence/normalizeEvidence.js';
import { generateDesignMd } from '../generate/generateDesignMd.js';
import { generatePreviewHtml } from '../generate/generatePreviewHtml.js';
import { writeArtifacts } from '../io/writeArtifacts.js';
import { withBrowser } from './browserSession.js';
import { newLoadedPage } from './pageLoader.js';

export async function runExtraction(config: ExtractConfig): Promise<void> {
  const urls = [config.url, ...config.pages];
  const screenshots: Array<{ viewport: string; url: string; path: string }> = [];
  const rawPages = [];
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
```

Modify `src/cli.ts`:

```ts
#!/usr/bin/env node
import { parseExtractArgs } from './config/parseArgs.js';
import { runExtraction } from './crawl/runExtraction.js';

async function main(): Promise<void> {
  const config = parseExtractArgs(process.argv.slice(2));
  await runExtraction(config);
  console.log(`Design artifacts written to ${config.outDir}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/integration/runExtraction.test.ts
npm run build
```

Expected: PASS and build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/crawl/browserSession.ts src/crawl/pageLoader.ts src/crawl/runExtraction.ts src/cli.ts tests/integration/runExtraction.test.ts
git commit -m "feat: orchestrate website extraction"
```

## Task 9: Add Codex Skill Wrapper

**Files:**
- Create: `skill/SKILL.md`
- Create: `skill/references/design-md-format.md`
- Create: `skill/references/evidence-rubric.md`
- Create: `skill/scripts/extract-website-style.sh`

- [ ] **Step 1: Create skill instructions**

Create `skill/SKILL.md`:

```md
---
name: design-md-extractor
description: Extract and document the visual style of public websites as reusable DESIGN.md files. Use when the user asks to analyze a website's design system, extract styles, create design tokens, produce DESIGN.md, generate an agent-readable style guide, or build from a website's visual language.
---

# Design MD Extractor

Use the local CLI first, then refine the generated markdown from evidence.

## Workflow

1. Choose an output directory.
2. Run `scripts/extract-website-style.sh <url> <out-dir>` from this skill folder, or run `design-md-extractor extract <url> --out <out-dir>` directly when the CLI is globally available.
3. Read `<out-dir>/evidence.json`.
4. Read `<out-dir>/DESIGN.md`.
5. Improve the markdown using only supported evidence.
6. Preserve confidence and known gaps.
7. Return absolute paths to generated artifacts.

## References

- Read `references/design-md-format.md` before rewriting `DESIGN.md`.
- Read `references/evidence-rubric.md` when confidence or evidence quality is unclear.
```

- [ ] **Step 2: Create skill references**

Run:

```bash
mkdir -p skill/references
cp docs/schema/design-md-output-format.md skill/references/design-md-format.md
```

Create `skill/references/evidence-rubric.md`:

```md
# Evidence Rubric

Use high confidence only when a token or component appears repeatedly or in semantically important positions.

Use medium confidence when the value is clear but limited to one page or one viewport.

Use low confidence when the value is inferred from sparse evidence or a single ambiguous element.

Do not remove known gaps. Add gaps when hover states, authenticated flows, animations, or additional pages were not inspected.
```

- [ ] **Step 3: Create wrapper script**

Create `skill/scripts/extract-website-style.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: extract-website-style.sh <url> <out-dir>" >&2
  exit 2
fi

design-md-extractor extract "$1" --out "$2"
```

Run:

```bash
chmod +x skill/scripts/extract-website-style.sh
```

- [ ] **Step 4: Commit**

```bash
git add skill/SKILL.md skill/references/design-md-format.md skill/references/evidence-rubric.md skill/scripts/extract-website-style.sh
git commit -m "feat: add codex skill wrapper"
```

## Task 10: Final Verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README usage**

Add:

````md
## Usage

```bash
npm install
npm run build
npx design-md-extractor extract https://example.com --out ./out/example
```

Generated artifacts:

- `evidence.json`
- `DESIGN.md`
- `preview.html`
- `screenshots/`
````

- [ ] **Step 2: Run full verification**

Run:

```bash
npm run check
node dist/cli.js extract "$(node -e "console.log(require('node:url').pathToFileURL(require('node:path').resolve('tests/fixtures/sample-site.html')).toString())")" --out ./out/sample
test -f ./out/sample/evidence.json
test -f ./out/sample/DESIGN.md
test -f ./out/sample/preview.html
```

Expected: all commands exit `0`.

- [ ] **Step 3: Inspect generated markdown**

Run:

```bash
sed -n '1,220p' ./out/sample/DESIGN.md
```

Expected: all required sections are present and values from `sample-site.html` appear in token tables.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add usage instructions"
```

## Self-Review

- Spec coverage: the plan covers CLI parsing, browser extraction, schema validation, normalization, markdown generation, preview generation, artifact writing, screenshots, and Codex skill wrapper.
- Placeholder scan: no task depends on undefined future work.
- Type consistency: `Evidence`, `ExtractConfig`, `RawPageEvidence`, and module names are introduced before use.
