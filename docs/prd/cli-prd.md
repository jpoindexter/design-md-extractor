# CLI PRD

## Product Surface

The CLI is the deterministic core of Design MD Extractor. It loads public websites in Playwright, extracts visible style evidence, normalizes that evidence into a stable JSON schema, and writes `DESIGN.md` plus optional preview artifacts.

## Primary Command

```bash
design-md-extractor extract <url> --out <directory>
```

## MVP Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `--out <dir>` | required | Output directory for generated artifacts. |
| `--pages <url...>` | homepage only | Additional pages to inspect. |
| `--viewports <list>` | `desktop,tablet,mobile` | Viewport set to capture. |
| `--max-components <n>` | `80` | Maximum DOM elements sampled as components. |
| `--no-preview` | preview enabled | Skip `preview.html`. |
| `--timeout <ms>` | `30000` | Page load timeout. |
| `--format <type>` | `design-md` | Output format. MVP supports `design-md`. |

## Required Artifacts

```text
<out>/
  evidence.json
  DESIGN.md
  preview.html
  screenshots/
    desktop-home.png
    tablet-home.png
    mobile-home.png
```

## Extraction Requirements

### Browser Loading

- Launch Chromium with Playwright.
- Navigate to each URL with a configurable timeout.
- Wait for network idle when possible.
- Continue after non-critical console errors.
- Fail with a clear message on DNS, TLS, timeout, or blocked navigation errors.

### Viewports

Capture these viewports by default:

| Name | Width | Height |
|------|-------|--------|
| desktop | 1440 | 1000 |
| tablet | 768 | 1000 |
| mobile | 390 | 844 |

### Colors

Collect colors from:

- Computed `color`, `background-color`, `border-color`, `box-shadow`, and SVG fill/stroke where accessible.
- CSS custom properties on `:root` and body.
- Visible elements only.

Normalize colors to hex where possible and record frequency, source property, and sample selectors.

### Typography

Collect:

- Font families.
- Font sizes.
- Font weights.
- Line heights.
- Letter spacing.
- Element roles: heading, body, nav, button, label, code.

### Components

Sample visible elements likely to represent:

- Buttons.
- Inputs.
- Navigation links.
- Cards.
- Badges.
- Tabs.
- Product screenshot frames.
- CTA sections.
- Footer blocks.

Each component sample must include computed styles, text snippet, DOM role hints, selector path, bounding box, and viewport.

### Layout

Collect:

- Common container widths.
- Section vertical spacing.
- Grid and flex patterns.
- Border radius scale.
- Shadow/elevation scale.
- Surface color hierarchy.

### Screenshots

Save full-page or viewport screenshots for each page and viewport. MVP uses viewport screenshots for predictable size.

## Output Requirements

The CLI must write valid JSON for evidence and deterministic markdown for `DESIGN.md`. Markdown generation should work without an external AI API. The Codex skill can refine the document using the evidence.

## Error Handling

- Invalid URL: show a usage error and exit code `2`.
- Navigation failure: show the URL and browser error, exit code `1`.
- Output path cannot be written: show filesystem path and error, exit code `1`.
- Partial page failure: record the failure in `evidence.json` and continue if at least one page succeeds.

## Acceptance Criteria

- Running the command against a simple local fixture produces all artifacts.
- `evidence.json` validates against the schema.
- `DESIGN.md` includes all required sections.
- `preview.html` opens without a build step.
- CLI tests cover argument parsing, invalid URL handling, output creation, and schema validation.
