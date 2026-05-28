# Codex Skill PRD

## Summary

The Codex skill wraps the CLI with a reliable agent workflow. It tells Codex how to run extraction, inspect evidence, compare screenshots, refine `DESIGN.md`, and report limitations.

## Skill Name

`design-md-extractor`

## Trigger Description

Use when the user asks Codex to extract, analyze, copy, document, or recreate the visual style of a public website as a reusable `DESIGN.md`, design system, token guide, style reference, agent prompt guide, or frontend implementation guide.

## Skill Responsibilities

- Run the local CLI when available.
- Inspect `evidence.json` before editing `DESIGN.md`.
- Preserve confidence and evidence references.
- Improve raw markdown into a practical design system.
- Avoid copying logos, proprietary illustrations, private assets, or copyrighted text beyond short snippets.
- Create a concise final summary with output paths and known gaps.

## Skill Resources

```text
design-md-extractor/
  SKILL.md
  scripts/
    extract-website-style.sh
  references/
    design-md-format.md
    evidence-rubric.md
```

## Workflow

1. Confirm the URL and output directory.
2. Run:

   ```bash
   design-md-extractor extract <url> --out <output-dir>
   ```

3. Open `evidence.json` and skim:

   - inspected pages
   - screenshots
   - colors
   - typography
   - components
   - confidence warnings

4. Open generated `DESIGN.md`.
5. Improve clarity without inventing unsupported details.
6. Add `Known Gaps` for anything not observed.
7. Return paths to generated artifacts.

## Guardrails

- Do not claim licensed fonts are available. Provide public substitutes.
- Do not instruct the user to copy brand marks.
- Do not transform a style reference into a full clone request.
- Do not omit confidence when evidence is sparse.
- Do not use a single homepage as high-confidence proof of site-wide behavior unless the evidence supports it.

## Acceptance Criteria

- The skill can guide Codex through extraction from a URL to final artifact.
- The skill remains concise enough to load quickly.
- Reference docs hold detailed rubrics so `SKILL.md` stays focused.
- The generated `DESIGN.md` is better than raw extraction because it explains visual intent, not just values.
