# Design MD Extractor Design Spec

## Objective

Build a local TypeScript CLI and Codex skill workflow that can inspect a public website and produce reusable design system artifacts: `evidence.json`, `DESIGN.md`, `preview.html`, and screenshots.

## Architecture

The system separates browser evidence from synthesis:

- The extraction engine uses Playwright to capture computed browser facts.
- The evidence layer normalizes facts into stable tokens, components, surfaces, and confidence scores.
- The generation layer writes deterministic markdown and HTML.
- The Codex skill uses the CLI output to refine the final `DESIGN.md`.

## Product Requirements

The MVP must:

- Accept a URL from the command line.
- Capture desktop, tablet, and mobile evidence.
- Extract color, typography, component, layout, surface, imagery, and responsive evidence.
- Write valid `evidence.json`.
- Write `DESIGN.md` in the documented output format.
- Write optional `preview.html`.
- Save screenshots.
- Fail clearly when the URL cannot be loaded.

## Output Format

The `DESIGN.md` format combines:

- Narrative style thesis and guardrails from `awesome-design-md`.
- Refero-style token tables, typography roles, surfaces, components, imagery, layout, and prompt examples.
- Confidence and source evidence unique to this project.

## Key Design Decisions

### CLI First

The CLI is the source of truth because extraction should be repeatable. A skill-only approach would depend too much on subjective visual reading.

### Agent Refinement Second

The generated markdown should be useful without AI, but a Codex skill can improve prose, resolve naming, and add taste judgment from evidence.

### Confidence Everywhere

Confidence prevents false precision. A single homepage capture should not be treated as a complete design system.

### Local Artifacts

Artifacts are written to disk so users can inspect, edit, commit, and reuse them.

## Data Model

Use `evidence.json` as the stable interface between extraction and generation. The schema is documented in `docs/schema/evidence-schema.md`.

## Testing Strategy

- Unit tests for CLI parsing.
- Unit tests for evidence schema validation.
- Unit tests for token normalization.
- Unit tests for markdown generation.
- Integration test against a local HTML fixture.
- End-to-end smoke test against one public website after core implementation.

## Risks

| Risk | Mitigation |
|------|------------|
| Arbitrary websites have inconsistent DOMs | Use semantic selectors first, then heuristic sampling. |
| Computed styles produce too much noise | Normalize by frequency and visible element role. |
| Licensed fonts cannot be reused | Document substitutes and mark original fonts as observed only. |
| One page is not enough evidence | Support additional pages and confidence labels. |
| Generated markdown overstates certainty | Require known gaps and confidence fields. |

## Acceptance Criteria

- `npm test` passes.
- `npm run build` passes.
- Running the CLI on a local fixture creates all expected files.
- `evidence.json` validates.
- `DESIGN.md` has every required section.
- The Codex skill PRD is detailed enough to scaffold a skill after the CLI exists.
