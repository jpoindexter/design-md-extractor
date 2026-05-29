export function sectionsCss(): string {
  return `
    .thesis { margin: 0; max-width: 620px; font-size: 16px; line-height: 1.65; color: var(--muted); }
    .profile-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .profile-card { border: 1px solid var(--line); border-radius: 12px; background: var(--panel); padding: 14px; }
    .profile-card h4 { margin: 0 0 6px; color: var(--quiet); font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
    .profile-card p { margin: 0; font-size: 13px; line-height: 1.45; color: var(--ink); }
    .token-pills { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px; }
    .token-pill { border: 1px solid var(--line); border-radius: 999px; background: var(--panel); color: var(--muted); font-size: 11px; padding: 4px 10px; }
    .category-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 16px; }
    .category { border: 1px solid var(--line); border-radius: 12px; background: var(--panel); padding: 13px; }
    .category h4 { margin: 0 0 8px; color: var(--quiet); font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
    .category .muted { margin: 0; font-size: 12px; }

    .swatch-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    .swatch-item { border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: var(--panel); }
    .swatch-chip { height: 80px; border-bottom: 1px solid var(--line); box-shadow: inset 0 0 0 1px var(--line-strong); }
    .swatch-meta { padding: 10px 12px; display: grid; gap: 3px; }
    .swatch-meta strong { font-size: 13px; color: var(--ink); }
    .swatch-meta code { font-family: var(--mono); font-size: 11px; color: var(--quiet); overflow-wrap: anywhere; }

    .token-confidence {
      display: inline-flex; align-items: center; height: 20px; border-radius: 999px;
      padding: 0 8px; font-size: 10px; font-weight: 600; border: 0; margin-top: 6px;
    }
    .token-confidence.high { background: var(--badge-high-bg); color: var(--badge-high-color); }
    .token-confidence.medium { background: var(--badge-medium-bg); color: var(--badge-medium-color); }
    .token-confidence.low { background: var(--badge-low-bg); color: var(--badge-low-color); }

    .dense-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .dense-table th { text-align: left; color: var(--quiet); font-weight: 650; border-bottom: 1px solid var(--line); padding: 0 0 6px; }
    .dense-table td { border-bottom: 1px solid var(--line); padding: 9px 0; vertical-align: top; color: var(--ink); }
    .dense-table tr:last-child td { border-bottom: 0; }

    .panel > .muted { margin: 20px 0 10px; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--quiet); }
    .panel > .muted:first-child { margin-top: 0; }

    .scale-list { display: grid; gap: 10px; margin-bottom: 18px; }
    .type-scale-summary {
      border: 1px solid var(--line); border-radius: var(--radius-lg); background: var(--panel); padding: 12px 14px;
      display: flex; justify-content: space-between; gap: 14px; color: var(--muted); font-size: 12px; margin-bottom: 4px;
    }
    .type-scale-summary strong { color: var(--ink); font-size: 13px; }
    .scale-row { border: 1px solid var(--line); border-radius: var(--radius-lg); background: var(--panel); padding: 12px 14px; }
    .scale-row .meta { color: var(--quiet); font-size: 11px; font-family: var(--mono); }
    .scale-row .sample { margin: 8px 0 0; line-height: 1.06; white-space: normal; overflow: hidden; overflow-wrap: anywhere; color: var(--ink); }

    .font-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 0; }
    .font-card { border: 1px solid var(--line); border-radius: 12px; background: var(--panel); padding: 13px 14px; }
    .font-card h4 { margin: 0; font-size: 12px; color: var(--ink); }
    .font-card p { margin: 4px 0 0; color: var(--muted); font-size: 11px; line-height: 1.4; }
    .font-card .font-label { margin: 0 0 8px; color: var(--quiet); font-size: 10px; font-weight: 700; text-transform: uppercase; }
    /* .font-details-grid is owned by typographyCss() in sections/typography.ts (was duplicated here) */

    .tri-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    .visual-token-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 10px; }
    .visual-token-grid + .muted { margin-top: 14px; }
    .visual-token-card { border: 1px solid var(--line); border-radius: 12px; background: var(--panel); padding: 12px; min-width: 0; }
    .visual-token-card h4 { margin: 0 0 9px; font-size: 13px; color: var(--ink); }
    .token-demo { border: 1px solid var(--line-strong); min-height: 112px; background: var(--rail); overflow: hidden; border-radius: var(--radius-md); }
    .padding-demo { max-height: 184px; }
    .padding-demo-inner { min-height: 38px; border: 1px solid var(--line-strong); border-radius: 5px; background: var(--panel); display: grid; place-items: center; color: var(--quiet); font-size: 11px; }
    .radius-demo { height: 112px; border: 1px solid var(--line-strong); background: var(--rail); }
    /* white card with margin so the (often large-blur) shadow has room and contrast to read against the frost card */
    .shadow-demo { height: 92px; margin: 14px 18px 20px; border: 1px solid var(--line); border-radius: 10px; background: var(--canvas); }
    .surface-demo { min-height: 112px; border: 1px solid var(--line); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; justify-content: space-between; }
    .surface-demo strong, .surface-demo code { display: block; }
    /* clamp long values (multi-layer shadows can be 10+ lines) to 3 lines; full value via copy chip */
    .token-code { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; margin-top: 7px; color: var(--quiet); font-family: var(--mono); font-size: 11px; overflow-wrap: anywhere; }

    .guidelines { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px; }
    .guidelines h4 { margin: 0 0 7px; font-size: 11px; text-transform: uppercase; letter-spacing: 0; color: var(--quiet); }
    .guidelines ul { margin: 0; padding-left: 18px; color: var(--muted); font-size: 13px; line-height: 1.5; }
    .guidelines li + li { margin-top: 8px; }

    .component-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap: 12px; }
    .component-row { border-bottom: 1px solid var(--line); display: flex; gap: 10px; justify-content: space-between; padding-bottom: 8px; }
    .component-row:last-child { border-bottom: 0; padding-bottom: 0; }
    .component-row strong { font-size: 13px; color: var(--ink); }
    .component-row span { color: var(--muted); font-size: 12px; text-align: right; }
    .component-specimen-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    /* two-part card: a preview stage on top, a distinct info panel below */
    .component-specimen { border: 1px solid var(--line); border-radius: 12px; background: var(--panel); overflow: hidden; min-width: 0; display: flex; flex-direction: column; }
    /* fixed-height stage so every specimen card is the same size (flex centering caps the object at max-width:100%) */
    .component-specimen-stage { height: 168px; background: var(--rail); display: flex; align-items: center; justify-content: center; padding: 22px; overflow: hidden; }
    .component-specimen-object { max-width: 100%; min-width: 0; overflow: hidden; overflow-wrap: anywhere; }
    .component-specimen-object.is-button, .component-specimen-object.is-link, .component-specimen-object.is-badge { display: inline-flex; align-items: center; justify-content: center; text-align: center; }
    .component-specimen-object.is-button span, .component-specimen-object.is-link span, .component-specimen-object.is-badge span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .component-specimen-object.is-card, .component-specimen-object.is-navigation { display: grid; align-content: start; gap: 8px; }
    /* grid children default to min-width:auto and refuse to wrap — force wrapping so card/nav copy stays inside the stage */
    .component-specimen-object.is-card > *, .component-specimen-object.is-navigation > * { min-width: 0; max-width: 100%; white-space: normal; overflow-wrap: anywhere; word-break: break-word; }
    /* clean heading + body specimen, rendered in the component's own (extracted) font */
    .component-specimen-object .specimen-head { font-size: 15px; font-weight: 650; line-height: 1.2; }
    .component-specimen-object .specimen-body { font-size: 12.5px; line-height: 1.45; opacity: 0.7; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
    .component-specimen-info { padding: 11px 13px 14px; border-top: 1px solid var(--line); background: var(--canvas); display: grid; gap: 6px; }
    .component-specimen-title { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; font-size: 13px; font-weight: 650; color: var(--ink); }
    .component-specimen-count { color: var(--quiet); font-weight: 500; }
    /* clamp to 2 lines so info-box height (and the whole card) stays uniform; full value via the copy chip */
    .component-specimen-meta { margin: 0; color: var(--quiet); font-family: var(--mono); font-size: 11px; line-height: 1.45; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }

    .component-preview { border: 1px solid var(--line); border-radius: 12px; padding: 14px; background: var(--panel); }
    .preview-banner { border-radius: 10px; padding: 22px; margin-bottom: 12px; }
    .preview-banner h4 { margin: 0; font-size: 48px; line-height: 1; }
    .preview-banner p { margin: 8px 0 0; font-size: 13px; line-height: 1.4; }
    .preview-palette { display: flex; gap: 8px; margin: 12px 0; }
    .preview-palette span { display: block; height: 28px; flex: 1 1 0; border-radius: 6px; border: 1px solid var(--line); }
    .preview-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
    .preview-metric { border: 1px solid var(--line); border-radius: 6px; padding: 8px; background: rgba(255,255,255,0.05); }
    .preview-metric strong { display: block; font-size: 10px; color: var(--quiet); margin-bottom: 4px; text-transform: uppercase; }
    .preview-metric span { display: block; font-size: 13px; font-weight: 660; }
    .preview-actions { margin-top: 10px; display: flex; gap: 8px; }
    .preview-actions button { border: 0; border-radius: 999px; font-size: 12px; font-weight: 700; padding: 8px 12px; cursor: default; }

    .component-samples { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-top: 12px; }
    .sample-component { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .component-style-grid { margin-top: 12px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    /* style chips live inside the site-themed .component-preview, so their
       text must track the extracted site color (light or dark), not chrome ink. */
    .style-chip { border: 1px solid var(--line); border-radius: 6px; background: rgba(255,255,255,0.04); padding: 10px; font-size: 11px; overflow-wrap: anywhere; color: var(--site-text, var(--ink)); }
    .style-chip strong { display: block; margin-bottom: 3px; color: var(--site-text, var(--quiet)); opacity: 0.6; text-transform: uppercase; font-size: 10px; }

    .split-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .mono-list { margin: 0; padding-left: 16px; color: var(--muted); font-size: 12px; line-height: 1.45; overflow-wrap: anywhere; }
    .mono-list li + li { margin-top: 4px; }
  `;
}
