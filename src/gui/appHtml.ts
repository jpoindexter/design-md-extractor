export function renderAppHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Design MD Extractor</title>
    <style>
      :root {
        --ink: #141715;
        --muted: #656b66;
        --quiet: #8a908b;
        --line: #dfe4df;
        --line-strong: #c8cec8;
        --canvas: #edf0ed;
        --paper: #fbfcfb;
        --panel: #ffffff;
        --rail: #f6f8fb;
        --accent: #1b2f24;
        --accent-soft: #3a5446;
        --error: #9f1239;
        --mono: "JetBrains Mono", "SFMono-Regular", Menlo, monospace;
      }
      * { box-sizing: border-box; }
      html, body {
        min-height: 100%;
      }
      body {
        margin: 0;
        color: var(--ink);
        background: var(--canvas);
        font-family: "Helvetica Neue", Arial, sans-serif;
        letter-spacing: 0;
        overflow: hidden;
      }
      button, input, select { font: inherit; color: inherit; }
      .shell {
        height: 100dvh;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
      }
      .side {
        border-bottom: 1px solid var(--line);
        background: var(--paper);
        padding: 13px 32px;
        position: sticky;
        top: 0;
        z-index: 20;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) minmax(180px, 240px);
        gap: 20px;
        align-items: end;
      }
      .brand { display: flex; align-items: center; gap: 10px; margin: 0 8px 3px 0; min-width: 200px; }
      .mark {
        width: 26px;
        height: 26px;
        border: 1.5px solid var(--ink);
        border-radius: 6px;
        display: grid;
        place-items: center;
        background: #fff;
      }
      .mark::before {
        content: "";
        width: 11px;
        height: 11px;
        border-radius: 2px;
        background: var(--accent-soft);
      }
      h1 { margin: 0; font-size: 17px; line-height: 1.15; }
      .lede {
        margin: 6px 0 0;
        color: var(--muted);
        font-size: 11px;
        line-height: 1.45;
      }
      form {
        display: grid;
        grid-template-columns: minmax(220px, 1.45fr) minmax(160px, 0.72fr) minmax(150px, 0.68fr) 140px;
        gap: 10px;
        align-items: end;
        min-width: 0;
      }
      label {
        display: grid;
        gap: 6px;
        color: var(--muted);
        font-size: 11px;
        font-weight: 680;
        text-transform: uppercase;
        letter-spacing: 0;
      }
      input, select {
        width: 100%;
        min-height: 38px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #fff;
        color: var(--ink);
        padding: 9px 10px;
        font-size: 13px;
      }
      input:focus-visible, select:focus-visible {
        outline: 2px solid rgba(58, 84, 70, 0.25);
        outline-offset: 1px;
      }
      .run {
        border: 0;
        min-height: 40px;
        border-radius: 6px;
        background: var(--accent-soft);
        color: #fff;
        font-weight: 710;
        cursor: pointer;
        transition: background 120ms ease-in-out;
      }
      .run:hover { background: #2f473b; }
      .run:disabled { opacity: 0.6; cursor: wait; }
      .status {
        margin: 0;
        min-height: 42px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #f2f4f2;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.45;
        padding: 11px;
        min-width: 0;
      }
      body.site-themed-ui {
        background: var(--site-canvas, var(--canvas));
        color: var(--site-text, var(--ink));
        font-family: var(--site-font-body, "Helvetica Neue", Arial, sans-serif);
      }
      body.site-themed-ui .side {
        background: var(--site-surface, var(--paper));
        border-bottom: var(--site-border-width, 1px) var(--site-border-style, solid) var(--site-border, var(--line));
      }
      body.site-themed-ui input,
      body.site-themed-ui select,
      body.site-themed-ui .status {
        border: var(--site-border-width, 1px) var(--site-border-style, solid) var(--site-border, var(--line));
        border-radius: var(--site-radius, 6px);
        background: var(--site-card, #fff);
        color: var(--site-text, var(--ink));
      }
      body.site-themed-ui label,
      body.site-themed-ui .lede,
      body.site-themed-ui .status {
        color: var(--site-muted, var(--muted));
      }
      body.site-themed-ui .run {
        border-radius: var(--site-radius, 6px);
        background: var(--site-accent, var(--accent-soft));
        color: var(--site-accent-text, #fff);
      }
      body.site-themed-ui .run:hover { background: var(--site-accent, var(--accent-soft)); }
      main {
        min-height: 0;
        padding: 0;
        overflow: hidden;
        background: var(--canvas);
      }
      main:has(.result.site-themed.active) {
        background: var(--site-canvas, var(--canvas));
      }
      .empty {
        min-height: 100%;
        border: 0;
        border-radius: 0;
        background: var(--panel);
        color: var(--muted);
        display: grid;
        place-items: center;
        padding: 34px;
        text-align: center;
      }
      .result {
        display: none;
        min-height: 0;
        height: 100%;
        gap: 0;
        max-width: none;
        margin: 0;
      }
      .result.active { display: grid; }
      .result.site-themed {
        --site-canvas: #edf0ed;
        --site-surface: #ffffff;
        --site-card: #ffffff;
        --site-code: #f7f8fb;
        --site-text: #141715;
        --site-muted: #656b66;
        --site-accent: #3a5446;
        --site-accent-text: #ffffff;
        --site-border: #dfe4df;
        --site-border-width: 1px;
        --site-border-style: solid;
        --site-radius: 8px;
        --site-shadow: 0 10px 34px rgba(20, 23, 21, 0.035);
        --site-frame-shadow: inset 0 0 0 1px var(--site-border);
        --site-space: 14px;
        --site-section-space: 36px;
        --site-font-body: "Helvetica Neue", Arial, sans-serif;
        --site-font-display: var(--site-font-body);
        --site-display-size: 72px;
        --site-display-weight: 700;
        --site-display-line: 0.92;
        color: var(--site-text);
        font-family: var(--site-font-body);
        background: var(--site-canvas);
        padding: 0;
        border-radius: 0;
      }
      .result-head {
        display: flex;
        gap: 14px;
        justify-content: space-between;
        align-items: flex-start;
        padding: 30px 0 6px;
      }
      .crumb {
        margin: 0 0 8px;
        color: var(--muted);
        font-size: 13px;
      }
      .result-head h2 {
        margin: 0;
        font-size: 44px;
        line-height: 1.02;
        font-weight: 520;
        max-width: 820px;
        overflow-wrap: anywhere;
      }
      .result.site-themed .result-head h2 {
        color: var(--site-text);
        font-family: var(--site-font-display);
        font-size: var(--site-display-size);
        line-height: var(--site-display-line);
        font-weight: var(--site-display-weight);
      }
      .result.site-themed .crumb,
      .result.site-themed #result-meta {
        color: var(--site-muted);
      }
      #result-meta {
        margin: 10px 0 0;
        color: var(--muted);
        font-size: 12px;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
      }
      .actions a {
        text-decoration: none;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #fff;
        color: var(--ink);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0;
        padding: 8px 10px;
      }
      .result.site-themed .actions a {
        border-color: var(--site-border);
        border-width: var(--site-border-width);
        border-style: var(--site-border-style);
        border-radius: var(--site-radius);
        background: var(--site-card);
        color: var(--site-text);
        font-family: var(--site-font-body);
      }
      .result.site-themed .actions a:hover {
        border-color: var(--site-accent);
        color: var(--site-accent);
      }
      .workspace {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(520px, 1fr);
        min-height: 0;
        height: 100%;
        gap: 0;
        align-items: stretch;
        max-width: none;
        border: 0;
        border-top: 1px solid var(--line);
        border-radius: 0;
        background: var(--panel);
        overflow: hidden;
        box-shadow: none;
        min-width: 0;
      }
      .result.site-themed .workspace {
        border-color: var(--site-border);
        border-width: var(--site-border-width);
        border-style: var(--site-border-style);
        border-left: 0;
        border-right: 0;
        border-bottom: 0;
        border-radius: 0;
        background: var(--site-canvas);
        box-shadow: none;
      }
      .reference {
        display: grid;
        align-content: start;
        gap: 0;
        min-height: 0;
        min-width: 0;
        height: 100%;
        overflow: auto;
        overflow-x: hidden;
        background: #fff;
        padding: 48px 40px 96px;
        border-right: 1px solid var(--line);
      }
      .reference-hero h3 {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
      }
      .style-summary h3 {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
      }
      .reference > *,
      .panel {
        min-width: 0;
        max-width: 100%;
      }
      .result.site-themed .reference {
        background: var(--site-surface);
        color: var(--site-text);
        border-right-color: var(--site-border);
        border-right-width: var(--site-border-width);
        border-right-style: var(--site-border-style);
        font-family: var(--site-font-body);
        padding: 48px 40px 96px;
      }
      .panel {
        border: 0;
        border-top: 1px solid var(--line);
        border-radius: 0;
        background: transparent;
        padding: 56px 0;
      }
      .result.site-themed .panel {
        border-top-color: var(--site-border);
        border-top-width: var(--site-border-width);
        border-top-style: var(--site-border-style);
        padding: 56px 0;
      }
      .reference > .panel:first-child { border-top: 0; padding-top: 0; }
      .reference > .panel:last-child { padding-bottom: 0; }
      .panel h3 {
        margin: 0 0 18px;
        font-size: 15px;
        letter-spacing: 0;
        text-transform: none;
        color: var(--ink);
        font-weight: 660;
      }
      .result.site-themed .panel h3 {
        color: var(--site-text);
        font-family: var(--site-font-display);
        font-weight: 700;
      }
      .hero-figure {
        margin: 0;
        border: 1px solid var(--line);
        border-radius: 8px;
        overflow: hidden;
        background: #deddd8;
      }
      .result.site-themed .hero-figure,
      .result.site-themed .thumb-strip a {
        border-color: var(--site-border);
        border-width: var(--site-border-width);
        border-style: var(--site-border-style);
        border-radius: var(--site-radius);
        background: var(--site-canvas);
      }
      .result.site-themed .hero-meta {
        border-top-color: var(--site-border);
        color: var(--site-muted);
      }
      .hero-figure img {
        width: 100%;
        height: 420px;
        max-height: 52vh;
        object-fit: contain;
        display: block;
      }
      .hero-meta {
        padding: 11px 12px;
        border-top: 1px solid var(--line);
        color: var(--muted);
        font-size: 12px;
      }
      .thumb-strip {
        margin-top: 12px;
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding-bottom: 2px;
      }
      .thumb-strip a {
        border: 1px solid var(--line);
        border-radius: 8px;
        overflow: hidden;
        display: block;
        flex: 0 0 138px;
        background: #deddd8;
      }
      .thumb-strip img {
        width: 100%;
        aspect-ratio: 16 / 10;
        object-fit: contain;
        display: block;
      }
      .thesis {
        margin: 0;
        max-width: 720px;
        font-size: 18px;
        line-height: 1.55;
        color: #303530;
      }
      .result.site-themed .thesis {
        color: var(--site-text);
        font-family: var(--site-font-body);
      }
      .profile-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .profile-card {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #fff;
        padding: 14px;
      }
      .result.site-themed .profile-card,
      .result.site-themed .category,
      .result.site-themed .swatch-item,
      .result.site-themed .scale-row,
      .result.site-themed .font-card {
        border-color: var(--site-border);
        border-width: var(--site-border-width);
        border-style: var(--site-border-style);
        border-radius: var(--site-radius);
        background: var(--site-card);
        color: var(--site-text);
        padding: var(--site-space);
      }
      .profile-card h4 {
        margin: 0 0 8px;
        color: var(--quiet);
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0;
      }
      .result.site-themed .profile-card h4,
      .result.site-themed .category h4,
      .result.site-themed .scale-row .meta,
      .result.site-themed .font-card p,
      .result.site-themed .muted,
      .result.site-themed .swatch-meta code,
      .result.site-themed .token-code,
      .result.site-themed .component-specimen-meta,
      .result.site-themed .mono-list,
      .result.site-themed .panel > .muted {
        color: var(--site-muted);
      }
      .profile-card p {
        margin: 0;
        font-size: 14px;
        line-height: 1.45;
      }
      .token-pills {
        margin-top: 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .token-pill {
        border: 1px solid var(--line);
        border-radius: 999px;
        background: #f2f4f2;
        color: var(--ink);
        font-size: 11px;
        padding: 4px 8px;
      }
      .result.site-themed .token-pill,
      .result.site-themed .token-confidence {
        border-color: var(--site-border);
        border-width: var(--site-border-width);
        border-style: var(--site-border-style);
        background: var(--site-card);
        color: var(--site-text);
      }
      .result.site-themed .run,
      .result.site-themed .tab.active,
      .result.site-themed .mode-btn.active {
        color: var(--site-accent);
      }
      .category-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 18px;
      }
      .category {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #fff;
        padding: 13px;
      }
      .category h4 {
        margin: 0 0 8px;
        color: var(--quiet);
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0;
      }
      .category .muted {
        margin: 0;
        font-size: 12px;
      }
      .swatch-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
        gap: 12px;
      }
      .swatch-item {
        border: 1px solid var(--line);
        border-radius: 8px;
        overflow: hidden;
        background: #fff;
      }
      .swatch-item:nth-child(1),
      .swatch-item:nth-child(2) {
        grid-column: span 2;
      }
      .swatch-item:nth-child(1) .swatch-chip,
      .swatch-item:nth-child(2) .swatch-chip {
        height: 124px;
      }
      .swatch-chip { height: 92px; border-bottom: 1px solid var(--line); }
      .swatch-meta { padding: 12px 13px 13px; display: grid; gap: 4px; min-height: 98px; }
      .swatch-meta strong { font-size: 14px; }
      .swatch-meta code {
        font-family: var(--mono);
        font-size: 11px;
        color: var(--muted);
        overflow-wrap: anywhere;
      }
      .dense-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      .dense-table th {
        text-align: left;
        color: var(--muted);
        font-weight: 650;
        border-bottom: 1px solid var(--line);
        padding: 0 0 6px;
      }
      .result.site-themed .dense-table th {
        color: var(--site-muted);
        border-bottom-color: var(--site-border);
      }
      .dense-table td {
        border-bottom: 1px solid var(--line);
        padding: 9px 0;
        vertical-align: top;
      }
      .result.site-themed .dense-table td {
        border-bottom-color: var(--site-border);
      }
      .dense-table tr:last-child td { border-bottom: 0; }
      .muted { color: var(--muted); font-size: 12px; }
      .panel > .muted {
        margin: 22px 0 10px;
        color: var(--quiet);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0;
        text-transform: uppercase;
      }
      .panel > .muted:first-child { margin-top: 0; }
      .scale-list {
        display: grid;
        gap: 10px;
        margin-bottom: 18px;
      }
      .type-scale-summary {
        border: 1px solid var(--line);
        border-radius: 10px;
        background: #fff;
        padding: 12px 14px;
        display: flex;
        justify-content: space-between;
        gap: 14px;
        color: var(--muted);
        font-size: 12px;
        margin-bottom: 4px;
      }
      .type-scale-summary strong {
        color: var(--ink);
        font-size: 13px;
      }
      .scale-row {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #fff;
        padding: 12px 14px;
      }
      .scale-row .meta {
        color: var(--muted);
        font-size: 11px;
        font-family: var(--mono);
      }
      .scale-row .sample {
        margin: 8px 0 0;
        line-height: 1.06;
        white-space: normal;
        overflow: hidden;
        overflow-wrap: anywhere;
      }
      .font-cards {
        margin-top: 18px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .font-card {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #fff;
        padding: 13px 14px;
      }
      .font-card h4 {
        margin: 0;
        font-size: 12px;
      }
      .font-card p {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 11px;
        line-height: 1.4;
      }
      .font-card .font-label {
        margin: 0 0 8px;
        color: var(--muted);
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .tri-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }
      .visual-token-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 12px;
      }
      .visual-token-grid + .muted {
        margin-top: 14px;
      }
      .visual-token-card {
        border: 0;
        border-radius: 8px;
        background: #fafbfa;
        box-shadow: inset 0 0 0 1px var(--line);
        padding: 12px;
        min-width: 0;
      }
      .result.site-themed .visual-token-card,
      .result.site-themed .component-specimen,
      .result.site-themed .component-preview {
        border: var(--site-border-width) var(--site-border-style) var(--site-border);
        border-radius: var(--site-radius);
        background: var(--site-card);
        box-shadow: var(--site-frame-shadow);
        color: var(--site-text);
        padding: var(--site-space);
      }
      .visual-token-card h4 {
        margin: 0 0 9px;
        font-size: 13px;
      }
      .token-demo {
        border: 1px solid rgba(0, 0, 0, 0.16);
        min-height: 112px;
        background: #f7f8fb;
        overflow: hidden;
      }
      .result.site-themed .token-demo,
      .result.site-themed .radius-demo,
      .result.site-themed .shadow-demo,
      .result.site-themed .component-specimen-stage {
        border-color: var(--site-border);
        border-width: var(--site-border-width);
        border-style: var(--site-border-style);
        border-radius: var(--site-radius);
        background: var(--site-surface);
      }
      .padding-demo {
        max-height: 184px;
      }
      .result.site-themed .padding-demo-inner {
        border-color: var(--site-border);
        border-width: var(--site-border-width);
        border-style: var(--site-border-style);
        border-radius: var(--site-radius);
        background: var(--site-card);
        color: var(--site-muted);
      }
      .padding-demo-inner {
        min-height: 38px;
        border: 1px solid rgba(0, 0, 0, 0.24);
        border-radius: 5px;
        background: #fff;
        display: grid;
        place-items: center;
        color: var(--muted);
        font-size: 11px;
      }
      .radius-demo {
        height: 112px;
        border: 1px solid rgba(0, 0, 0, 0.2);
        background: #f7f8fb;
      }
      .shadow-demo {
        height: 112px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 8px;
        background: #fff;
      }
      .surface-demo {
        min-height: 112px;
        border: 1px solid rgba(0, 0, 0, 0.14);
        border-radius: 8px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .surface-demo strong,
      .surface-demo code {
        display: block;
      }
      .token-code {
        display: block;
        margin-top: 7px;
        color: var(--muted);
        font-family: var(--mono);
        font-size: 11px;
        overflow-wrap: anywhere;
      }
      .token-confidence {
        display: inline-flex;
        margin-top: 7px;
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 2px 7px;
        color: var(--muted);
        font-size: 10px;
      }
      .guidelines {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 28px;
      }
      .guidelines h4 {
        margin: 0 0 7px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0;
      }
      .guidelines ul {
        margin: 0;
        padding-left: 18px;
        color: var(--ink);
        font-size: 13px;
        line-height: 1.5;
      }
      .result.site-themed .guidelines ul {
        color: var(--site-text);
      }
      .guidelines li + li { margin-top: 8px; }
      .component-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
        gap: 12px;
      }
      .component-row {
        border-bottom: 1px solid var(--line);
        display: flex;
        gap: 10px;
        justify-content: space-between;
        padding-bottom: 8px;
      }
      .component-row:last-child { border-bottom: 0; padding-bottom: 0; }
      .component-row strong { font-size: 13px; }
      .component-row span {
        color: var(--muted);
        font-size: 12px;
        text-align: right;
      }
      .component-specimen-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 10px;
      }
      .component-specimen {
        border: 0;
        border-radius: 8px;
        background: #fafbfa;
        box-shadow: inset 0 0 0 1px var(--line);
        padding: 12px;
        min-width: 0;
      }
      .component-specimen-stage {
        min-height: 178px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #fff;
        display: grid;
        place-items: center;
        padding: 18px;
        overflow: hidden;
      }
      .component-specimen-object {
        max-width: 100%;
        overflow: hidden;
        overflow-wrap: anywhere;
      }
      .component-specimen-object.is-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-align: center;
      }
      .component-specimen-object.is-button span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .component-specimen-object.is-card,
      .component-specimen-object.is-navigation {
        display: grid;
        align-content: start;
        gap: 8px;
      }
      .component-specimen-title {
        display: block;
        margin-top: 10px;
        font-size: 13px;
      }
      .result.site-themed .component-specimen-title,
      .result.site-themed .font-card h4,
      .result.site-themed .swatch-meta strong,
      .result.site-themed .visual-token-card h4 {
        color: var(--site-text);
        font-family: var(--site-font-display);
      }
      .component-specimen-meta {
        margin-top: 5px;
        color: var(--muted);
        font-family: var(--mono);
        font-size: 11px;
        line-height: 1.35;
        overflow-wrap: anywhere;
      }
      .component-preview {
        border: 0;
        border-radius: 8px;
        padding: 14px;
        background: #fafbfa;
        box-shadow: inset 0 0 0 1px var(--line);
      }
      .preview-banner {
        border-radius: 8px;
        padding: 22px;
        margin-bottom: 12px;
      }
      .preview-banner h4 {
        margin: 0;
        font-size: 48px;
        line-height: 1;
      }
      .preview-banner p {
        margin: 8px 0 0;
        font-size: 13px;
        line-height: 1.4;
      }
      .preview-palette {
        display: flex;
        gap: 8px;
        margin: 12px 0;
      }
      .preview-palette span {
        display: block;
        height: 28px;
        flex: 1 1 0;
        border-radius: 6px;
        border: 1px solid rgba(0, 0, 0, 0.12);
      }
      .preview-metrics {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        margin-top: 12px;
      }
      .preview-metric {
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 6px;
        padding: 8px;
        background: rgba(255, 255, 255, 0.72);
      }
      .preview-metric strong {
        display: block;
        font-size: 10px;
        color: var(--muted);
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0;
      }
      .preview-metric span {
        display: block;
        font-size: 13px;
        font-weight: 660;
      }
      .preview-actions {
        margin-top: 10px;
        display: flex;
        gap: 8px;
      }
      .preview-actions button {
        border: 0;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        padding: 8px 12px;
        cursor: default;
      }
      .component-samples {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        margin-top: 12px;
      }
      .sample-component {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .component-style-grid {
        margin-top: 12px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .style-chip {
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.72);
        padding: 10px;
        font-size: 11px;
        overflow-wrap: anywhere;
      }
      .result.site-themed .style-chip,
      .result.site-themed .preview-metric {
        border-color: var(--site-border);
        border-width: var(--site-border-width);
        border-style: var(--site-border-style);
        border-radius: var(--site-radius);
        background: var(--site-surface);
        color: var(--site-text);
      }
      .result.site-themed .preview-palette span:first-child {
        border-color: var(--site-accent);
        box-shadow: inset 0 0 0 2px var(--site-accent);
      }
      .style-chip strong {
        display: block;
        margin-bottom: 3px;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0;
      }
      .split-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .mono-list {
        margin: 0;
        padding-left: 16px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.45;
        overflow-wrap: anywhere;
      }
      .mono-list li + li { margin-top: 4px; }
      .export-pane {
        position: static;
        min-height: 0;
        min-width: 0;
        height: 100%;
        max-height: none;
        overflow: hidden;
        border: 0;
        border-radius: 0;
        background: #fafafa;
        padding: 0;
        display: flex;
        flex-direction: column;
      }
      .result.site-themed .export-pane {
        background: var(--site-code);
        color: var(--site-text);
        font-family: var(--site-font-body);
      }
      .export-pane h3 {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
      }
      .result.site-themed .export-pane h3 {
        color: var(--site-text);
        font-family: var(--site-font-display);
      }
      .tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 24px;
        margin: 0;
        padding: 0 24px;
        border-bottom: 1px solid var(--line);
      }
      .result.site-themed .tabs,
      .result.site-themed .export-actions,
      .result.site-themed .downloads {
        border-color: var(--site-border);
      }
      .export-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 11px 24px;
        border-bottom: 1px solid var(--line);
      }
      .mode-tabs {
        display: flex;
        gap: 16px;
      }
      .mode-btn,
      .copy-btn {
        border: 1px solid transparent;
        background: transparent;
        min-height: 30px;
        font-size: 12px;
        color: var(--muted);
        cursor: pointer;
      }
      .result.site-themed .mode-btn,
      .result.site-themed .tab,
      .result.site-themed .export-note,
      .result.site-themed .hint {
        color: var(--site-muted);
      }
      .mode-btn.active {
        color: var(--ink);
        border-bottom-color: var(--ink);
      }
      .result.site-themed .mode-btn.active,
      .result.site-themed .tab.active,
      .result.site-themed .export-note a {
        color: var(--site-accent);
        border-color: var(--site-accent);
      }
      .copy-btn {
        border-color: var(--line);
        border-radius: 6px;
        background: #fff;
        color: var(--ink);
        padding: 0 10px;
        font-weight: 680;
      }
      .result.site-themed .copy-btn,
      .result.site-themed .download-btn {
        border-color: var(--site-border);
        border-radius: var(--site-radius);
        background: var(--site-card);
        color: var(--site-text);
      }
      .result.site-themed .download-btn:hover,
      .result.site-themed .copy-btn:hover {
        border-color: var(--site-accent);
        color: var(--site-accent);
      }
      .downloads {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 6px;
        padding: 0 24px 12px;
        margin: 0;
        border-bottom: 1px solid var(--line);
      }
      .download-btn {
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #fff;
        color: var(--ink);
        min-height: 32px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
      }
      .tab {
        border: 0;
        border-bottom: 1px solid transparent;
        background: transparent;
        color: var(--muted);
        border-radius: 0;
        min-height: 46px;
        padding: 0;
        font-size: 12px;
        font-weight: 620;
        cursor: pointer;
      }
      .tab.active {
        border-color: var(--ink);
        color: var(--ink);
        background: transparent;
      }
      .tab-panel {
        display: none;
        min-height: 0;
        min-width: 0;
        flex: 1;
        padding: 14px 24px 24px;
        overflow: hidden;
      }
      .tab-panel.active {
        display: flex;
        flex-direction: column;
      }
      .export-note {
        margin: 0 0 8px;
        color: var(--muted);
        font-size: 12px;
      }
      .export-note a {
        color: var(--accent);
        font-weight: 670;
      }
      .excerpt {
        margin: 0;
        border: 1px solid #e7ebee;
        border-radius: 0;
        background: #fff;
        padding: 15px;
        font-size: 12px;
        line-height: 1.65;
        font-family: var(--mono);
        min-height: 0;
        min-width: 0;
        max-width: 100%;
        max-height: none;
        flex: 1;
        overflow: auto;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .result.site-themed .excerpt,
      .result.site-themed .code-block {
        border-color: var(--site-border);
        border-radius: var(--site-radius);
        background: var(--site-card);
        color: var(--site-text);
      }
      .code-block {
        margin: 0;
        border: 1px solid #e7ebee;
        border-radius: 0;
        background: #fff;
        color: #1f2722;
        font-family: var(--mono);
        font-size: 12px;
        line-height: 1.65;
        padding: 15px;
        min-height: 0;
        min-width: 0;
        max-width: 100%;
        max-height: none;
        flex: 1;
        overflow: auto;
        white-space: pre;
      }
      .error { color: var(--error); }
      .hint {
        margin: 0;
        padding: 10px 24px 8px;
        color: var(--muted);
        font-size: 11px;
      }
      body.site-themed-ui {
        background: #ffffff;
        color: #09090b;
      }
      body.site-themed-ui main {
        background: #ffffff;
      }
      body.site-themed-ui main:has(.result.refero-layout.active) {
        background: #ffffff;
      }
      body.site-themed-ui .side {
        background: #ffffff;
        border-bottom: 1px solid #e5e7eb;
      }
      body.site-themed-ui input,
      body.site-themed-ui select,
      body.site-themed-ui .status {
        border: 1px solid #dfe3e7;
        border-radius: 10px;
        background: #ffffff;
        color: #09090b;
      }
      body.site-themed-ui .run {
        border-radius: 999px;
        background: #09090b;
        color: #ffffff;
      }
      body.site-themed-ui .run:hover { background: #09090b; }
      .result.refero-layout {
        background: #ffffff;
        color: #09090b;
        font-family: "Helvetica Neue", Arial, sans-serif;
      }
      .result.refero-layout .workspace {
        border-top: 1px solid #e5e7eb;
        background: #ffffff;
      }
      .result.refero-layout .reference,
      .result.refero-layout .export-pane {
        overscroll-behavior: contain;
      }
      .result.refero-layout .reference {
        background: #ffffff;
        color: #09090b;
        border-right: 1px solid #e5e7eb;
      }
      .result.refero-layout .panel {
        border-top: 0;
        padding: 0;
      }
      .result.refero-layout .panel + .panel {
        margin-top: 64px;
      }
      .result.refero-layout .reference-hero + .result-head {
        margin-top: 28px;
      }
      .result.refero-layout .result-head + .style-summary {
        margin-top: 18px;
      }
      .result.refero-layout .style-summary + .panel {
        margin-top: 56px;
      }
      .result.refero-layout .panel h3 {
        margin-bottom: 24px;
        color: #09090b;
        font-size: 20px;
        font-weight: 650;
        letter-spacing: 0;
      }
      .result.refero-layout .result-head {
        padding: 0;
        display: block;
        align-items: start;
      }
      .result.refero-layout .result-head h2 {
        color: #09090b;
        font-size: 56px;
        font-weight: 430;
        line-height: 0.9;
      }
      .result.refero-layout .crumb,
      .result.refero-layout #result-meta,
      .result.refero-layout .muted {
        color: #667085;
      }
      .result.refero-layout .thesis {
        max-width: 620px;
        color: #4b5563;
        font-size: 16px;
        line-height: 1.65;
      }
      .result.refero-layout .actions a {
        border: 0;
        background: transparent;
        color: #09090b;
        padding: 0;
        font-size: 12px;
      }
      .result.refero-layout .actions {
        display: none;
      }
      .result.refero-layout .hero-figure {
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        background: #ffffff;
        box-shadow: 0 18px 44px rgba(16, 24, 40, 0.08);
      }
      .result.refero-layout .hero-figure img {
        height: clamp(320px, 46vh, 420px);
      }
      .result.refero-layout .thumb-strip {
        display: none;
      }
      .result.refero-layout .thumb-strip a,
      .result.refero-layout .profile-card,
      .result.refero-layout .category,
      .result.refero-layout .scale-row,
      .result.refero-layout .font-card,
      .result.refero-layout .visual-token-card,
      .result.refero-layout .component-specimen,
      .result.refero-layout .component-preview,
      .result.refero-layout .style-chip,
      .result.refero-layout .preview-metric {
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        background: #ffffff;
        box-shadow: none;
      }
      .result.refero-layout .swatch-item {
        border: 0;
        border-radius: 16px;
        background: transparent;
      }
      .result.refero-layout .swatch-chip {
        border: 1px solid #d9dde3;
        border-radius: 16px;
        height: 112px;
      }
      .result.refero-layout .export-pane {
        border-top: 0;
        background: #fafafa;
        color: #09090b;
        padding: 0;
      }
      .result.refero-layout .tabs {
        border-bottom: 1px solid #e5e7eb;
      }
      .result.refero-layout .tab {
        color: #667085;
        font-size: 13px;
        font-weight: 560;
      }
      .result.refero-layout .tab.active {
        border-color: #09090b;
        color: #09090b;
        font-weight: 650;
      }
      .result.refero-layout .export-actions,
      .result.refero-layout .downloads {
        border-bottom: 1px solid #e5e7eb;
      }
      .result.refero-layout .export-actions {
        padding: 8px 12px 8px 24px;
      }
      .result.refero-layout .export-tools {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .result.refero-layout .copy-btn,
      .result.refero-layout .download-btn {
        border: 1px solid #d7dbe0;
        border-radius: 10px;
        background: #ffffff;
        color: #09090b;
        min-height: 30px;
        padding: 0 10px;
      }
      .result.refero-layout .hint,
      .result.refero-layout .downloads {
        display: none;
      }
      .result.refero-layout .excerpt,
      .result.refero-layout .code-block {
        border: 0;
        border-radius: 0;
        background: #fafafa;
        color: #1f2937;
      }
      @media (max-width: 1220px) {
        body { overflow: auto; }
        .shell { height: auto; min-height: 100dvh; }
        main { overflow: hidden; }
        .result { height: auto; }
        .workspace { grid-template-columns: minmax(0, 1fr); height: auto; overflow: hidden; }
        .reference { height: auto; overflow: visible; overflow-x: hidden; border-right: 0; }
        .result-head h2 { font-size: 42px; }
        .result.site-themed .result-head h2 { font-size: 56px; }
        .export-pane {
          order: -1;
          height: 720px;
          max-height: calc(100vh - 24px);
        }
      }
      @media (max-width: 1320px) and (min-width: 961px) {
        form {
          grid-template-columns: minmax(180px, 1.2fr) minmax(132px, 0.6fr) minmax(132px, 0.6fr) 126px;
        }
        .run {
          padding-inline: 10px;
        }
      }
      @media (max-width: 960px) {
        .side {
          position: static;
          grid-template-columns: 1fr;
        }
        .brand { min-width: 0; }
        form { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .result-head { display: grid; }
        .actions { justify-content: flex-start; }
      }
      @media (max-width: 760px) {
        main { padding: 0; overflow-x: hidden; }
        .result-head h2 { font-size: 34px; }
        .result.site-themed .result-head h2 { font-size: 38px; }
        .result.refero-layout .result-head h2 { font-size: 42px; }
        .preview-banner h4 { font-size: 34px; }
        .reference { padding: 18px; }
        .result.site-themed .reference,
        .result.refero-layout .reference {
          padding: 18px 12px 48px;
        }
        .result.refero-layout .panel + .panel {
          margin-top: 44px;
        }
        .tab-panel {
          padding: 12px;
        }
        .tabs,
        .export-actions,
        .downloads {
          padding-left: 12px;
          padding-right: 12px;
        }
        .workspace { border-radius: 0; }
        .hero-figure img { height: 260px; }
        form { grid-template-columns: minmax(0, 1fr); }
        .side { padding: 16px 12px; }
        .export-pane {
          height: 620px;
          max-height: calc(100vh - 24px);
        }
        .guidelines,
        .category-grid,
        .font-cards,
        .split-list,
        .tri-grid,
        .profile-grid,
        .preview-metrics,
        .downloads,
        .swatch-item:nth-child(1),
        .swatch-item:nth-child(2) {
          grid-template-columns: minmax(0, 1fr);
          grid-column: auto;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <aside class="side">
        <div class="brand">
          <div class="mark" aria-hidden="true"></div>
          <div>
            <h1>Design MD Extractor</h1>
            <p class="lede">Capture a website's usable visual system.</p>
          </div>
        </div>
        <form id="extract-form">
          <label>
            Website URL
            <input id="url" name="url" type="text" inputmode="url" autocapitalize="none" spellcheck="false" placeholder="www.example.com or https://example.com" required>
          </label>
          <label>
            Coverage
            <select id="max-pages" name="maxPages">
              <option value="7" selected>Broad scan, up to 7 pages</option>
              <option value="4">Quick scan, up to 4 pages</option>
              <option value="12">Deep scan, up to 12 pages</option>
            </select>
          </label>
          <label>
            AI Assistant
            <select id="ai-target" name="aiTarget">
              <option value="codex" selected>Codex (OpenAI)</option>
              <option value="claude">Claude (Anthropic)</option>
              <option value="chatgpt">ChatGPT</option>
              <option value="generic">Other / Generic</option>
            </select>
          </label>
          <button id="run" class="run" type="submit">Extract Style</button>
        </form>
        <div id="status" class="status">Idle</div>
      </aside>
      <main>
        <div id="empty" class="empty">
          <div>
            <strong>Paste a site URL to start.</strong>
            <p class="lede">The app will inspect internal pages, render desktop/tablet/mobile, and assemble a style reference with exports.</p>
          </div>
        </div>
        <div id="result" class="result refero-layout">
          <div class="workspace">
            <div class="reference">
              <section class="panel reference-hero">
                <h3>Hero Capture</h3>
                <div id="hero"></div>
              </section>
              <header class="result-head">
                <div>
                  <p id="result-crumb" class="crumb">/ Styles / Style extraction</p>
                  <h2 id="result-title">Style extraction</h2>
                  <p id="result-meta"></p>
                </div>
                <div class="actions">
                  <a id="open-preview" href="#" target="_blank" rel="noreferrer">Preview</a>
                  <a id="open-design" href="#" target="_blank" rel="noreferrer">DESIGN.md</a>
                  <a id="open-evidence" href="#" target="_blank" rel="noreferrer">Evidence</a>
                </div>
              </header>
              <section class="panel style-summary">
                <h3>Style Thesis</h3>
                <p id="thesis" class="thesis"></p>
              </section>
              <section class="panel">
                <h3>Style Profile</h3>
                <div id="style-profile" class="profile-grid"></div>
              </section>
              <section class="panel">
                <h3>Color Palette</h3>
                <div id="color-categories" class="category-grid"></div>
                <div id="colors" class="swatch-grid"></div>
              </section>
              <section class="panel">
                <h3>Typography</h3>
                <p class="muted">Type Scale</p>
                <div id="type-scale" class="scale-list"></div>
                <p class="muted">Extracted Roles</p>
                <table class="dense-table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Font</th>
                      <th>Size / Weight</th>
                      <th>Line / Track</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody id="typography-body"></tbody>
                </table>
                <p class="muted">Fonts</p>
                <div id="font-cards" class="font-cards"></div>
              </section>
              <section class="panel">
                <h3>Spacing, Radius, Shadows</h3>
                <p class="muted">Spacing</p>
                <div id="spacing-body" class="visual-token-grid"></div>
                <p class="muted">Radius</p>
                <div id="radii-body" class="visual-token-grid"></div>
                <p class="muted">Shadows</p>
                <div id="shadows-body" class="visual-token-grid"></div>
                <p class="muted">Surfaces</p>
                <div id="surfaces-body" class="visual-token-grid"></div>
              </section>
              <section class="panel">
                <h3>Guidelines</h3>
                <div class="guidelines">
                  <div>
                    <h4>Do</h4>
                    <ul id="guidelines-do"></ul>
                  </div>
                  <div>
                    <h4>Watch Outs</h4>
                    <ul id="guidelines-dont"></ul>
                  </div>
                </div>
              </section>
              <section class="panel">
                <h3>Component Preview</h3>
                <div id="component-preview"></div>
              </section>
              <section class="panel">
                <h3>Components</h3>
                <div id="components" class="component-list"></div>
              </section>
              <section class="panel">
                <h3>Coverage</h3>
                <div class="split-list">
                  <div>
                    <p class="muted">Inspected Pages</p>
                    <ul id="pages" class="mono-list"></ul>
                  </div>
                  <div>
                    <p class="muted">Discovered Pages</p>
                    <ul id="discovered" class="mono-list"></ul>
                  </div>
                </div>
                <p class="muted">Warnings</p>
                <ul id="warnings" class="mono-list"></ul>
              </section>
            </div>
            <aside class="panel export-pane">
              <h3>Exports</h3>
              <div class="tabs" id="tabs">
                <button class="tab active" type="button" data-tab="design">DESIGN.md</button>
                <button class="tab" type="button" data-tab="css">CSS Variables</button>
                <button class="tab" type="button" data-tab="tailwind">Tailwind v4</button>
                <button class="tab" type="button" data-tab="json">JSON Tokens</button>
                <button class="tab" type="button" data-tab="prompt">AI Prompt</button>
              </div>
              <div class="export-actions">
                <div class="mode-tabs" aria-label="Preview length">
                  <button class="mode-btn" type="button" data-mode="compact">Compact</button>
                  <button class="mode-btn active" type="button" data-mode="extended">Extended</button>
                </div>
                <div class="export-tools">
                  <button id="copy-active" class="copy-btn" type="button">Copy</button>
                  <button id="download-active" class="download-btn" type="button">.md</button>
                  <button id="download-bundle-top" class="download-btn" type="button">Bundle</button>
                </div>
              </div>
              <p class="hint">Download and use with your selected assistant.</p>
              <div class="downloads">
                <button id="download-design" class="download-btn" type="button">Download DESIGN.md</button>
                <button id="download-css" class="download-btn" type="button">Download CSS Vars</button>
                <button id="download-tailwind" class="download-btn" type="button">Download Tailwind</button>
                <button id="download-json" class="download-btn" type="button">Download Tokens JSON</button>
                <button id="download-prompt" class="download-btn" type="button">Download AI Prompt</button>
                <button id="download-bundle" class="download-btn" type="button">Download Bundle</button>
              </div>
              <div id="tab-design" class="tab-panel active">
                <p class="export-note">Open full document: <a id="open-design-inline" href="#" target="_blank" rel="noreferrer">DESIGN.md</a></p>
                <pre id="design-excerpt" class="excerpt"></pre>
              </div>
              <div id="tab-css" class="tab-panel">
                <pre id="css-vars" class="code-block"></pre>
              </div>
              <div id="tab-tailwind" class="tab-panel">
                <pre id="tailwind-theme" class="code-block"></pre>
              </div>
              <div id="tab-json" class="tab-panel">
                <pre id="json-tokens" class="code-block"></pre>
              </div>
              <div id="tab-prompt" class="tab-panel">
                <pre id="ai-prompt" class="code-block"></pre>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
    <script>
      const form = document.getElementById('extract-form');
      const status = document.getElementById('status');
      const run = document.getElementById('run');
      const empty = document.getElementById('empty');
      const result = document.getElementById('result');
      const aiTarget = document.getElementById('ai-target');
      const downloadDesign = document.getElementById('download-design');
      const downloadCss = document.getElementById('download-css');
      const downloadTailwind = document.getElementById('download-tailwind');
      const downloadJson = document.getElementById('download-json');
      const downloadPrompt = document.getElementById('download-prompt');
      const downloadBundle = document.getElementById('download-bundle');
      const downloadActive = document.getElementById('download-active');
      const downloadBundleTop = document.getElementById('download-bundle-top');
      const copyActive = document.getElementById('copy-active');
      const modeButtons = Array.from(document.querySelectorAll('.mode-btn'));
      const aiTargetStorageKey = 'design-md-extractor.aiTarget';
      let latestExportData = null;
      let activeExportTab = 'design';
      let exportMode = 'extended';
      let currentHostname = 'Style extraction';
      let currentThesis = '';
      let currentTheme = null;

      if (aiTarget) {
        try {
          const storedTarget = window.localStorage.getItem(aiTargetStorageKey);
          if (storedTarget && Array.from(aiTarget.options).some((option) => option.value === storedTarget)) {
            aiTarget.value = storedTarget;
          }
        } catch {}

        aiTarget.addEventListener('change', () => {
          try {
            window.localStorage.setItem(aiTargetStorageKey, aiTarget.value);
          } catch {}
          if (latestExportData) {
            latestExportData.aiPrompt = buildAiPrompt(aiTarget.value, latestExportData);
            const promptTarget = document.getElementById('ai-prompt');
            if (promptTarget) {
              promptTarget.textContent = latestExportData.aiPrompt;
            }
          }
        });
      }

      const tabs = Array.from(document.querySelectorAll('.tab'));
      tabs.forEach((tabButton) => {
        tabButton.addEventListener('click', () => {
          const tab = tabButton.getAttribute('data-tab');
          activeExportTab = tab || 'design';
          tabs.forEach((button) => button.classList.toggle('active', button === tabButton));
          Array.from(document.querySelectorAll('.tab-panel')).forEach((panel) => {
            panel.classList.toggle('active', panel.id === 'tab-' + tab);
          });
          updateActiveDownloadLabel();
        });
      });

      modeButtons.forEach((button) => {
        button.addEventListener('click', () => {
          exportMode = button.getAttribute('data-mode') || 'extended';
          modeButtons.forEach((modeButton) => modeButton.classList.toggle('active', modeButton === button));
          updateDesignPreview();
        });
      });

      if (copyActive) {
        copyActive.addEventListener('click', async () => {
          const activePanel = document.querySelector('.tab-panel.active pre');
          if (!activePanel) return;
          await navigator.clipboard.writeText(activePanel.textContent || '');
          copyActive.textContent = 'Copied';
          window.setTimeout(() => {
            copyActive.textContent = 'Copy';
          }, 1200);
        });
      }

      function escapeHtml(value) {
        return String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function slug(value) {
        return String(value ?? '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 40) || 'token';
      }

      function confidenceRank(value) {
        if (value === 'high') return 3;
        if (value === 'medium') return 2;
        return 1;
      }

      function normalizeList(input) {
        return Array.isArray(input) ? input : [];
      }

      function safeColorValue(input) {
        const value = String(input ?? '').trim();
        if (!value) return '#d9ddd7';
        if (/^[#a-zA-Z0-9(),.%\\s+-]+$/.test(value)) return value;
        return '#d9ddd7';
      }

      function safeCssValue(input, fallback) {
        const value = String(input ?? '').trim();
        if (!value) return fallback;
        if (/[;{}<>]/.test(value)) return fallback;
        return value;
      }

      function cssTokenValue(input, fallback) {
        return safeCssValue(input, fallback)
          .replace(/3\\.35544e\\+07px/g, '999px')
          .replace(/calc\\([^)]*\\)/g, fallback);
      }

      function isTransparentColor(value) {
        const normalized = String(value || '').trim().toLowerCase();
        return !normalized || normalized === 'transparent' || normalized === 'rgba(0, 0, 0, 0)' || normalized === '#00000000';
      }

      function visibleComponentBackground(component, tokenData) {
        const styles = component && component.styles ? component.styles : {};
        if (styles.backgroundColor && !isTransparentColor(styles.backgroundColor)) {
          return cssTokenValue(styles.backgroundColor, '#ffffff');
        }
        if (currentTheme && currentTheme.surface) return currentTheme.surface;
        return selectCanvasColor(tokenData || {});
      }

      function visibleComponentBorder(component) {
        const styles = component && component.styles ? component.styles : {};
        const border = String(styles.border || '').trim();
        if (border) {
          return cssTokenValue(border, '1px solid rgba(0,0,0,0.18)');
        }
        return '0 solid transparent';
      }

      function readableComponentText(component, background) {
        const styles = component && component.styles ? component.styles : {};
        const color = cssTokenValue(styles.color, '');
        if (color && Math.abs(colorLuminance(color) - colorLuminance(background)) >= 0.18) {
          return color;
        }
        return contrastTextColor(background);
      }

      function styleForComponent(component) {
        const styles = component && component.styles ? component.styles : {};
        const bounds = component && component.bounds ? component.bounds : {};
        const minWidth = bounds.width ? Math.min(Math.max(Number(bounds.width), 36), 220) + 'px' : '36px';
        const minHeight = bounds.height ? Math.min(Math.max(Number(bounds.height), 28), 72) + 'px' : '28px';
        return [
          'color:' + cssTokenValue(styles.color, 'inherit'),
          'background:' + cssTokenValue(styles.backgroundColor, 'transparent'),
          'border:' + cssTokenValue(styles.border, '1px solid currentColor'),
          'border-radius:' + cssTokenValue(styles.borderRadius, '0px'),
          'padding:' + cssTokenValue(styles.padding, '8px 12px'),
          'font-family:' + cssTokenValue(styles.fontFamily, 'inherit'),
          'font-size:' + cssTokenValue(styles.fontSize, '13px'),
          'font-weight:' + cssTokenValue(styles.fontWeight, '500'),
          'box-shadow:' + cssTokenValue(styles.boxShadow, 'none'),
          'min-width:' + minWidth,
          'min-height:' + minHeight,
        ].join(';');
      }

      function specimenStyleForComponent(component, tokenData) {
        const styles = component && component.styles ? component.styles : {};
        const bounds = component && component.bounds ? component.bounds : {};
        const kind = String(component && component.kind ? component.kind : '').toLowerCase();
        const isButton = kind === 'button' || kind === 'link';
        const rawWidth = Number(bounds.width || 0);
        const rawHeight = Number(bounds.height || 0);
        const width = rawWidth ? Math.min(Math.max(rawWidth, isButton ? 92 : 128), isButton ? 260 : 360) + 'px' : isButton ? 'auto' : '190px';
        const height = rawHeight ? Math.min(Math.max(rawHeight, isButton ? 36 : 72), isButton ? 72 : 210) + 'px' : isButton ? '38px' : '110px';
        const promotesColorToBackground =
          isButton &&
          (!styles.backgroundColor || isTransparentColor(styles.backgroundColor)) &&
          styles.color &&
          !isTransparentColor(styles.color);
        const background = promotesColorToBackground ? cssTokenValue(styles.color, '#111111') : visibleComponentBackground(component, tokenData);
        const textColor = promotesColorToBackground ? contrastTextColor(background) : readableComponentText(component, background);
        const paddingFallback = isButton ? '8px 12px' : '16px';
        const sizeRules = isButton
          ? ['min-width:' + width, 'min-height:' + height]
          : ['width:' + width, 'min-height:' + height];
        return [
          'color:' + textColor,
          'background:' + background,
          'border:' + visibleComponentBorder(component),
          'border-radius:' + cssTokenValue(styles.borderRadius, '0px'),
          'padding:' + cssTokenValue(styles.padding, paddingFallback),
          'font-family:' + cssTokenValue(styles.fontFamily, 'inherit'),
          'font-size:' + cssTokenValue(styles.fontSize, '13px'),
          'font-weight:' + cssTokenValue(styles.fontWeight, '500'),
          'box-shadow:' + cssTokenValue(styles.boxShadow, 'none'),
          ...sizeRules,
        ].join(';');
      }

      function cleanComponentLabel(component, fallback) {
        const kind = String(component && component.kind ? component.kind : 'component').toLowerCase();
        const raw = String(component && component.textSample ? component.textSample : '').replace(/\\s+/g, ' ').trim();
        const hasReadableSpacing = /\\s/.test(raw);
        const looksLikeMergedCopy = raw.length > 18 && !hasReadableSpacing;
        const hasSuspiciousWord = raw.split(/\\s+/).some((word) => word.length > 14);
        if (!raw || looksLikeMergedCopy || hasSuspiciousWord) {
          return fallback || component?.name || (kind.charAt(0).toUpperCase() + kind.slice(1));
        }
        return raw.slice(0, 72);
      }

      function componentArea(component) {
        const bounds = component && component.bounds ? component.bounds : {};
        return Math.max(0, Number(bounds.width || 0)) * Math.max(0, Number(bounds.height || 0));
      }

      function componentPreviewScore(component) {
        const kind = String(component && component.kind ? component.kind : '').toLowerCase();
        const styles = component && component.styles ? component.styles : {};
        const area = componentArea(component);
        const hasText = Boolean(String(component && component.textSample ? component.textSample : '').trim());
        const kindBonus = kind === 'button' || kind === 'navigation' || kind === 'card' ? 20 : 8;
        const visibleStyleBonus =
          (styles.backgroundColor && !isTransparentColor(styles.backgroundColor) ? 10 : 0) +
          (styles.color && !isTransparentColor(styles.color) ? 6 : 0) +
          (styles.borderRadius && styles.borderRadius !== '0px' ? 5 : 0) +
          (styles.padding && styles.padding !== '0px' ? 4 : 0);
        return kindBonus + visibleStyleBonus + (hasText ? 8 : 0) + Math.min(area / 12000, 10);
      }

      function pickPreviewComponents(components) {
        const ranked = normalizeList(components)
          .filter((component) => component && component.styles)
          .slice()
          .sort((a, b) => componentPreviewScore(b) - componentPreviewScore(a));
        const chosen = [];
        const seenKinds = new Set();
        ranked.forEach((component) => {
          const kind = String(component.kind || component.name || 'component').toLowerCase();
          if (chosen.length < 4 && !seenKinds.has(kind)) {
            chosen.push(component);
            seenKinds.add(kind);
          }
        });
        ranked.forEach((component) => {
          if (chosen.length < 4 && !chosen.includes(component)) chosen.push(component);
        });
        return chosen.slice(0, 4);
      }

      function colorToRgb(value) {
        const color = String(value || '').trim().toLowerCase();
        if (color.startsWith('#')) {
          const hex = color.slice(1);
          if (hex.length === 3) {
            return [
              Number.parseInt(hex[0] + hex[0], 16),
              Number.parseInt(hex[1] + hex[1], 16),
              Number.parseInt(hex[2] + hex[2], 16),
            ];
          }
          if (hex.length === 6) {
            return [
              Number.parseInt(hex.slice(0, 2), 16),
              Number.parseInt(hex.slice(2, 4), 16),
              Number.parseInt(hex.slice(4, 6), 16),
            ];
          }
        }
        const match = color.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
        if (match) {
          return [Number(match[1]), Number(match[2]), Number(match[3])];
        }
        return null;
      }

      function colorLuminance(value) {
        const rgb = colorToRgb(value);
        if (!rgb) return 0.8;
        return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
      }

      function colorSaturation(value) {
        const rgb = colorToRgb(value);
        if (!rgb) return 0;
        const max = Math.max(rgb[0], rgb[1], rgb[2]) / 255;
        const min = Math.min(rgb[0], rgb[1], rgb[2]) / 255;
        if (max === min) return 0;
        const lightness = (max + min) / 2;
        return (max - min) / (1 - Math.abs(2 * lightness - 1));
      }

      function numericPx(value) {
        const match = String(value || '').match(/([\\d.]+)/);
        return match ? Number.parseFloat(match[1]) : 0;
      }

      function contrastTextColor(background) {
        return colorLuminance(background) > 0.62 ? '#141715' : '#f4f6f4';
      }

      function pickReadableTextColor(colors, background) {
        const bgLum = colorLuminance(background);
        const ranked = normalizeList(colors)
          .map((color) => safeColorValue(color && color.value ? color.value : ''))
          .filter(Boolean)
          .map((value) => ({
            value,
            delta: Math.abs(colorLuminance(value) - bgLum),
            saturation: colorSaturation(value),
          }))
          .sort((a, b) => b.delta - a.delta || a.saturation - b.saturation);
        const readable = ranked.find((item) => item.delta >= 0.34);
        return readable ? readable.value : contrastTextColor(background);
      }

      function uniqueColorValues(items) {
        const seen = new Set();
        return normalizeList(items)
          .map((item) => safeColorValue(item && item.value ? item.value : item))
          .filter((value) => {
            if (!colorToRgb(value) || isTransparentColor(value)) return false;
            const key = value.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
      }

      function blendColor(value, target, amount) {
        const rgb = colorToRgb(value);
        if (!rgb) return value;
        const mixed = rgb.map((part, index) => Math.round(part * (1 - amount) + target[index] * amount));
        return 'rgb(' + mixed.join(', ') + ')';
      }

      function alphaColor(value, alpha) {
        const rgb = colorToRgb(value);
        if (!rgb) return 'rgba(0, 0, 0, ' + alpha + ')';
        return 'rgba(' + rgb.join(', ') + ', ' + alpha + ')';
      }

      function confidenceScore(value) {
        if (value === 'high') return 3;
        if (value === 'medium') return 2;
        return 1;
      }

      function sourceWords(source) {
        return [
          source && source.name,
          source && source.role,
          source && source.purpose,
          ...(normalizeList(source && source.sampleSelectors)),
        ]
          .join(' ')
          .toLowerCase();
      }

      function tokenSourceForValue(value, sources) {
        return normalizeList(sources).find((source) => safeColorValue(source && source.value).toLowerCase() === String(value).toLowerCase()) || {};
      }

      function selectCanvasColor(tokenData) {
        const sources = [...normalizeList(tokenData.surfaces), ...normalizeList(tokenData.colors)];
        const candidates = uniqueColorValues(sources);
        if (!candidates.length) return '#ffffff';
        const ranked = candidates
          .map((value) => {
            const source = tokenSourceForValue(value, sources);
            const words = sourceWords(source);
            const properties = normalizeList(source.properties);
            const saturation = colorSaturation(value);
            const luminance = colorLuminance(value);
            const roleHit = /canvas|background|surface|page|body|stage|base/.test(words) ? 8 : 0;
            const selectorHit = /(^|[\\s>#.])(body|html|stage)([\\s>#.]|$)/.test(words) ? 8 : 0;
            const backgroundHit = properties.includes('backgroundColor') ? 5 : 0;
            const levelBonus = Number.isFinite(Number(source.level)) ? Math.max(0, 4 - Number(source.level)) : 0;
            const saturationPenalty = saturation > 0.35 ? saturation * 18 : saturation * 2;
            const utilityPenalty = /cursor|svg|icon|badge/.test(words) && !/body|stage/.test(words) ? 6 : 0;
            return {
              value,
              score:
                confidenceScore(source.confidence) * 3 +
                roleHit +
                selectorHit +
                backgroundHit +
                levelBonus -
                saturationPenalty -
                utilityPenalty +
                (luminance > 0.08 && luminance < 0.96 ? 2 : 0),
            };
          })
          .sort((a, b) => b.score - a.score)[0];
        return ranked.value;
      }

      function selectAccentColor(tokenData, canvas) {
        const sources = normalizeList(tokenData.colors || []);
        const candidates = uniqueColorValues(sources);
        const canvasLum = colorLuminance(canvas);
        const accent = candidates
          .map((value) => {
            const source = tokenSourceForValue(value, sources);
            const normalized = String(value).toLowerCase();
            const properties = normalizeList(source.properties);
            const isBrowserDefaultBlue = normalized === '#0000ee' || normalized === '#0000ff' || normalized === 'rgb(0, 0, 238)' || normalized === 'blue';
            const words = sourceWords(source);
            return {
              value,
              saturation: colorSaturation(value),
              delta: Math.abs(colorLuminance(value) - canvasLum),
              frequency: Number(source.frequency || 0),
              roleBonus: /accent|brand|primary|action|button|link|text|foreground/.test(words) || properties.includes('color') || properties.includes('borderColor') ? 1 : 0,
              browserPenalty: isBrowserDefaultBlue ? 10 : 0,
            };
          })
          .filter((item) => item.saturation > 0.28 && item.delta > 0.08 && item.browserPenalty < 10)
          .sort((a, b) => b.roleBonus - a.roleBonus || b.frequency - a.frequency || b.saturation - a.saturation || b.delta - a.delta)[0];
        return (accent || { value: candidates[0] || '#3a5446' }).value;
      }

      function selectTextColor(tokenData, canvas) {
        const sources = normalizeList(tokenData.colors || []);
        const candidates = uniqueColorValues(sources);
        const roleMatch = candidates
          .map((value) => {
            const source = tokenSourceForValue(value, sources);
            const words = sourceWords(source);
            return { value, source, words, delta: Math.abs(colorLuminance(value) - colorLuminance(canvas)) };
          })
          .filter((item) => /text|foreground|heading|body|copy|ink|black/.test(item.words) && item.delta >= 0.34)
          .sort((a, b) => confidenceScore(b.source.confidence) - confidenceScore(a.source.confidence) || b.delta - a.delta)[0];
        if (roleMatch) return roleMatch.value;
        const readable = pickReadableTextColor(
          candidates.map((value) => ({ value })),
          canvas
        );
        return readable || contrastTextColor(canvas);
      }

      function themeFontFamilies(tokenData) {
        const typography = normalizeList(tokenData.typography);
        const valid = typography.filter((item) => {
          const family = String(item.fontFamily || '');
          const size = numericPx(item.fontSize);
          const lineHeight = numericPx(item.lineHeight);
          return family && !/icon|symbol|material/i.test(family) && size > 0 && (lineHeight > 0 || String(item.lineHeight || '').toLowerCase() === 'normal');
        });
        const bodyMatch = valid.find((item) => /body|copy|paragraph|text|p\\b/.test(String(item.role || '').toLowerCase()) && numericPx(item.fontSize) <= 22);
        const displayMatch = valid
          .slice()
          .filter((item) => /heading|display|title|hero|h1/.test(sourceWords(item)) || numericPx(item.fontSize) > 32)
          .sort((a, b) => numericPx(b.fontSize) - numericPx(a.fontSize))[0];
        const body =
          bodyMatch?.fontFamily ||
          valid.find((item) => numericPx(item.fontSize) <= 22)?.fontFamily ||
          valid[0]?.fontFamily ||
          '"Helvetica Neue", Arial, sans-serif';
        const display = displayMatch?.fontFamily || body;
        return { body, display };
      }

      function firstTokenValue(rows, fallback) {
        const row = normalizeList(rows).find((item) => item && item.value);
        return row ? cssTokenValue(row.value, fallback) : fallback;
      }

      function firstComponentStyle(tokenData, key, fallback) {
        const component = normalizeList(tokenData.components).find((item) => item && item.styles && item.styles[key]);
        return component ? cssTokenValue(component.styles[key], fallback) : fallback;
      }

      function scalarPxFromValue(value, fallback) {
        const matches = String(value || '').match(/[\\d.]+px/g) || [];
        const candidates = matches
          .map((part) => Number.parseFloat(part))
          .filter((part) => Number.isFinite(part) && part > 0 && part <= 28)
          .sort((a, b) => a - b);
        return candidates.length ? candidates[0] + 'px' : fallback;
      }

      function selectThemeSpacing(tokenData) {
        const rows = normalizeList(tokenData.spacing);
        const direct = rows.find((item) => /^\\d+(\\.\\d+)?px$/.test(String(item && item.value ? item.value : '').trim()) && numericPx(item.value) > 0 && numericPx(item.value) <= 28);
        if (direct) return cssTokenValue(direct.value, '12px');
        const composite = rows.find((item) => scalarPxFromValue(item && item.value, ''));
        return composite ? scalarPxFromValue(composite.value, '12px') : '12px';
      }

      function parseBorderWidth(border) {
        const match = String(border || '').match(/([\\d.]+)px/);
        return match ? Number.parseFloat(match[1]) : 0;
      }

      function isRealBorder(styles) {
        const border = String(styles && styles.border ? styles.border : '').toLowerCase();
        const borderStyle = String(styles && styles.borderStyle ? styles.borderStyle : '').toLowerCase();
        const width = parseBorderWidth(styles && (styles.borderWidth || styles.border));
        if (border.includes('none') || borderStyle === 'none') return false;
        return width > 0;
      }

      function selectBorderTheme(tokenData, text, canvas) {
        const components = normalizeList(tokenData.components).filter((item) => item && item.styles);
        const realBorders = components.filter((item) => isRealBorder(item.styles));
        const noBorderRatio = components.length ? (components.length - realBorders.length) / components.length : 0;
        if (components.length && noBorderRatio >= 0.62) {
          return { color: 'transparent', width: '0px', style: 'none', frameShadow: 'none' };
        }
        const borderColor =
          realBorders.map((item) => item.styles.borderColor || '').find((value) => value && !isTransparentColor(value)) ||
          alphaColor(text, colorLuminance(canvas) > 0.55 ? 0.18 : 0.24);
        return { color: cssTokenValue(borderColor, alphaColor(text, 0.18)), width: '1px', style: 'solid', frameShadow: 'inset 0 0 0 1px ' + cssTokenValue(borderColor, alphaColor(text, 0.18)) };
      }

      function selectSurfaceRadius(tokenData) {
        const layoutComponents = normalizeList(tokenData.components).filter((component) => {
          const kind = String(component && component.kind ? component.kind : '').toLowerCase();
          const bounds = component && component.bounds ? component.bounds : {};
          const area = Number(bounds.width || 0) * Number(bounds.height || 0);
          return component && component.styles && (/card|navigation|header|section|container/.test(kind) || area > 24000);
        });
        const counts = new Map();
        layoutComponents.forEach((component) => {
          const value = cssTokenValue(component.styles.borderRadius, '');
          if (!value || value.includes('%') || numericPx(value) > 48) return;
          counts.set(value, (counts.get(value) || 0) + 1);
        });
        const dominant = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
        if (dominant) return dominant[0];
        const token = normalizeList(tokenData.radii).find((item) => {
          const value = String(item && item.value ? item.value : '');
          return value && !value.includes('%') && numericPx(value) <= 32;
        });
        return token ? cssTokenValue(token.value, '8px') : '8px';
      }

      function selectThemeShadow(tokenData) {
        const shadows = normalizeList(tokenData.shadows).filter((item) => item && item.value && String(item.value).toLowerCase() !== 'none');
        if (shadows.length) return cssTokenValue(shadows[0].value, 'none');
        const components = normalizeList(tokenData.components).filter((item) => item && item.styles);
        const realShadow = components.find((item) => item.styles.boxShadow && String(item.styles.boxShadow).toLowerCase() !== 'none');
        return realShadow ? cssTokenValue(realShadow.styles.boxShadow, 'none') : 'none';
      }

      function themeTypographyDetails(tokenData, fonts) {
        const typography = normalizeList(tokenData.typography);
        const display = typography
          .slice()
          .filter((item) => item && item.fontFamily === fonts.display)
          .sort((a, b) => numericPx(b.fontSize) - numericPx(a.fontSize))[0] || typography.slice().sort((a, b) => numericPx(b.fontSize) - numericPx(a.fontSize))[0] || {};
        const size = numericPx(display.fontSize);
        return {
          displaySize: (size ? Math.max(38, Math.min(size, 82)) : 72) + 'px',
          displayWeight: cssTokenValue(display.fontWeight, '700'),
          displayLine: cssTokenValue(display.lineHeight, '0.92'),
        };
      }

      function applyExtractedTheme(tokenData) {
        if (!result) return;
        const canvas = selectCanvasColor(tokenData);
        const text = selectTextColor(tokenData, canvas);
        const accent = selectAccentColor(tokenData, canvas);
        const accentText = contrastTextColor(accent);
        const isLight = colorLuminance(canvas) > 0.55;
        const surface = canvas;
        const card = surface;
        const code = isLight ? blendColor(canvas, [255, 255, 255], 0.14) : blendColor(canvas, [0, 0, 0], 0.18);
        const muted = blendColor(text, colorToRgb(canvas) || [255, 255, 255], 0.42);
        const borderTheme = selectBorderTheme(tokenData, text, canvas);
        const radius = selectSurfaceRadius(tokenData);
        const shadow = selectThemeShadow(tokenData);
        const space = selectThemeSpacing(tokenData);
        const sectionSpace = Math.max(24, Math.min((numericPx(space) || 12) * 3, 48)) + 'px';
        const fonts = themeFontFamilies(tokenData);
        const type = themeTypographyDetails(tokenData, fonts);
        currentTheme = { canvas, surface, card, code, text, muted, accent, border: borderTheme.color, radius, shadow, fonts };

        result.classList.add('site-themed');
        document.body.classList.add('site-themed-ui');
        const vars = {
          '--site-canvas': canvas,
          '--site-surface': surface,
          '--site-card': card,
          '--site-code': code,
          '--site-text': text,
          '--site-muted': muted,
          '--site-accent': accent,
          '--site-accent-text': accentText,
          '--site-border': borderTheme.color,
          '--site-border-width': borderTheme.width,
          '--site-border-style': borderTheme.style,
          '--site-radius': radius,
          '--site-shadow': shadow,
          '--site-frame-shadow': borderTheme.frameShadow,
          '--site-space': space,
          '--site-section-space': sectionSpace,
          '--site-font-body': safeCssValue(fonts.body, '"Helvetica Neue", Arial, sans-serif'),
          '--site-font-display': safeCssValue(fonts.display, safeCssValue(fonts.body, '"Helvetica Neue", Arial, sans-serif')),
          '--site-display-size': type.displaySize,
          '--site-display-weight': type.displayWeight,
          '--site-display-line': type.displayLine,
        };
        Object.entries(vars).forEach(([name, value]) => {
          result.style.setProperty(name, value);
          document.documentElement.style.setProperty(name, value);
        });
      }

      function clampSpecimenSize(fontSize) {
        const px = numericPx(fontSize);
        if (!px || !Number.isFinite(px)) return '18px';
        return Math.max(12, Math.min(px, 74)) + 'px';
      }

      function typeSpecimenCopy(item) {
        const role = String(item && item.role ? item.role : '').toLowerCase();
        const size = numericPx(item && item.fontSize ? item.fontSize : '');
        if (size > 32 || role.includes('heading') || role.includes('display') || role.includes('title')) {
          return 'THE QUICK BROWN FOX JUMPS';
        }
        if (role.includes('link') || role.includes('nav')) {
          return 'Studio Projects About Contact';
        }
        if (role.includes('button')) {
          return 'Primary Action';
        }
        return 'The quick brown fox jumps over a precise interface.';
      }

      function clampPaddingValue(value) {
        return String(value || '')
          .split(/\\s+/)
          .filter(Boolean)
          .slice(0, 4)
          .map((part) => {
            const match = part.match(/^([\\d.]+)px$/);
            if (!match) return part;
            return Math.min(Number.parseFloat(match[1]), 48) + 'px';
          })
          .join(' ') || '0px';
      }

      function toneLabel(colors) {
        const list = normalizeList(colors);
        if (!list.length) return 'Mixed';
        const avg = list.slice(0, 4).reduce((sum, color) => sum + colorLuminance(color.value), 0) / Math.min(4, list.length);
        if (avg < 0.35) return 'Dark';
        if (avg > 0.65) return 'Light';
        return 'Balanced';
      }

      function selectAccentColors(colors) {
        return normalizeList(colors)
          .filter((color) => colorSaturation(color.value) >= 0.42)
          .slice(0, 2);
      }

      function colorCategorySummary(colors) {
        const list = normalizeList(colors);
        const accents = selectAccentColors(list);
        const neutrals = list.filter((color) => colorSaturation(color.value) < 0.2).slice(0, 3);
        return {
          brand: list[0] ? [list[0]] : [],
          accents,
          neutrals,
        };
      }

      function selectHeroShot(shots, preferredHref) {
        const all = normalizeList(shots);
        if (preferredHref) {
          const preferred = all.find((shot) => shot.href === preferredHref);
          if (preferred) return preferred;
        }
        return all.find((shot) => shot.viewport === 'desktop') || all[0] || null;
      }

      function renderRows(id, rows, mapRow, emptyText) {
        const target = document.getElementById(id);
        if (!target) return;
        if (!rows.length) {
          target.innerHTML = '<tr><td class="muted">' + escapeHtml(emptyText) + '</td></tr>';
          return;
        }
        target.innerHTML = rows.map(mapRow).join('');
      }

      function setList(id, rows, mapRow, emptyText) {
        const target = document.getElementById(id);
        if (!target) return;
        target.innerHTML = rows.length ? rows.map(mapRow).join('') : '<li>' + escapeHtml(emptyText) + '</li>';
      }

      function firstNonEmpty(lines) {
        return normalizeList(lines).find((line) => String(line || '').trim().length > 0) || '';
      }

      function aiTargetLabel(target) {
        if (target === 'codex') return 'Codex';
        if (target === 'claude') return 'Claude';
        if (target === 'chatgpt') return 'ChatGPT';
        return 'Generic Assistant';
      }

      function createThesis(data, evidence, tokenData) {
        if (data && data.summary && typeof data.summary.styleThesis === 'string' && data.summary.styleThesis.trim()) {
          return data.summary.styleThesis.trim();
        }
        const layoutDensity = evidence && evidence.layout && evidence.layout.density ? evidence.layout.density : 'balanced';
        const imagery = evidence && evidence.imagery && evidence.imagery.strategy ? evidence.imagery.strategy : 'mixed visual strategy';
        const pageCount = normalizeList(data.summary.pages).length;
        const colorCount = tokenData.colors.length;
        const typographyCount = tokenData.typography.length;
        return 'This style reads as ' + layoutDensity + ' density, with ' + colorCount + ' primary color tokens, ' + typographyCount + ' typography tokens, and a ' + imagery + ' approach across ' + pageCount + ' inspected page(s).';
      }

      function renderStyleProfile(data, tokenData, evidence) {
        const target = document.getElementById('style-profile');
        if (!target) return;
        const pages = normalizeList(data.summary.pages);
        const accents = selectAccentColors(tokenData.colors);
        const theme = toneLabel(tokenData.surfaces.length ? tokenData.surfaces : tokenData.colors);
        const topFont = tokenData.typography[0] ? tokenData.typography[0].fontFamily : 'Unknown';
        const imagery = evidence && evidence.imagery && evidence.imagery.strategy ? evidence.imagery.strategy : 'unknown';

        const cards = [
          [
            '<article class="profile-card">',
            '<h4>Theme</h4>',
            '<p>' + escapeHtml(theme) + ' tone with ' + escapeHtml(String(accents.length)) + ' accent signal(s).</p>',
            '</article>',
          ].join(''),
          [
            '<article class="profile-card">',
            '<h4>Coverage</h4>',
            '<p>' + escapeHtml(String(pages.length)) + ' pages inspected across ' + escapeHtml(String(normalizeList(data.summary.screenshots).length)) + ' screenshots.</p>',
            '</article>',
          ].join(''),
          [
            '<article class="profile-card">',
            '<h4>Typography Lead</h4>',
            '<p>' + escapeHtml(topFont) + '</p>',
            '</article>',
          ].join(''),
          [
            '<article class="profile-card">',
            '<h4>Imagery Strategy</h4>',
            '<p>' + escapeHtml(String(imagery)) + '</p>',
            '</article>',
          ].join(''),
        ];

        const pills = [
          '<div class="token-pills">',
          '<span class="token-pill">Colors ' + escapeHtml(String(tokenData.colors.length)) + '</span>',
          '<span class="token-pill">Typography ' + escapeHtml(String(tokenData.typography.length)) + '</span>',
          '<span class="token-pill">Components ' + escapeHtml(String(tokenData.components.length)) + '</span>',
          '</div>',
        ].join('');

        target.innerHTML = cards.join('') + pills;
      }

      function buildGuidelines(data, tokenData) {
        const pages = normalizeList(data.summary.pages);
        const successCount = pages.filter((page) => page.status === 'success').length;
        const failureCount = pages.length - successCount;
        const warnings = normalizeList(data.summary.warnings);
        const componentKinds = new Set(normalizeList(data.summary.components).map((component) => component.kind).filter(Boolean));
        const frequentColor = tokenData.colors[0];
        const fontFamilies = Array.from(new Set(tokenData.typography.map((item) => item.fontFamily).filter(Boolean)));

        const doRules = [
          'Use the top color tokens as semantic roles before adding new hues.',
          'Preserve the dominant font family stack: ' + (firstNonEmpty(fontFamilies) || 'not enough evidence') + '.',
          'Match interaction patterns from ' + componentKinds.size + ' detected component types.',
          'Validate style decisions on desktop, tablet, and mobile screenshots.'
        ];

        if (frequentColor && frequentColor.value) {
          doRules[0] = 'Anchor UI hierarchy around ' + frequentColor.value + ' as a recurring high-signal color.';
        }

        const dontRules = [
          'Do not treat single-page evidence as a complete brand system.',
          'Avoid adding decorative styles that conflict with detected spacing and radius tokens.',
          'Do not ignore low-confidence tokens without screenshot verification.',
        ];

        if (failureCount > 0) {
          dontRules[0] = 'Do not finalize a style system before resolving ' + failureCount + ' failed page capture(s).';
        }

        if (successCount <= 1) {
          dontRules.push('Avoid overfitting to one hero state when multi-page coverage is limited.');
        }
        if (warnings.length > 0) {
          dontRules.push('Resolve extraction warnings before locking final style decisions.');
        }

        return { doRules, dontRules };
      }

      function extractDesignExcerpt(designMd, thesis, data) {
        const text = String(designMd || '').trim();
        if (!text) {
          return [
            '# Style Reference',
            '',
            'Site: ' + data.url,
            'Run: ' + data.runId,
            '',
            thesis,
          ].join('\\n');
        }
        const lines = text
          .split('\\n')
          .filter((line) => line.trim().length > 0 && !line.startsWith('|') && !line.startsWith('---'))
          .slice(0, 14);
        return lines.join('\\n');
      }

      function updateDesignPreview() {
        const target = document.getElementById('design-excerpt');
        if (!target || !latestExportData) return;
        target.textContent =
          exportMode === 'compact'
            ? latestExportData.designExcerpt
            : latestExportData.designMd || latestExportData.designExcerpt;
      }

      function buildAiPrompt(target, exportData) {
        const site = exportData && exportData.url ? exportData.url : '';
        const thesis = exportData && exportData.thesis ? exportData.thesis : '';
        const cssVars = exportData && exportData.cssVars ? exportData.cssVars : '';
        const tailwind = exportData && exportData.tailwindTheme ? exportData.tailwindTheme : '';
        const tokens = exportData && exportData.jsonTokens ? exportData.jsonTokens : '';
        const assistant = aiTargetLabel(target);

        return [
          'Assistant: ' + assistant,
          'Task: Recreate and extend the target website style in a production UI.',
          '',
          'Source Site',
          site,
          '',
          'Style Thesis',
          thesis,
          '',
          'Instructions',
          '1. Keep the visual tone, hierarchy, and spacing rhythm faithful to the thesis.',
          '2. Use the provided token outputs as the source of truth.',
          '3. Build accessible UI with clear contrast and responsive layouts.',
          '4. Do not add colors or fonts not present in the token set unless explicitly noted.',
          '5. Return implementation-ready code and call out any assumptions.',
          '',
          'CSS Variables',
          cssVars,
          '',
          'Tailwind v4 Theme',
          tailwind,
          '',
          'JSON Tokens',
          tokens,
        ].join('\\n');
      }

      function downloadText(filename, content, mimeType) {
        const blob = new Blob([String(content || '')], { type: mimeType || 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      }

      function activeDownloadPayload() {
        if (!latestExportData) return null;
        if (activeExportTab === 'css') {
          return {
            filename: 'style-variables.css',
            content: latestExportData.cssVars,
            mimeType: 'text/css;charset=utf-8',
            label: '.css',
          };
        }
        if (activeExportTab === 'tailwind') {
          return {
            filename: 'tailwind-theme.css',
            content: latestExportData.tailwindTheme,
            mimeType: 'text/css;charset=utf-8',
            label: '.css',
          };
        }
        if (activeExportTab === 'json') {
          return {
            filename: 'design-tokens.json',
            content: latestExportData.jsonTokens,
            mimeType: 'application/json;charset=utf-8',
            label: '.json',
          };
        }
        if (activeExportTab === 'prompt') {
          return {
            filename: 'ai-prompt.txt',
            content: latestExportData.aiPrompt,
            mimeType: 'text/plain;charset=utf-8',
            label: '.txt',
          };
        }
        return {
          filename: 'DESIGN.md',
          content: latestExportData.designMd,
          mimeType: 'text/markdown;charset=utf-8',
          label: '.md',
        };
      }

      function updateActiveDownloadLabel() {
        if (!downloadActive) return;
        const payload = activeDownloadPayload();
        downloadActive.textContent = payload ? payload.label : '.md';
      }

      function attachDownloadHandlers() {
        const downloadBundleFile = () => {
          if (!latestExportData) return;
          const bundle = {
            metadata: {
              runId: latestExportData.runId,
              url: latestExportData.url,
              aiTarget: latestExportData.aiTarget,
              exportedAt: new Date().toISOString(),
            },
            files: {
              'DESIGN.md': latestExportData.designMd,
              'style-variables.css': latestExportData.cssVars,
              'tailwind-theme.css': latestExportData.tailwindTheme,
              'design-tokens.json': latestExportData.jsonTokens,
              'ai-prompt.txt': latestExportData.aiPrompt,
            },
          };
          downloadText('style-bundle.json', JSON.stringify(bundle, null, 2), 'application/json;charset=utf-8');
        };

        if (downloadActive) {
          downloadActive.addEventListener('click', () => {
            const payload = activeDownloadPayload();
            if (!payload) return;
            downloadText(payload.filename, payload.content, payload.mimeType);
          });
        }

        if (downloadBundleTop) {
          downloadBundleTop.addEventListener('click', downloadBundleFile);
        }

        if (downloadDesign) {
          downloadDesign.addEventListener('click', () => {
            if (!latestExportData) return;
            downloadText('DESIGN.md', latestExportData.designMd, 'text/markdown;charset=utf-8');
          });
        }

        if (downloadCss) {
          downloadCss.addEventListener('click', () => {
            if (!latestExportData) return;
            downloadText('style-variables.css', latestExportData.cssVars, 'text/css;charset=utf-8');
          });
        }

        if (downloadTailwind) {
          downloadTailwind.addEventListener('click', () => {
            if (!latestExportData) return;
            downloadText('tailwind-theme.css', latestExportData.tailwindTheme, 'text/css;charset=utf-8');
          });
        }

        if (downloadJson) {
          downloadJson.addEventListener('click', () => {
            if (!latestExportData) return;
            downloadText('design-tokens.json', latestExportData.jsonTokens, 'application/json;charset=utf-8');
          });
        }

        if (downloadPrompt) {
          downloadPrompt.addEventListener('click', () => {
            if (!latestExportData) return;
            downloadText('ai-prompt.txt', latestExportData.aiPrompt, 'text/plain;charset=utf-8');
          });
        }

        if (downloadBundle) {
          downloadBundle.addEventListener('click', () => {
            downloadBundleFile();
          });
        }
      }

      function buildTokenData(data, evidence) {
        const summary = data.summary || {};
        const evidenceTokens = evidence && evidence.tokens ? evidence.tokens : {};
        const summaryTokens = {
          colors: normalizeList(summary.colors),
          typography: normalizeList(summary.typography),
          spacing: normalizeList(summary.spacing),
          radii: normalizeList(summary.radii),
          shadows: normalizeList(summary.shadows),
          surfaces: normalizeList(summary.surfaces),
        };

        return {
          colors: normalizeList(evidenceTokens.colors && evidenceTokens.colors.length ? evidenceTokens.colors : summaryTokens.colors).slice(0, 18),
          typography: normalizeList(evidenceTokens.typography && evidenceTokens.typography.length ? evidenceTokens.typography : summaryTokens.typography).slice(0, 14),
          spacing: normalizeList(evidenceTokens.spacing && evidenceTokens.spacing.length ? evidenceTokens.spacing : summaryTokens.spacing).slice(0, 8),
          radii: normalizeList(evidenceTokens.radii && evidenceTokens.radii.length ? evidenceTokens.radii : summaryTokens.radii).slice(0, 8),
          shadows: normalizeList(evidenceTokens.shadows && evidenceTokens.shadows.length ? evidenceTokens.shadows : summaryTokens.shadows).slice(0, 8),
          surfaces: normalizeList(evidence && evidence.surfaces && evidence.surfaces.length ? evidence.surfaces : summaryTokens.surfaces).slice(0, 8),
          components: normalizeList(evidence && evidence.components && evidence.components.length ? evidence.components : summary.components).slice(0, 12),
        };
      }

      function colorVarName(color, index) {
        const fromEvidence = color && color.cssVariable ? String(color.cssVariable) : '';
        if (fromEvidence.startsWith('--')) return fromEvidence;
        if (fromEvidence) return '--' + slug(fromEvidence);
        return '--color-' + slug(color && color.name ? color.name : 'color-' + (index + 1));
      }

      function buildCssVariables(tokenData) {
        const lines = [':root {'];
        tokenData.colors.forEach((color, index) => {
          lines.push('  ' + colorVarName(color, index) + ': ' + (color.value || '#000000') + ';');
        });

        const uniqueFonts = [];
        const seenFonts = new Set();
        tokenData.typography.forEach((item) => {
          const key = String(item.fontFamily || '').trim();
          if (!key || seenFonts.has(key)) return;
          seenFonts.add(key);
          uniqueFonts.push(key);
        });

        if (uniqueFonts[0]) lines.push('  --font-body: ' + uniqueFonts[0] + ';');
        if (uniqueFonts[1]) lines.push('  --font-display: ' + uniqueFonts[1] + ';');

        tokenData.typography.slice(0, 5).forEach((item, index) => {
          const role = slug(item.role || 'text-' + (index + 1));
          lines.push('  --font-size-' + role + '-' + (index + 1) + ': ' + (item.fontSize || '16px') + ';');
          lines.push('  --font-weight-' + role + '-' + (index + 1) + ': ' + (item.fontWeight || '400') + ';');
        });

        tokenData.spacing.forEach((item, index) => {
          lines.push('  --space-' + slug(item.name || 'space-' + (index + 1)) + ': ' + (item.value || '0px') + ';');
        });
        tokenData.radii.forEach((item, index) => {
          lines.push('  --radius-' + slug(item.name || 'radius-' + (index + 1)) + ': ' + (item.value || '0px') + ';');
        });
        tokenData.shadows.forEach((item, index) => {
          lines.push('  --shadow-' + slug(item.name || 'shadow-' + (index + 1)) + ': ' + (item.value || 'none') + ';');
        });
        lines.push('}');
        return lines.join('\\n');
      }

      function buildTailwindTheme(tokenData) {
        const lines = ['@theme {'];
        tokenData.colors.forEach((color, index) => {
          lines.push('  --color-' + slug(color.name || 'color-' + (index + 1)) + ': ' + (color.value || '#000000') + ';');
        });

        const uniqueFonts = [];
        const seenFonts = new Set();
        tokenData.typography.forEach((item) => {
          const key = String(item.fontFamily || '').trim();
          if (!key || seenFonts.has(key)) return;
          seenFonts.add(key);
          uniqueFonts.push(key);
        });
        if (uniqueFonts[0]) lines.push('  --font-body: ' + uniqueFonts[0] + ';');
        if (uniqueFonts[1]) lines.push('  --font-display: ' + uniqueFonts[1] + ';');

        tokenData.spacing.forEach((item, index) => {
          lines.push('  --spacing-' + slug(item.name || 'space-' + (index + 1)) + ': ' + (item.value || '0px') + ';');
        });
        tokenData.radii.forEach((item, index) => {
          lines.push('  --radius-' + slug(item.name || 'radius-' + (index + 1)) + ': ' + (item.value || '0px') + ';');
        });
        tokenData.shadows.forEach((item, index) => {
          lines.push('  --shadow-' + slug(item.name || 'shadow-' + (index + 1)) + ': ' + (item.value || 'none') + ';');
        });
        lines.push('}');
        return lines.join('\\n');
      }

      function buildJsonTokens(data, tokenData) {
        const payload = {
          runId: data.runId,
          source: data.summary && data.summary.source ? data.summary.source : { primaryUrl: data.url },
          styleThesis: data.summary && data.summary.styleThesis ? data.summary.styleThesis : '',
          pagesInspected: normalizeList(data.summary.pages).length,
          colors: tokenData.colors.map((item, index) => ({
            name: item.name || 'Color ' + (index + 1),
            value: item.value || '#000000',
            role: item.role || 'color',
            confidence: item.confidence || 'low',
          })),
          typography: tokenData.typography.map((item, index) => ({
            name: (item.role || 'text') + '-' + (index + 1),
            fontFamily: item.fontFamily || 'sans-serif',
            fontSize: item.fontSize || '16px',
            fontWeight: item.fontWeight || '400',
            lineHeight: item.lineHeight || 'normal',
            letterSpacing: item.letterSpacing || 'normal',
            confidence: item.confidence || 'low',
          })),
          spacing: tokenData.spacing,
          radii: tokenData.radii,
          shadows: tokenData.shadows,
          surfaces: tokenData.surfaces,
          warnings: normalizeList(data.summary.warnings),
          components: tokenData.components.map((item) => ({
            name: item.name,
            kind: item.kind,
            role: item.role,
            textSample: item.textSample || '',
            selector: item.selector || '',
            count: item.count,
            styles: item.styles || {},
            bounds: item.bounds || null,
            confidence: item.confidence,
          })),
        };
        return JSON.stringify(payload, null, 2);
      }

      function renderHero(shots, preferredHref) {
        const target = document.getElementById('hero');
        const all = normalizeList(shots);
        if (!target) return;
        const hero = selectHeroShot(all, preferredHref);
        if (!hero) {
          target.innerHTML = '<p class="muted">No screenshots were captured.</p>';
          return;
        }

        const heroHtml = [
          '<figure class="hero-figure">',
          '<a href="' + escapeHtml(hero.href) + '" target="_blank" rel="noreferrer">',
          '<img src="' + escapeHtml(hero.href) + '" alt="Hero screenshot">',
          '</a>',
          '<figcaption class="hero-meta">' + escapeHtml(hero.viewport) + ' · ' + escapeHtml(hero.url) + '</figcaption>',
          '</figure>',
        ].join('');

        const thumbs = all
          .slice(0, 6)
          .map((shot) =>
            '<a href="' + escapeHtml(shot.href) + '" target="_blank" rel="noreferrer"><img src="' + escapeHtml(shot.href) + '" alt="' + escapeHtml(shot.viewport) + ' screenshot"></a>'
          )
          .join('');

        target.innerHTML = heroHtml + (thumbs ? '<div class="thumb-strip">' + thumbs + '</div>' : '');
      }

      function renderColors(colors) {
        const target = document.getElementById('colors');
        if (!target) return;
        if (!colors.length) {
          target.innerHTML = '<p class="muted">No color tokens found.</p>';
          return;
        }
        target.innerHTML = colors
          .sort((a, b) => confidenceRank(b.confidence) - confidenceRank(a.confidence))
          .map((color, index) => [
            '<article class="swatch-item">',
            '<div class="swatch-chip" style="background:' + escapeHtml(safeColorValue(color.value)) + '"></div>',
            '<div class="swatch-meta">',
            '<strong>' + escapeHtml(color.name || 'Color ' + (index + 1)) + '</strong>',
            '<code>' + escapeHtml(color.value || '') + '</code>',
            '<code>' + escapeHtml((color.role || 'token') + ' · ' + (color.confidence || 'low')) + '</code>',
            '</div>',
            '</article>',
          ].join(''))
          .join('');
      }

      function renderColorCategories(colors) {
        const target = document.getElementById('color-categories');
        if (!target) return;
        const groups = colorCategorySummary(colors);
        const renderGroup = (title, list) => {
          const names = normalizeList(list).map((item) => item.name || item.value || 'n/a');
          const values = normalizeList(list).map((item) => item.value || '').join(', ');
          return [
            '<article class="category">',
            '<h4>' + escapeHtml(title) + '</h4>',
            '<p class="muted">' + escapeHtml(names.length ? names.join(' · ') : 'No tokens detected') + '</p>',
            '<p class="muted">' + escapeHtml(values) + '</p>',
            '</article>',
          ].join('');
        };
        target.innerHTML = [
          renderGroup('Brand', groups.brand),
          renderGroup('Accents', groups.accents),
          renderGroup('Neutrals', groups.neutrals),
        ].join('');
      }

      function renderTypography(rows) {
        renderRows(
          'typography-body',
          rows,
          (type) => [
            '<tr>',
            '<td>' + escapeHtml(type.role || 'text') + '</td>',
            '<td>' + escapeHtml(type.fontFamily || 'sans-serif') + '</td>',
            '<td>' + escapeHtml((type.fontSize || '16px') + ' / ' + (type.fontWeight || '400')) + '</td>',
            '<td>' + escapeHtml((type.lineHeight || 'normal') + ' / ' + (type.letterSpacing || 'normal')) + '</td>',
            '<td>' + escapeHtml(type.confidence || 'low') + '</td>',
            '</tr>',
          ].join(''),
          'No typography tokens found.'
        );
      }

      function renderTypeScale(rows) {
        const target = document.getElementById('type-scale');
        if (!target) return;
        const sorted = normalizeList(rows)
          .slice()
          .sort((a, b) => numericPx(b.fontSize) - numericPx(a.fontSize))
          .slice(0, 7);
        if (!sorted.length) {
          target.innerHTML = '<p class="muted">No type scale tokens found.</p>';
          return;
        }
        const sizes = sorted.map((item) => numericPx(item.fontSize)).filter((size) => size > 0);
        const minSize = sizes.length ? Math.min(...sizes) : 16;
        const maxSize = sizes.length ? Math.max(...sizes) : 16;
        const summary = [
          '<div class="type-scale-summary">',
          '<div><strong>Observed type scale</strong><br>' + escapeHtml(String(sorted.length)) + ' text roles from ' + escapeHtml(String(minSize || 0)) + 'px to ' + escapeHtml(String(maxSize || 0)) + 'px</div>',
          '<div>Base ' + escapeHtml(String(minSize || 16)) + 'px</div>',
          '</div>',
        ].join('');
        target.innerHTML = summary + sorted
          .map((item) => [
            '<article class="scale-row">',
            '<div class="meta">' + escapeHtml((item.role || 'text') + ' · ' + (item.fontSize || '16px') + ' · ' + (item.fontWeight || '400') + ' · ' + (item.lineHeight || 'normal')) + '</div>',
            '<p class="sample" style="font-family:' + escapeHtml(item.fontFamily || 'sans-serif') + '; font-size:' + escapeHtml(clampSpecimenSize(item.fontSize || '16px')) + '; font-weight:' + escapeHtml(item.fontWeight || '400') + '; line-height:' + escapeHtml(item.lineHeight || '1.1') + '; letter-spacing:' + escapeHtml(item.letterSpacing || 'normal') + '">' + escapeHtml(typeSpecimenCopy(item)) + '</p>',
            '</article>',
          ].join(''))
          .join('');
      }

      function renderFontCards(rows) {
        const target = document.getElementById('font-cards');
        if (!target) return;
        const grouped = new Map();
        normalizeList(rows).forEach((item) => {
          const key = item.fontFamily || 'sans-serif';
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key).push(item);
        });
        const entries = Array.from(grouped.entries()).slice(0, 4);
        if (!entries.length) {
          target.innerHTML = '<p class="muted">No font families detected.</p>';
          return;
        }
        target.innerHTML = entries
          .map(([font, items], index) => {
            const roles = Array.from(new Set(items.map((item) => item.role).filter(Boolean))).join(', ');
            const weights = Array.from(new Set(items.map((item) => item.fontWeight).filter(Boolean))).join(', ');
            const sizes = Array.from(new Set(items.map((item) => item.fontSize).filter(Boolean))).slice(0, 6);
            const lineHeights = Array.from(new Set(items.map((item) => item.lineHeight).filter(Boolean))).slice(0, 4).join(', ');
            const tracking = Array.from(new Set(items.map((item) => item.letterSpacing).filter((value) => value && value !== 'normal'))).slice(0, 4).join(', ');
            return [
              '<article class="font-card">',
              '<p class="font-label">' + escapeHtml(index === 0 ? 'Primary' : 'Secondary') + '</p>',
              '<h4 style="font-family:' + escapeHtml(font) + '">' + escapeHtml(font) + '</h4>',
              '<p>Roles: ' + escapeHtml(roles || 'text') + '</p>',
              '<p>Weights: ' + escapeHtml(weights || '400') + '</p>',
              '<p>Sizes: ' + escapeHtml(sizes.join(', ') || '16px') + '</p>',
              '<p>Line height: ' + escapeHtml(lineHeights || 'normal') + '</p>',
              '<p>Tracking: ' + escapeHtml(tracking || 'normal') + '</p>',
              '</article>',
            ].join('');
          })
          .join('');
      }

      function renderSpacingTokens(rows) {
        const target = document.getElementById('spacing-body');
        if (!target) return;
        if (!rows.length) {
          target.innerHTML = '<p class="muted">No spacing tokens found.</p>';
          return;
        }
        target.innerHTML = rows
          .map((item) => {
            const value = cssTokenValue(item.value, '0px');
            const previewPadding = clampPaddingValue(value);
            return [
              '<article class="visual-token-card">',
              '<h4>' + escapeHtml(item.name || 'Padding') + '</h4>',
              '<div class="token-demo padding-demo" style="padding:' + escapeHtml(previewPadding) + '">',
              '<div class="padding-demo-inner">content</div>',
              '</div>',
              '<code class="token-code">padding: ' + escapeHtml(value) + '</code>',
              '<span class="token-confidence">' + escapeHtml(item.confidence || 'low') + '</span>',
              '</article>',
            ].join('');
          })
          .join('');
      }

      function renderRadiusTokens(rows) {
        const target = document.getElementById('radii-body');
        if (!target) return;
        if (!rows.length) {
          target.innerHTML = '<p class="muted">No radius tokens found.</p>';
          return;
        }
        target.innerHTML = rows
          .map((item) => {
            const value = cssTokenValue(item.value, '0px');
            return [
              '<article class="visual-token-card">',
              '<h4>' + escapeHtml(item.name || 'Radius') + '</h4>',
              '<div class="radius-demo" style="border-radius:' + escapeHtml(value) + '"></div>',
              '<code class="token-code">border-radius: ' + escapeHtml(value) + '</code>',
              '<span class="token-confidence">' + escapeHtml(item.confidence || 'low') + '</span>',
              '</article>',
            ].join('');
          })
          .join('');
      }

      function renderShadowTokens(rows) {
        const target = document.getElementById('shadows-body');
        if (!target) return;
        if (!rows.length) {
          target.innerHTML = [
            '<article class="visual-token-card">',
            '<h4>No shadow tokens found</h4>',
            '<div class="shadow-demo"></div>',
            '<code class="token-code">box-shadow: none</code>',
            '</article>',
          ].join('');
          return;
        }
        target.innerHTML = rows
          .map((item) => {
            const value = cssTokenValue(item.value, 'none');
            return [
              '<article class="visual-token-card">',
              '<h4>' + escapeHtml(item.name || 'Shadow') + '</h4>',
              '<div class="shadow-demo" style="box-shadow:' + escapeHtml(value) + '"></div>',
              '<code class="token-code">box-shadow: ' + escapeHtml(value) + '</code>',
              '<span class="token-confidence">' + escapeHtml(item.confidence || 'low') + '</span>',
              '</article>',
            ].join('');
          })
          .join('');
      }

      function renderSurfaceTokens(rows) {
        const target = document.getElementById('surfaces-body');
        if (!target) return;
        if (!rows.length) {
          target.innerHTML = '<p class="muted">No surface tokens found.</p>';
          return;
        }
        target.innerHTML = rows
          .map((surface) => {
            const value = safeColorValue(surface.value || '#ffffff');
            const text = contrastTextColor(value);
            return [
              '<article class="visual-token-card">',
              '<div class="surface-demo" style="background:' + escapeHtml(value) + '; color:' + escapeHtml(text) + '">',
              '<strong>' + escapeHtml(surface.name || ('Surface ' + surface.level)) + '</strong>',
              '<code>' + escapeHtml(value) + '</code>',
              '</div>',
              '<code class="token-code">' + escapeHtml(surface.purpose || 'surface') + '</code>',
              '<span class="token-confidence">' + escapeHtml(surface.confidence || 'low') + '</span>',
              '</article>',
            ].join('');
          })
          .join('');
      }

      function renderComponents(components, tokenData) {
        const target = document.getElementById('components');
        if (!target) return;
        if (!components.length) {
          target.innerHTML = '<p class="muted">No component signals found.</p>';
          return;
        }
        target.innerHTML = components
          .map((component) => {
            const styles = component.styles || {};
            const kind = String(component.kind || 'component').toLowerCase();
            const label = cleanComponentLabel(component, component.role || component.name || 'Component');
            const objectContent =
              kind === 'button' || kind === 'link'
                ? '<span>' + escapeHtml(label) + '</span>'
                : '<strong>' + escapeHtml(component.name || 'Component') + '</strong><span>' + escapeHtml(label || 'component') + '</span>';
            const meta = [
              styles.border ? 'border ' + styles.border : '',
              styles.borderRadius ? 'radius ' + styles.borderRadius : '',
              styles.padding ? 'padding ' + styles.padding : '',
              styles.boxShadow && styles.boxShadow !== 'none' ? 'shadow' : '',
            ].filter(Boolean).join(' · ');
            return [
              '<article class="component-specimen">',
              '<div class="component-specimen-stage">',
              '<div class="component-specimen-object is-' + escapeHtml(kind) + '" style="' + escapeHtml(specimenStyleForComponent(component, tokenData)) + '">' + objectContent + '</div>',
              '</div>',
              '<strong class="component-specimen-title">' + escapeHtml(component.name || 'Component') + ' · ' + escapeHtml(String(component.count || 0)) + ' samples · ' + escapeHtml(component.confidence || 'low') + '</strong>',
              '<div class="component-specimen-meta">' + escapeHtml(meta || component.selector || '') + '</div>',
              '</article>',
            ].join('');
          })
          .join('');
      }

      function renderComponentPreview(tokenData) {
        const target = document.getElementById('component-preview');
        if (!target) return;
        const surface = currentTheme ? currentTheme.surface : tokenData.surfaces[0] ? safeColorValue(tokenData.surfaces[0].value) : '#ffffff';
        const textColor = currentTheme ? currentTheme.text : pickReadableTextColor(tokenData.colors, surface);
        const accent = currentTheme ? currentTheme.accent : selectAccentColor(tokenData, surface);
        const accentText = contrastTextColor(accent);
        const headlineFont = currentTheme ? currentTheme.fonts.display : tokenData.typography[0] ? tokenData.typography[0].fontFamily : 'sans-serif';
        const bodyFont = currentTheme ? currentTheme.fonts.body : tokenData.typography[1] ? tokenData.typography[1].fontFamily : headlineFont;
        const sampleComponents = pickPreviewComponents(tokenData.components);
        const sampleHtml = sampleComponents.length
          ? [
              '<div class="component-samples">',
              sampleComponents
                .map((component) => {
                  const kind = String(component.kind || 'component').toLowerCase();
                  const label = cleanComponentLabel(component, component.role || component.name || component.kind || 'Component');
                  const content =
                    kind === 'button' || kind === 'link'
                      ? '<span>' + escapeHtml(label || 'Component') + '</span>'
                      : '<strong>' + escapeHtml(component.name || 'Component') + '</strong><span>' + escapeHtml(label || 'Component') + '</span>';
                  return '<div class="sample-component component-specimen-object is-' + escapeHtml(kind) + '" style="' + escapeHtml(specimenStyleForComponent(component, tokenData)) + '">' + content + '</div>';
                })
                .join(''),
              '</div>',
            ].join('')
          : '';
        const paletteHtml = tokenData.colors.length
          ? '<div class="preview-palette">' + tokenData.colors.slice(0, 5).map((color) => '<span style="background:' + escapeHtml(safeColorValue(color.value)) + '"></span>').join('') + '</div>'
          : '';
        const firstStyled = sampleComponents[0] || tokenData.components.find((component) => component.styles) || null;
        const firstStyles = firstStyled && firstStyled.styles ? firstStyled.styles : {};
        const styleGrid = [
          ['Font', firstStyles.fontFamily || bodyFont],
          ['Border', firstStyles.border || 'none detected'],
          ['Radius', firstStyles.borderRadius || 'none detected'],
          ['Shadow', firstStyles.boxShadow || 'none detected'],
        ];

        target.innerHTML = [
          '<div class="component-preview" style="background:var(--site-surface, ' + escapeHtml(surface) + '); color:var(--site-text, ' + escapeHtml(textColor) + '); font-family:' + escapeHtml(bodyFont) + '">',
          '<div class="preview-banner" style="background:var(--site-accent, ' + escapeHtml(accent) + '); color:' + escapeHtml(accentText) + '; border:1px solid var(--site-border); border-radius:var(--site-radius)">',
          '<h4 style="font-family:' + escapeHtml(headlineFont) + '">' + escapeHtml(currentHostname) + '</h4>',
          '<p>' + escapeHtml((currentThesis || 'Previewing how extracted tokens feel when applied to UI blocks.').slice(0, 210)) + '</p>',
          '</div>',
          paletteHtml,
          sampleHtml,
          '<div class="component-style-grid">',
          styleGrid.map(([label, value]) => '<div class="style-chip"><strong>' + escapeHtml(label) + '</strong>' + escapeHtml(value) + '</div>').join(''),
          '</div>',
          '</div>',
        ].join('');
      }

      attachDownloadHandlers();

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        run.disabled = true;
        status.textContent = 'Discovering pages and assembling style evidence...';

        try {
          const response = await fetch('/api/extract', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              url: document.getElementById('url').value,
              maxPages: Number(document.getElementById('max-pages').value),
              aiTarget: aiTarget ? aiTarget.value : 'generic',
            }),
          });

          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Extraction failed');

          const [designMd, evidence] = await Promise.all([
            fetch(data.artifacts.designMd).then((res) => (res.ok ? res.text() : '')).catch(() => ''),
            fetch(data.artifacts.evidenceJson).then((res) => (res.ok ? res.json() : null)).catch(() => null),
          ]);

          const tokenData = buildTokenData(data, evidence);
          const thesis = createThesis(data, evidence, tokenData);
          const guide = buildGuidelines(data, tokenData);
          const captureStamp = data.summary && data.summary.source ? data.summary.source.capturedAt : '';

          empty.style.display = 'none';
          result.classList.add('active');

          const hostname = new URL(data.url).hostname;
          currentHostname = hostname;
          currentThesis = thesis;
          applyExtractedTheme(tokenData);
          document.getElementById('result-title').textContent = hostname;
          document.getElementById('result-crumb').textContent = '/ Styles / ' + hostname;
          document.getElementById('result-meta').textContent =
            data.summary.pages.length +
            ' pages inspected · run ' +
            data.runId +
            (captureStamp ? ' · captured ' + captureStamp : '');
          document.getElementById('open-preview').href = data.artifacts.previewHtml;
          document.getElementById('open-design').href = data.artifacts.designMd;
          document.getElementById('open-evidence').href = data.artifacts.evidenceJson;
          document.getElementById('open-design-inline').href = data.artifacts.designMd;

          renderHero(data.summary.screenshots, data.summary.bestScreenshotHref);
          document.getElementById('thesis').textContent = thesis;
          renderStyleProfile(data, tokenData, evidence);
          renderColorCategories(tokenData.colors);
          renderColors(tokenData.colors);
          renderTypeScale(tokenData.typography);
          renderTypography(tokenData.typography);
          renderFontCards(tokenData.typography);
          renderSpacingTokens(tokenData.spacing);
          renderRadiusTokens(tokenData.radii);
          renderShadowTokens(tokenData.shadows);
          renderSurfaceTokens(tokenData.surfaces);
          renderComponentPreview(tokenData);
          renderComponents(tokenData.components, tokenData);

          setList(
            'pages',
            normalizeList(data.summary.pages),
            (page) => '<li>' + escapeHtml(page.status + ' · ' + page.url) + '</li>',
            'No pages inspected.'
          );
          setList(
            'discovered',
            normalizeList(data.discoveredPages),
            (page) => '<li>' + escapeHtml(page) + '</li>',
            'No additional pages discovered.'
          );
          setList(
            'warnings',
            normalizeList(data.summary.warnings),
            (warning) => '<li>' + escapeHtml((warning.severity || 'info') + ' · ' + warning.message) + '</li>',
            'No extraction warnings.'
          );
          setList('guidelines-do', guide.doRules, (rule) => '<li>' + escapeHtml(rule) + '</li>', 'No rules generated.');
          setList('guidelines-dont', guide.dontRules, (rule) => '<li>' + escapeHtml(rule) + '</li>', 'No warnings generated.');

          const selectedAiTarget = aiTarget ? aiTarget.value : 'generic';
          const designExcerpt = extractDesignExcerpt(designMd, thesis, data);
          const cssVars = buildCssVariables(tokenData);
          const tailwindTheme = buildTailwindTheme(tokenData);
          const jsonTokens = buildJsonTokens(data, tokenData);
          const aiPrompt = buildAiPrompt(selectedAiTarget, {
            runId: data.runId,
            url: data.url,
            thesis,
            cssVars,
            tailwindTheme,
            jsonTokens,
            designMd,
          });

          latestExportData = {
            runId: data.runId,
            url: data.url,
            aiTarget: selectedAiTarget,
            thesis,
            designMd,
            designExcerpt,
            cssVars,
            tailwindTheme,
            jsonTokens,
            aiPrompt,
          };

          updateDesignPreview();
          updateActiveDownloadLabel();
          document.getElementById('css-vars').textContent = cssVars;
          document.getElementById('tailwind-theme').textContent = tailwindTheme;
          document.getElementById('json-tokens').textContent = jsonTokens;
          document.getElementById('ai-prompt').textContent = aiPrompt;

          status.textContent = 'Extraction complete: ' + data.runId;
        } catch (error) {
          status.innerHTML = '<span class="error">' + escapeHtml(error && error.message ? error.message : String(error)) + '</span>';
        } finally {
          run.disabled = false;
        }
      });
    </script>
  </body>
</html>`;
}
