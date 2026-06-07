# Design MD Extractor

Capture a website's **usable visual system** — colors, gradients, typography, spacing, radii, shadows, surfaces, components, layout, imagery, motion, and interaction states — and turn it into a structured `DESIGN.md`, ready-to-use design tokens, and AI-ready prompts.

Point it at a URL. It loads the site in a real browser across desktop, tablet, and mobile, scrolls to trigger lazy content, reads computed styles, triggers real hover/focus to capture interaction states, ranks the evidence into confident tokens, and writes everything to disk. Use it from the **CLI**, a **local GUI**, or an **MCP server** so any AI agent can call it directly.

> Fully local. It never calls an AI or needs an API key — the "AI Assistant" picker only chooses which prompt template you copy into your own agent.

![Design MD Extractor — extracting a site's design system into tokens, exports, and a DESIGN.md](docs/images/demo.gif)

## What you get

Every run writes the full set to the `--out` directory:

| File                 | What it is                                                                    |
| -------------------- | ----------------------------------------------------------------------------- |
| `DESIGN.md`          | Human + LLM readable style reference (thesis, tokens, components, guidelines) |
| `evidence.json`      | Full structured, schema-validated evidence (source of truth)                  |
| `tokens.css`         | CSS custom properties (`:root { --color-… }`)                                 |
| `tailwind-theme.js`  | Tailwind theme config (`module.exports = { theme: { extend: … } }`)           |
| `design-tokens.json` | W3C Design Tokens format (`$value` / `$type` / `$description`)                |
| `ai-prompt.txt`      | Condensed rebuild prompt for an AI agent                                      |
| `preview.html`       | Standalone visual preview of the extracted system                             |
| `screenshots/`       | Desktop / tablet / mobile captures                                            |

In the **GUI** you can copy or download any single export, or grab the whole run — including screenshots — as one `bundle.zip`.

## What it captures

| Dimension                     | Detail                                                                                                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Colors**                    | Computed colors normalized to hex/rgba, ranked into a palette, named by hue (Red, Blue, Off White…)                                                  |
| **Gradients**                 | `linear`/`radial`/`conic` backgrounds with normalized color stops                                                                                    |
| **Typography**                | Font family (framework hashes recovered), size, weight, line-height, letter-spacing, role                                                            |
| **Spacing / Radii / Shadows** | Deduped, integer-rounded token scales                                                                                                                |
| **Surfaces**                  | Base canvas + surface levels, ranked by what's actually painted in the viewport (handles dark-body/light-hero pages)                                 |
| **Components**                | Deduped across viewports into types with semantic names (Primary Pill Button, Surface Card, Icon Button…) and reuse counts                           |
| **Layout**                    | Container widths, section rhythm, derived density                                                                                                    |
| **Imagery**                   | Strategy derived from image/icon/video/background signals (photography-led, icon-driven…)                                                            |
| **Motion**                    | Transition/animation durations and easing curves                                                                                                     |
| **Interaction states**        | `:hover` / `:focus` / `:active` / `:disabled` — parsed from stylesheets **and** observed live by triggering a real pointer (catches JS-driven hover) |

## How it works

```
URL
 └─ discover internal pages (separate browser pass)
     └─ load each page × viewport (Playwright): settle + adaptive scroll for lazy content
         └─ collect evidence in-page (computed colors, gradients, type, components, motion, imagery)
             └─ trigger real hover/focus to observe live interaction states
                 └─ normalize + dedupe + rank into confident tokens (Zod-validated)
                     └─ write DESIGN.md, all token exports, preview, screenshots
```

Confidence is frequency-based: a token seen often is `high`, rarely is `low`.

## Requirements

- Node.js ≥ 18.18
- Playwright's Chromium: `npx playwright install chromium`

## Install

```bash
git clone https://github.com/jpoindexter/design-md-extractor.git
cd design-md-extractor
npm install
npx playwright install chromium
npm run build
```

## Usage

### GUI

```bash
npm run dev
# open http://127.0.0.1:4317
```

Paste a URL, hit **Extract Style**, and browse the result: color palette, type scale, spacing, components, and copy/download for each export format (or the whole bundle as a `.zip`).

### CLI

```bash
node dist/cli.js extract https://example.com --out ./out/example
```

Outputs land in the `--out` directory.

**Options:**

| Flag                   | Default                 | Description                                                                                                                           |
| ---------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `--out <dir>`          | _(required)_            | Output directory for all artifacts                                                                                                    |
| `--pages <urls...>`    | `[]`                    | Extra URLs to inspect alongside the primary one                                                                                       |
| `--viewports <list>`   | `desktop,tablet,mobile` | Comma-separated viewport names to capture                                                                                             |
| `--max-components <n>` | `80`                    | Maximum component samples to keep                                                                                                     |
| `--no-preview`         |                         | Skip writing `preview.html`                                                                                                           |
| `--timeout <ms>`       | `30000`                 | Per-page load timeout                                                                                                                 |
| `--cookies <path>`     |                         | Cookie file (Playwright JSON or Netscape `cookies.txt`) to inject — see [Bypassing Cloudflare](#bypassing-cloudflare-and-login-walls) |
| `--user-agent <ua>`    |                         | User-Agent to match the browser that produced the cookies                                                                             |
| `--profile <dir>`      |                         | Persistent Chrome profile dir (opens a real window to clear a challenge once, then reuses the session)                                |
| `--headless`           |                         | Run the `--profile` session without a window (only after the session is established)                                                  |

### MCP Server

The MCP server exposes the full extraction pipeline as tools so any MCP-compatible AI agent can call it — no GUI, no shell commands.

```bash
npm run mcp
```

Or run the compiled binary directly (useful in MCP config files):

```bash
node /absolute/path/to/design-md-extractor/dist/mcp.js
```

#### Tools

| Tool             | Description                                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `extract_design` | Extract the design system from a URL. Returns the full `DESIGN.md` inline plus a structured summary. Artifacts are written to disk. |
| `list_runs`      | List previously completed extractions, sorted newest first.                                                                         |
| `get_run`        | Retrieve the `DESIGN.md` and summary for a past run by `runId`.                                                                     |

**`extract_design` input:**

| Parameter   | Type           | Default  | Description                                                                                         |
| ----------- | -------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `url`       | `string` (URL) | required | Website to extract                                                                                  |
| `maxPages`  | `integer` 1–12 | `5`      | Max pages to crawl                                                                                  |
| `cookies`   | `string`       | —        | Path to a cookie file (Playwright JSON or Netscape `cookies.txt`) for Cloudflare/login-walled sites |
| `userAgent` | `string`       | —        | User-Agent matching the browser that produced the cookies (so `cf_clearance` validates)             |

**`extract_design` response includes:**

- `runId` — unique identifier for this run
- `url` — canonical URL extracted
- `outDir` — absolute path to all artifacts on disk
- `discoveredPages` — pages that were crawled
- `summary` — structured data: style thesis, colors, gradients, typography, spacing, radii, shadows, surfaces, components, layout, imagery, motion, interaction states, warnings
- `designMd` — full `DESIGN.md` content, ready to pass to an LLM

All artifacts (`DESIGN.md`, `evidence.json`, `tokens.css`, `tailwind-theme.js`, `design-tokens.json`, `ai-prompt.txt`, `preview.html`, `screenshots/`) are written under `outDir`.

#### Wire it into Claude Code

Add to `.claude/settings.json` (project) or `~/.claude/settings.json` (global):

```json
{
  "mcpServers": {
    "design-md-extractor": {
      "command": "node",
      "args": ["/absolute/path/to/design-md-extractor/dist/mcp.js"]
    }
  }
}
```

#### Wire it into Cursor / other MCP clients

```json
{
  "mcpServers": {
    "design-md-extractor": {
      "command": "node",
      "args": ["/absolute/path/to/design-md-extractor/dist/mcp.js"]
    }
  }
}
```

#### Custom artifacts directory

By default, runs are stored at `<package-root>/out/gui-runs/`. Override with the `DESIGN_MD_RUNS_DIR` environment variable:

```bash
DESIGN_MD_RUNS_DIR=/tmp/my-runs node dist/mcp.js
```

Or in your MCP config:

```json
{
  "mcpServers": {
    "design-md-extractor": {
      "command": "node",
      "args": ["/absolute/path/to/design-md-extractor/dist/mcp.js"],
      "env": {
        "DESIGN_MD_RUNS_DIR": "/path/to/shared/runs"
      }
    }
  }
}
```

## Bypassing Cloudflare and login walls

Sites behind Cloudflare or a login wall serve a challenge page to a fresh browser. Two ways to reuse your real session:

### Cookie file (non-interactive)

Export your cookies from a browser where the site already loads (DevTools → Application → Cookies, or a "Get cookies.txt" / EditThisCookie extension) and copy your browser's User-Agent (`navigator.userAgent` in the console):

```bash
node dist/cli.js extract https://site.com \
  --cookies ./cookies.json \
  --user-agent "Mozilla/5.0 ..." \
  --out ./out/site
```

Cloudflare binds `cf_clearance` to the IP **and** User-Agent that solved the challenge. The extractor runs on your machine (same IP), so a matching `--user-agent` is required for the cookies to validate. Cookie files (Playwright JSON or Netscape `cookies.txt`) are accepted.

### Persistent Chrome profile (most reliable)

Opens a real, visible Chrome window with an on-disk profile. Clear the challenge / log in once; the session persists and is reused on later runs:

```bash
node dist/cli.js extract https://site.com --profile ./.chrome-profile --out ./out/site
```

The first run is interactive (a window opens — solve the challenge); re-running the same command reuses the profile until the session expires. Requires Google Chrome installed; this mode runs **headed** (a visible window) because headless browsers are detectable.

Add `--headless` to run the persistent profile without a window — only useful **after** the session is already established (the first challenge-solving run must be headed so you can interact). Note: solving a live CAPTCHA is inherently a one-time human step; the tool waits for the challenge to clear, it cannot solve it for you.

## Use with an AI coding agent (Claude Code skill)

This repo ships a Claude Code skill in [`skill/`](skill/SKILL.md) so an agent can consume a `DESIGN.md` and rebuild or extend a site's styles faithfully. Point your agent at `skill/SKILL.md` and the generated `DESIGN.md`.

The MCP server and the skill work well together: use `extract_design` to generate the `DESIGN.md`, then use the skill to guide implementation.

## Development

```bash
npm run build        # tsc → dist/
npm run dev          # build + launch GUI at http://127.0.0.1:4317
npm run mcp          # build + start MCP server (stdio)
npm test             # vitest (unit + integration)
npm run lint         # eslint
npm run format       # prettier
npm run check        # build + lint + test (pre-merge gate)

# unit tests only (fast; no browser)
npx vitest run tests/unit/
```

Integration tests launch a real Playwright browser and are slower than the unit suite.

## Project layout

```
src/cli.ts         CLI entry point
src/gui.ts         GUI server entry point
src/mcp.ts         MCP server entry point
src/config/        CLI arg parsing, viewport presets
src/crawl/         browser lifecycle, page loading, discovery, orchestration
src/extract/       collectPageEvidence (runs in the browser) + live interaction capture
src/evidence/      Zod schema, normalization/dedupe/ranking, confidence
src/generate/      DESIGN.md, preview, and token/export generators (CSS, Tailwind, JSON, AI prompt)
src/io/            artifact writing, path safety
src/gui/           local HTTP server + inline SPA shell
skill/             Claude Code skill + references
docs/              architecture, schema, and system notes
```

See [`docs/architecture`](docs/architecture) and [`docs/schema`](docs/schema) for deeper reference.

## License

[MIT](LICENSE) © Jason Poindexter
