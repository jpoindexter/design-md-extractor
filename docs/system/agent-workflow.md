# Agent Workflow

## Goal

Give Codex a repeatable process for turning a website URL into a trustworthy `DESIGN.md`.

## Workflow

1. Create or choose an output folder.
2. Run the CLI extraction.
3. Inspect `evidence.json`.
4. Inspect screenshots if visual judgment is needed.
5. Improve `DESIGN.md` without inventing unsupported facts.
6. Add `Known Gaps`.
7. Report artifacts to the user.

## Extraction Command

```bash
design-md-extractor extract https://example.com --out ./out/example
```

## Evidence Review Checklist

- Confirm at least one page loaded successfully.
- Confirm desktop, tablet, and mobile screenshots exist.
- Check whether colors have semantic roles.
- Check whether typography has display, heading, body, UI, and code roles.
- Check whether components include buttons, navigation, cards, inputs, and footer when visible.
- Check warnings before finalizing confidence.

## Synthesis Rules

- Keep `evidence.json` as the source of truth.
- In `DESIGN.md`, explain why the style works, not only what values were observed.
- Use confidence labels for sparse evidence.
- Prefer public font substitutes when original fonts are proprietary.
- Do not copy logos or brand marks into generated guidance.
- Do not include long copyrighted text snippets from the source site.

## Quality Rubric

| Quality | Good Output | Bad Output |
|---------|-------------|------------|
| Evidence | Names inspected pages and screenshots | Gives a confident style guide with no source scope |
| Tokens | Includes value, role, token, confidence | Lists hex codes without roles |
| Components | Describes actual controls and states | Says "modern buttons" |
| Layout | Explains container, grid, rhythm, density | Says "clean layout" |
| Imagery | Describes media role and framing | Ignores imagery |
| Gaps | Honest about unobserved states | Pretends complete coverage |

## Final Response Shape

```text
Generated:
- /absolute/path/out/DESIGN.md
- /absolute/path/out/evidence.json
- /absolute/path/out/preview.html
- /absolute/path/out/screenshots/

Notes:
- Confidence is high for colors and typography.
- Component state coverage is medium because hover/focus states were not interacted with.
```
