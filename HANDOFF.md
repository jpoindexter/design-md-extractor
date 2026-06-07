# Handoff — implement the design-md-extractor quality fix
Generated: 2026-06-07
Project: design-md-extractor — `/Users/jasonpoindexter/Documents/GitHub/design-md-extractor`
Branch: `main` (start a feature branch — nothing implemented yet)

> **This was a planning session. No source code has changed.** Your job: implement the **approved** plan.

## Read these first (source of truth)
1. `/Users/jasonpoindexter/.claude/plans/purrfect-pondering-garden.md` — the **approved plan** (8 workstreams A–H, 4 phases, time estimate, tests, verification, constraints, and a "Not in this round" section).
2. `/Users/jasonpoindexter/Documents/GitHub/design-md-extractor/FIX-PLAN.html` — same plan, visual.
3. `/Users/jasonpoindexter/Documents/GitHub/design-md-extractor/EXTRACTOR-GAPS.html` — the gap audit with file:line for every issue.

## What the tool is
Playwright-based extractor (CLI + GUI + MCP) that turns a URL into `DESIGN.md` + tokens + screenshots for AI rebuilds. `dist/` is prebuilt; Chromium installed. `npm run build` / `npm test` (vitest) / `npm run dev` (GUI on :4317) / `npm run mcp`.

## The problem (why this work)
Run on `monarque.framer.website` it produced a **dark** canvas (`#000000`) for a site whose homepage is **white** — because the base surface is ranked by raw occurrence count, so dark footers/sections win. Reference output of the bug: `out/monarque-rerun/` (DESIGN.md says dark canvas). A second audit found 8 more output-quality gaps. The plan fixes all of it.

## The plan in one screen (implement in this order)
**Phase 1 — Core quality** (workstreams A, B, C, E, H):
- **A** Value-normalization layer — new `src/evidence/normalizeValues.ts`; round/cluster px, normalize shadow syntax, prefer the desktop value; wire into `styleTokensFromComponents()` in `src/evidence/normalizeHelpers.ts`. Kills junk spacing/radii like `67.1635px`, `4.88002px 19.5201px`.
- **B** Canvas detection + **area de-nest** — `src/extract/collectPageEvidence.ts` capture `rootBackground` (computed `body`/`html` bg) + per-color `area`/`aboveFold`, **de-nested** (don't double-count a bg reported by both a section and its children — use largest single element, or skip when an ancestor already reported it). `src/evidence/normalizeEvidence.ts` + `normalizeHelpers.ts` rank base surface by `pageBackgroundCount → aboveFoldArea → backgroundCount → frequency` and re-rank the palette by prominence. `src/generate/generateDesignMd.ts` thesis cue → `surfaces[0].value`; `src/gui/runGuiExtraction.ts` dominant-color → `surfaces[0]`.
- **C** Honest confidence — in `normalizeEvidence.ts`, if top-2 canvases close (`top2/top1 ≥ 0.75`) push `AMBIGUOUS_CANVAS` warning + cap base confidence `high→medium`. Guard on `pageBackgroundCount > 0`.
- **E** Token-name collisions — unique typography variable names so `--font-size-text` stops overwriting itself (`src/generate/generateStyleCss.ts` + DESIGN.md token starter).
- **H** Polish — colour naming heuristics in `tokenNameFromColor` (`normalizeHelpers.ts`); stricter `normalizeColor` validation.

**Phase 2 — Exports** (D): port the 4 client generators (`src/gui/client/exports-tokens.ts`: CSS vars, Tailwind, JSON, AI prompt) into `src/generate/` as the single source; `src/io/writeArtifacts.ts` + `src/crawl/runExtraction.ts` write the full set to disk every run; GUI "Download all" → new `GET /runs/{id}/bundle.zip` in `src/gui/server.ts` that zips the whole run dir (incl. screenshots); port the store-only zip to a Node `src/io/zip.ts` — **no new dependency**.

**Phase 3 — Depth** (F): normalize type units before the dedup key; track `viewports[]` on components instead of a scalar (`normalizeEvidence.ts`).

**Phase 4 — Feature** (G): implement container-width + section-rhythm detection to replace the hardcoded `layout.density` / empty `containerWidths`/`sectionGaps` (`normalizeHelpers.ts` + `normalizeEvidence.ts`).

## Current state
- Build: PASSING (dist prebuilt). Tests: presumed passing (src untouched). Run `npm test` to confirm baseline before starting.
- Uncommitted: only `FIX-PLAN.html`, `EXTRACTOR-GAPS.html` (untracked planning docs) + this `HANDOFF.md`. No src changes.
- `out/monarque-rerun/` is the pre-fix reference output (dark canvas) to diff against.

## Blocked / needs decision
- **Scope:** Jason will say **"go"** (all 4 phases) or **"go Phase 1"** (stop after core quality, review). Confirm which before starting Phase 2+. Phase 1 ≈ 1.5h realistic and delivers ~80%.

## Key decisions already made (respect these)
1. **Backward-compat via optional fields:** every new `RawPageEvidence` field defaults to 0/absent so the comparator falls through to the legacy `backgroundCount → frequency` order — existing unit tests (e.g. `tests/unit/normalizeEvidence.test.ts` expecting `surfaces[0].value === '#ffffff'`) must stay green.
2. **Canvas comes from `surfaces[0]`,** not the occurrence-sorted color list — that's why the thesis cue is repointed.
3. **Area must be de-nested** — a naive sum double-counts nested backgrounds (section + children). This is mandatory for the ranking to be correct.
4. **Exports = Option B** (write all to disk + server-side zip of the run dir), which also resolves the client/server generator duplication. **No new runtime deps** — port the existing store-zip to Node.
5. `Evidence` public shape stays compatible; collection stays serializable (it runs inside `page.evaluate`).

## Exact next steps
1. [ ] `cd /Users/jasonpoindexter/Documents/GitHub/design-md-extractor && npm install && npm run build && npm test` — confirm green baseline.
2. [ ] `git checkout -b fix/extraction-quality`.
3. [ ] Implement **Phase 1** (A→B→C→E→H), test-first where value-shaped. `npm test` green.
4. [ ] **Checkpoint:** `node dist/cli.js extract https://monarque.framer.website/ --out out/verify --viewports desktop` → confirm `surfaces[0]` is now `#ffffff` (was `#000000`), clean integer spacing/radii, no duplicate `--*` names, ambiguity warning if due. Diff vs `out/monarque-rerun`.
5. [ ] If "go": Phase 2 (D), then 3 (F), then 4 (G), checkpointing each per the plan.

## Context that's easy to lose
- Collection (`collectPageEvidence.ts`) runs in the **browser** via `page.evaluate` — keep it serializable, no Node APIs.
- The GUI client is **inline template-literal JS** strings (no import seam) — refactoring it + adding a `zip` test is the fiddly part of Phase 2; consider extracting `zipBlob`/`crc32` to `src/io/zip.ts` so it's testable.
- Re-ranking **intentionally** changes some existing token names/values/order — update those test expectations rather than fighting them; the canvas correctness is the guard (`surfaces[0]`).
- Verification is behavioural, not just green tests: **re-extract monarque and a known-dark site** and eyeball the canvas + token cleanliness.
- The MCP server `design-md-extractor` is already registered in `~/.claude.json` (user scope) and runs `dist/mcp.js` — rebuild after changes so the MCP picks them up.

## Continuation prompt (paste into a fresh Claude CLI in the repo)
---
You're in `/Users/jasonpoindexter/Documents/GitHub/design-md-extractor` (a Playwright-based website→DESIGN.md design-token extractor; TS/ESM/strict, vitest). Implement the **approved** quality-fix plan.

Read first: `~/.claude/plans/purrfect-pondering-garden.md` (the plan), `./FIX-PLAN.html`, `./EXTRACTOR-GAPS.html` (gap audit with file:line), and `./HANDOFF.md` (this handoff).

The core bug: the extractor mislabels the **canvas/base-surface** (picks dark `#000000` for white-hero sites because it ranks backgrounds by raw occurrence count). `out/monarque-rerun/` is the pre-fix reference. The plan also fixes 7 more output-quality gaps.

Do it on a branch `fix/extraction-quality`, test-first, in 4 phases (Phase 1 = canvas + value-normalization + confidence + token-name fix + polish; Phase 2 = single-source exports + complete bundle with screenshots; Phase 3 = type/component viewport normalization; Phase 4 = layout extraction). Build + `npm test` + re-extract monarque after each phase. **Confirm with me whether to do all phases or Phase 1 only before starting Phase 2.**

Hard constraints: new evidence fields are optional/default-0 so existing tests fall through to legacy order (keep `normalizeEvidence.test.ts` green); canvas must come from `surfaces[0]`; **de-nest** the per-element area so nested backgrounds aren't double-counted; **no new runtime dependencies** (port the existing store-zip to a Node util); collection stays serializable (runs in `page.evaluate`). Verify behaviourally by re-extracting `https://monarque.framer.website/` and confirming the canvas is now `#ffffff` and spacing/radii are clean integers. Start by running `npm run build && npm test` to confirm a green baseline, then begin Phase 1.
---
