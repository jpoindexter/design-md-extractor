# System Architecture

## Overview

Design MD Extractor has three layers:

```text
CLI
  parses user intent and coordinates the run

Extraction engine
  opens pages, samples computed styles, captures screenshots, and writes evidence

Generation engine
  turns normalized evidence into DESIGN.md and preview.html
```

The architecture keeps browser evidence separate from narrative synthesis. This prevents the markdown generator from becoming the source of truth.

## Runtime

- Language: TypeScript.
- Runtime: Node.js 20+.
- Browser automation: Playwright Chromium.
- CLI parser: Commander.
- Validation: Zod.
- Tests: Vitest.
- Formatting: Prettier.
- Linting: ESLint with TypeScript support.

## Proposed File Map

```text
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
    collectResponsive.ts
    selectorPath.ts
  evidence/
    evidenceSchema.ts
    normalizeEvidence.ts
    confidence.ts
  generate/
    generateDesignMd.ts
    generatePreviewHtml.ts
  io/
    writeArtifacts.ts
    safePaths.ts
  types/
    evidence.ts
tests/
  fixtures/
    sample-site.html
  unit/
  integration/
```

## Data Flow

```text
User URL
  -> parse CLI config
  -> launch browser
  -> inspect each page at each viewport
  -> collect raw DOM/computed-style samples
  -> normalize evidence
  -> score confidence
  -> write evidence.json
  -> render DESIGN.md
  -> render preview.html
  -> write screenshots
```

## Module Boundaries

### `config`

Owns CLI argument normalization. It returns a validated `ExtractConfig`.

### `crawl`

Owns Playwright orchestration. It does not decide token semantics. It only loads pages, controls viewports, and delegates extraction.

### `extract`

Runs browser-side collectors through `page.evaluate`. It returns raw facts: computed styles, element metadata, dimensions, and selectors.

### `evidence`

Converts raw facts into stable evidence:

- groups repeated colors
- maps likely roles
- builds typography scales
- infers surfaces
- assigns confidence

### `generate`

Produces human-readable artifacts from normalized evidence. It does not use Playwright.

### `io`

Creates output directories, writes JSON, markdown, HTML, and screenshots safely.

## Confidence Model

| Confidence | Criteria |
|------------|----------|
| high | Observed repeatedly across pages or component samples. |
| medium | Observed clearly but in limited contexts. |
| low | Inferred from sparse evidence, screenshots, or single occurrence. |

Every major token and component should carry confidence in `evidence.json`. The markdown should summarize confidence where useful.

## Extraction Heuristics

### Color Role Mapping

- Most common page background becomes a candidate canvas.
- Most common text color becomes primary text.
- High-frequency border colors become border tokens.
- Button backgrounds and link colors become accent candidates.
- Rare saturated colors are likely brand or semantic accents.

### Typography Role Mapping

- `h1` and largest text samples become display candidates.
- `h2` and section headings become heading candidates.
- Paragraph and list text become body candidates.
- Button, nav, and label elements become UI text candidates.
- `code`, `pre`, and monospace families become code candidates.

### Component Detection

Use semantic selectors first, then style and geometry:

- `button`, `[role=button]`, links styled as buttons.
- `input`, `textarea`, `select`.
- `nav`, `header`, `footer`.
- repeated rounded bordered blocks as cards.
- small pill-shaped text elements as badges/tags.
- grouped buttons as tabs or segmented controls.

## Security and Ethics

- Only inspect public pages unless the user explicitly provides an authenticated browser context in a later version.
- Do not save cookies or credentials.
- Do not download or repackage proprietary assets.
- Treat screenshots as evidence for the user's local analysis.

## Build Order

1. Scaffold TypeScript CLI and test harness.
2. Define evidence schema.
3. Implement local fixture extraction.
4. Add Playwright browser collection.
5. Add markdown generation.
6. Add preview generation.
7. Add Codex skill wrapper.
8. Run end-to-end extraction against a public site.
