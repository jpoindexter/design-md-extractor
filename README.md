# design-md-extractor

Extract public website style evidence and turn it into reusable `DESIGN.md`
files for humans and coding agents.

## Planning Docs

- [Product PRD](docs/prd/product-prd.md)
- [CLI PRD](docs/prd/cli-prd.md)
- [Codex Skill PRD](docs/prd/codex-skill-prd.md)
- [System Architecture](docs/architecture/system-design.md)
- [Evidence Schema](docs/schema/evidence-schema.md)
- [DESIGN.md Output Format](docs/schema/design-md-output-format.md)
- [Agent Workflow](docs/system/agent-workflow.md)
- [Design Spec](docs/superpowers/specs/2026-05-28-design-md-extractor-design.md)
- [Implementation Plan](docs/superpowers/plans/2026-05-28-design-md-extractor.md)

## Usage

Launch the local GUI:

```bash
npm run gui
```

Open `http://127.0.0.1:4317`, paste a URL, and run extraction. The GUI auto-discovers likely internal pages so the style reference is based on broader coverage than a single homepage.

Run the CLI directly:

```bash
npm install
npm run build
npx design-md-extractor extract https://example.com --out ./out/example
```

Generated artifacts:

- `evidence.json`
- `DESIGN.md`
- `preview.html`
- `screenshots/`
