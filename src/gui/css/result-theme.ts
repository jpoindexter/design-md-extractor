export function resultThemeCss(): string {
  return `
    /* .result.refero-layout — light reference viewer (refero.design chrome) */
    .result.refero-layout { background: var(--canvas); color: var(--ink); }
    .result.refero-layout .workspace { border-top: 1px solid var(--line); background: var(--canvas); }
    .result.refero-layout .reference, .result.refero-layout .export-pane { overscroll-behavior: contain; }
    .result.refero-layout .reference { background: var(--canvas); color: var(--ink); border-right: 1px solid var(--line); }
    .result.refero-layout .panel { border-top: 0; padding: 0; }
    .result.refero-layout .panel + .panel { margin-top: 80px; }
    .result.refero-layout .reference-hero + .result-head { margin-top: 28px; }
    .result.refero-layout .result-head + .style-summary { margin-top: 18px; }
    .result.refero-layout .style-summary + .panel { margin-top: 64px; }
    .result.refero-layout .panel h3 { margin-bottom: 24px; color: var(--ink); font-size: 20px; font-weight: 600; letter-spacing: -0.4px; }
    .result.refero-layout .result-head { padding: 0; display: block; }
    .result.refero-layout .result-head h2 { color: var(--ink-strong); font-family: var(--serif); font-size: 64px; font-weight: 400; line-height: 1.05; letter-spacing: -1.28px; }
    .result.refero-layout .crumb { color: var(--quiet); }
    .result.refero-layout #result-meta { color: var(--quiet); margin: 12px 0 0; }
    .result.refero-layout .thesis { max-width: 620px; color: var(--muted); font-size: 15px; line-height: 1.6; letter-spacing: -0.38px; }
    .result.refero-layout .actions { display: none; }
    .result.refero-layout .hero-figure { border: 1px solid var(--line); border-radius: var(--radius-lg); background: var(--panel); box-shadow: none; }
    .result.refero-layout .hero-figure img { height: clamp(280px, 42vh, 400px); }
    .result.refero-layout .thumb-strip { display: none; }

    /* export pane — light */
    .result.refero-layout .export-pane { background: var(--canvas); border-top: 0; padding: 0; }
    .result.refero-layout .tabs { border-bottom: 1px solid var(--line); padding: 0 24px; gap: 20px; }
    .result.refero-layout .tab { color: var(--muted); font-size: 13px; font-weight: 500; }
    .result.refero-layout .tab.active { border-color: var(--ink-strong); color: var(--ink-strong); font-weight: 600; }
    .result.refero-layout .export-actions { border-bottom: 1px solid var(--line); padding: 9px 24px; }
    .result.refero-layout .mode-btn { color: var(--quiet); }
    .result.refero-layout .mode-btn.active { color: var(--ink-strong); border-bottom-color: var(--ink-strong); }
    .result.refero-layout .copy-btn { border-color: var(--line-strong); background: var(--panel); color: var(--ink); }
    .result.refero-layout .download-btn { border-color: var(--line-strong); background: var(--panel); color: var(--ink); }
    .result.refero-layout .excerpt {
      border: 1px solid var(--line); border-radius: var(--radius-md);
      background: var(--panel); color: var(--ink); font-size: 12px;
    }
    .result.refero-layout .code-block {
      border: 1px solid var(--line); border-radius: var(--radius-md);
      background: var(--panel); color: var(--ink); font-size: 12px;
    }
    .result.refero-layout .export-note a { color: var(--accent); }

    /* interactive feedback (scoped so it beats the base color rules above) */
    .result.refero-layout .tab:hover { color: var(--ink); }
    .result.refero-layout .mode-btn:hover { color: var(--ink); }
    .result.refero-layout .copy-btn:hover,
    .result.refero-layout .download-btn:hover { border-color: var(--ink-strong); color: var(--ink-strong); }
    .result.refero-layout .copy-btn:active,
    .result.refero-layout .download-btn:active { background: var(--rail); }
    .result.refero-layout .hero-figure a { display: block; transition: opacity 120ms ease; }
    .result.refero-layout .hero-figure a:hover img { opacity: 0.92; }
    .result.refero-layout .hero-figure a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    /* site-themed overrides — supplies --site-* vars to the component preview only.
       The big style-name heading stays Refero serif (chrome), never the site font. */
    .result.site-themed {
      --site-canvas: #edf0ed; --site-surface: #ffffff; --site-card: #ffffff;
      --site-code: #f7f8fb; --site-text: #141715; --site-muted: #656b66;
      --site-accent: #3a5446; --site-accent-text: #ffffff; --site-border: #dfe4df;
      --site-border-width: 1px; --site-border-style: solid; --site-radius: 8px;
      --site-shadow: none; --site-frame-shadow: inset 0 0 0 1px var(--site-border);
      --site-space: 14px; --site-section-space: 36px;
      --site-font-body: "Helvetica Neue", Arial, sans-serif;
      --site-font-display: var(--site-font-body);
      --site-display-size: 72px; --site-display-weight: 700; --site-display-line: 0.92;
    }
  `;
}
