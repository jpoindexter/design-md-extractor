# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

## Commands

```bash
npm run build          # tsc compile src/ → dist/
npm run gui            # build + launch GUI at http://127.0.0.1:4317
npm test               # vitest run (all tests)
npm run test:watch     # vitest watch mode
npm run lint           # eslint
npm run format         # prettier --write .
npm run check          # build + lint + test (pre-merge gate)

# Run a single test file
npx vitest run tests/unit/normalizeEvidence.test.ts

# CLI usage (after build)
node dist/cli.js extract https://example.com --out ./out/example
```

## Architecture

Dual entry points compile to two binaries: `dist/cli.js` (CLI) and `dist/gui.js` (local HTTP server). Both converge on the same extraction pipeline.

### Extraction pipeline

```
URL
 └─ discoverStylePages (separate Chromium launch, scrapes <a href> links)
     └─ runExtraction (orchestrates browser session across URLs × viewports)
         ├─ newLoadedPage (Playwright page load + settle)
         ├─ collectPageEvidence (page.evaluate — runs in browser context)
         │   ├─ color extraction (computed styles → hex/rgba normalization)
         │   ├─ typography sampling (all visible elements)
         │   └─ component detection (scoring heuristic: button/card/nav/input/badge)
         └─ normalizeEvidence (dedup + rank raw evidence into structured tokens)
             └─ EvidenceSchema.parse (Zod validation — hard boundary)
                 └─ writeArtifacts → evidence.json, DESIGN.md, preview.html, screenshots/
```

### Source layout

| Path | Responsibility |
|---|---|
| `src/config/` | CLI arg parsing (`parseArgs.ts`), viewport presets (`viewports.ts`) |
| `src/crawl/` | Browser lifecycle (`browserSession.ts`), page loading/settling (`pageLoader.ts`), page discovery (`discoverPages.ts`), extraction orchestrator (`runExtraction.ts`) |
| `src/extract/` | `collectPageEvidence.ts` — entire implementation runs inside `page.evaluate()` |
| `src/evidence/` | Zod schema (`evidenceSchema.ts`), normalization/dedup/scoring (`normalizeEvidence.ts`), confidence thresholds (`confidence.ts`) |
| `src/generate/` | DESIGN.md renderer (`generateDesignMd.ts`), preview HTML (`generatePreviewHtml.ts`), style CSS (`generateStyleCss.ts`) |
| `src/io/` | Artifact writing, path sanitization |
| `src/gui/` | Pure Node.js HTTP server (no framework), GUI extraction runner (`runGuiExtraction.ts`), SSR SPA shell (`appHtml.ts`) |
| `src/types/` | `Evidence` type (inferred from `EvidenceSchema`) |
| `skill/` | Claude Code skill (`SKILL.md`) + references for LLM agents consuming DESIGN.md output |

### Key non-obvious constraints

**`collectPageEvidence` executes in the browser.** Everything in `src/extract/collectPageEvidence.ts` inside the `page.evaluate()` callback runs as browser JS — no Node APIs, no imports. All helper functions must be defined inline in that closure.

**`discoverStylePages` is a separate browser launch.** It opens and closes its own Chromium instance for link discovery before `runExtraction` opens the extraction browser. Two separate browser processes per GUI run.

**`appHtml.ts` is a ~38K token inline SPA.** The GUI frontend is entirely in this one file — HTML, CSS, and vanilla JS all inlined. No frontend build step. The `renderAppHtml()` function returns the complete page as a string.

**GUI runs are stored under `out/gui-runs/<host-timestamp>/`.** The server serves these at `/runs/<runId>/` with path-traversal protection. Artifact URLs in GUI results use `/runs/` prefixes.

**`EvidenceSchema.parse` is the hard contract boundary.** `normalizeEvidence` always validates its output through Zod before returning. Downstream generators consume the typed `Evidence` object — they do not validate.

**Confidence scoring** is frequency-based (`confidence.ts`): frequency ≥ 5 → `high`, ≥ 2 → `medium`, else `low`. Components and typography entries are ranked by separate signal-score heuristics before the confidence label is assigned.

### Test layout

```
tests/unit/           # pure function tests (no Playwright)
tests/integration/    # tests that launch a real Playwright browser
tests/fixtures/       # sample-site.html served by integration tests
```

Integration tests are slower — they spin up Playwright. Run unit tests only during rapid iteration: `npx vitest run tests/unit/`.
