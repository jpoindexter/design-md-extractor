# Product PRD: Design MD Extractor

## Summary

Design MD Extractor is a local-first system that inspects any public website, captures objective style evidence, and produces a reusable `DESIGN.md` file that another human or coding agent can use to style a new website with similar visual rules.

The system combines two strengths:

- A deterministic CLI captures raw facts from the browser: computed styles, CSS variables, colors, typography, component samples, responsive behavior, and screenshots.
- An agent-facing workflow converts the evidence into a polished, practical `DESIGN.md` inspired by `awesome-design-md` and enriched by Refero-style style references.

## Problem

Existing style extraction workflows usually fail in one of two ways:

- They dump raw CSS values without explaining visual intent, component roles, or implementation guardrails.
- They produce attractive narrative summaries without enough evidence to trust the details.

Users need a format that is both useful and grounded: readable enough for coding agents, structured enough for designers and developers, and honest about confidence.

## Target Users

- Builders using AI coding agents to create new websites.
- Designers who want a portable style reference from an existing public site.
- Developers who need a quick design system starting point before building UI.
- Internal product teams auditing competitor or inspiration sites.

## Goals

- Extract visible style evidence from a website through real browser rendering.
- Produce `evidence.json` with raw facts and confidence metadata.
- Produce `DESIGN.md` with a reusable design system: theme, tokens, typography, components, layout, imagery, responsive behavior, and do/don'ts.
- Produce an optional `preview.html` showing the extracted tokens and sample components.
- Keep outputs usable without requiring Figma, browser extensions, or hosted services.
- Make the process repeatable from a single CLI command.

## Non-Goals

- Do not copy private assets, licensed typefaces, or brand marks into the user's project.
- Do not scrape behind authentication in the MVP.
- Do not promise pixel-perfect cloning.
- Do not extract every CSS rule from every stylesheet.
- Do not generate a complete component library in the MVP.
- Do not rely on screenshots alone when computed browser data is available.

## MVP Workflow

```text
User runs:
design-md-extractor extract https://example.com --out ./example-design

System produces:
example-design/
  evidence.json
  DESIGN.md
  preview.html
  screenshots/
    desktop-home.png
    tablet-home.png
    mobile-home.png
```

## Required Output Qualities

- The `DESIGN.md` must be directly usable by Codex, Claude Code, Cursor, or another coding agent.
- Every token should include a semantic role, not just a value.
- Major claims should include confidence: high, medium, or low.
- Known gaps must be explicit.
- Component guidance must be concrete enough to build from.

## Success Metrics

- A user can run one command against a public marketing site and receive the full output folder.
- The output `DESIGN.md` includes at least colors, typography, components, layout, imagery, responsive behavior, do/don'ts, and prompt guidance.
- The extractor records screenshots for desktop, tablet, and mobile.
- The CLI exits non-zero with a useful error when the site cannot be loaded.
- Tests cover schema validation, CLI config parsing, evidence normalization, and markdown generation.

## Constraints

- Initial implementation should be Node.js and TypeScript.
- Browser automation should use Playwright.
- Evidence extraction should be local-first and deterministic where possible.
- AI synthesis should be optional. The MVP can generate strong markdown from heuristics and leave an agent workflow for refinement.
- The design should avoid speculative abstractions until repeated patterns justify them.

## Format Direction

The final `DESIGN.md` should combine:

- `awesome-design-md`: narrative design guidance and agent-ready guardrails.
- Refero style references: token tables, surface levels, component roles, imagery strategy, and prompt examples.
- Our addition: source evidence, usage frequency, and confidence for extracted claims.
