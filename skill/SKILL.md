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
