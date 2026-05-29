export function layoutCss(): string {
  return `
    .result { display: none; min-height: 0; height: 100%; gap: 0; max-width: none; margin: 0; }
    .result.active { display: grid; }
    .workspace {
      display: grid; grid-template-columns: minmax(0, 1fr) minmax(480px, 1fr);
      min-height: 0; height: 100%; gap: 0; align-items: stretch; max-width: none;
      border: 0; border-top: 1px solid var(--line); border-radius: 0;
      background: var(--canvas); overflow: hidden; box-shadow: none; min-width: 0;
    }
    .reference {
      display: grid; align-content: start; gap: 0; min-height: 0; min-width: 0;
      height: 100%; overflow: auto; overflow-x: hidden; background: var(--canvas);
      padding: 48px 40px 96px; border-right: 1px solid var(--line);
    }
    .reference-hero h2, .style-summary h3, .export-pane h3 {
      position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0);
    }
    .reference > *, .panel { min-width: 0; max-width: 100%; }
    .panel { border: 0; border-top: 1px solid var(--line); border-radius: 0; background: transparent; padding: 56px 0; }
    .reference > .panel:first-child { border-top: 0; padding-top: 0; }
    .reference > .panel:last-child { padding-bottom: 0; }
    .panel h3 { margin: 0 0 18px; font-size: 15px; letter-spacing: 0; text-transform: none; color: var(--ink); font-weight: 660; }
    .export-pane {
      position: static; min-height: 0; min-width: 0; height: 100%; max-height: none;
      overflow: hidden; border: 0; border-radius: 0; background: var(--canvas);
      padding: 0; display: flex; flex-direction: column;
    }
    .tabs { display: flex; flex-wrap: wrap; align-items: center; gap: 20px; margin: 0; padding: 0 24px; border-bottom: 1px solid var(--line); }
    .tabs-bundle { margin-left: auto; }
    .tab {
      border: 0; border-bottom: 2px solid transparent; background: transparent;
      color: var(--muted); border-radius: 0; min-height: 46px; padding: 0;
      font-size: 13px; font-weight: 580; cursor: pointer; letter-spacing: 0;
    }
    .tab.active { border-color: var(--ink); color: var(--ink); background: transparent; }
    .tab-panel { display: none; min-height: 0; min-width: 0; flex: 1; padding: 14px 24px 24px; overflow: hidden; }
    .tab-panel.active { display: flex; flex-direction: column; }
    .export-actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 24px; border-bottom: 1px solid var(--line); }
    .mode-tabs { display: flex; gap: 14px; }
    .mode-btn { border: 0; background: transparent; min-height: 28px; font-size: 12px; color: var(--quiet); cursor: pointer; padding: 0; }
    .mode-btn.active { color: var(--ink); border-bottom: 1px solid var(--ink); }
    .copy-btn { border: 1px solid var(--line-strong); border-radius: 6px; background: var(--panel); color: var(--ink); padding: 0 10px; min-height: 28px; font-size: 12px; font-weight: 680; cursor: pointer; }
    .download-btn { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--panel); color: var(--ink); min-height: 30px; font-size: 11px; font-weight: 700; cursor: pointer; padding: 0 10px; }
    .download-btn::before {
      content: ""; width: 13px; height: 13px; flex: none; background-color: currentColor;
      -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpolyline points='7 10 12 15 17 10'/%3E%3Cline x1='12' y1='15' x2='12' y2='3'/%3E%3C/svg%3E") center / 13px no-repeat;
      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpolyline points='7 10 12 15 17 10'/%3E%3Cline x1='12' y1='15' x2='12' y2='3'/%3E%3C/svg%3E") center / 13px no-repeat;
    }
    .download-btn:hover { border-color: var(--ink-strong); color: var(--ink-strong); }
    .export-tools { display: flex; gap: 8px; align-items: center; }
    .bundle-btn { font-weight: 700; }
    .excerpt {
      margin: 0; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--panel); padding: 15px;
      font-size: 12px; line-height: 1.65; font-family: var(--mono); color: var(--ink);
      min-height: 0; min-width: 0; max-width: 100%; max-height: none; flex: 1; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere;
    }
    .code-block {
      margin: 0; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--panel);
      color: var(--ink); font-family: var(--mono); font-size: 12px; line-height: 1.65; padding: 15px;
      min-height: 0; min-width: 0; max-width: 100%; max-height: none; flex: 1; overflow: auto; white-space: pre;
    }
    .export-note { margin: 0 0 8px; color: var(--muted); font-size: 12px; }
    .export-note a { color: var(--accent); font-weight: 670; }
    .hint { margin: 0; padding: 10px 24px 8px; color: var(--quiet); font-size: 11px; }
    .hero-figure { margin: 0; border: 1px solid var(--line); border-radius: 16px; overflow: hidden; background: var(--panel); }
    .hero-figure img { width: 100%; height: 420px; max-height: 52vh; object-fit: contain; display: block; }
    .hero-meta { padding: 11px 12px; border-top: 1px solid var(--line); color: var(--quiet); font-size: 12px; }
    .thumb-strip { margin-top: 12px; display: flex; gap: 10px; overflow-x: auto; padding-bottom: 2px; }
    .thumb-strip a { border: 1px solid var(--line); border-radius: 8px; overflow: hidden; display: block; flex: 0 0 138px; background: var(--panel); }
    .thumb-strip img { width: 100%; aspect-ratio: 16 / 10; object-fit: contain; display: block; }
    .result-head { display: flex; gap: 14px; justify-content: space-between; align-items: flex-start; padding: 30px 0 6px; }
    .crumb { margin: 0 0 8px; color: var(--quiet); font-size: 13px; }
    .result-head h2 { margin: 0; font-family: var(--serif); font-size: 64px; line-height: 1.05; font-weight: 400; letter-spacing: -1.28px; max-width: 820px; overflow-wrap: anywhere; color: var(--ink-strong); }
    #result-meta { margin: 10px 0 0; color: var(--quiet); font-size: 12px; }
    .actions { display: flex; flex-wrap: wrap; gap: 7px; }
    .actions a {
      text-decoration: none; border: 1px solid var(--line); border-radius: 6px; background: var(--panel);
      color: var(--muted); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0; padding: 8px 10px;
    }
    .actions a:hover { border-color: var(--line-strong); color: var(--ink); }
  `;
}
