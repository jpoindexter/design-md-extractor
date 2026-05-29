export function baseCss(): string {
  return `
    * { box-sizing: border-box; }
    html, body { min-height: 100%; }
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
      padding: 10px 24px;
      position: sticky;
      top: 0;
      z-index: 20;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) minmax(200px, 280px);
      gap: 22px;
      align-items: end;
    }
    .brand { display: flex; align-items: center; gap: 9px; padding-bottom: 1px; }
    .mark {
      width: 22px;
      height: 22px;
      border: 1.5px solid var(--line-strong);
      border-radius: 5px;
      display: grid;
      place-items: center;
      background: var(--panel);
      flex: none;
    }
    .mark::before {
      content: "";
      width: 9px;
      height: 9px;
      border-radius: 2px;
      background: var(--accent-soft);
    }
    h1 { margin: 0; font-size: 15px; line-height: 1.15; white-space: nowrap; }
    .lede {
      margin: 2px 0 0;
      color: var(--muted);
      font-size: 11px;
      line-height: 1.35;
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
      height: 40px;
      border: 1px solid var(--field-border);
      border-radius: 6px;
      background: var(--panel);
      color: var(--ink);
      padding: 0 11px;
      font-size: 13px;
    }
    /* custom chevron + reserved space so long option text never collides with the native arrow */
    select {
      appearance: none;
      -webkit-appearance: none;
      padding-right: 34px;
      text-overflow: ellipsis;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23525769' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      background-size: 13px;
    }
    /* solid, dark focus ring (WCAG 2.4.x): the old 0.35-alpha ring composited to ~2:1 */
    input:focus-visible, select:focus-visible,
    .run:focus-visible, .settings-btn:focus-visible,
    .tab:focus-visible, .mode-btn:focus-visible,
    .copy-btn:focus-visible, .download-btn:focus-visible,
    .actions a:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    select option { background: var(--panel); color: var(--ink); }
    .run {
      border: 0;
      height: 40px;
      border-radius: 6px;
      background: var(--accent-soft);
      color: var(--on-accent);
      font-weight: 710;
      cursor: pointer;
      transition: background 120ms ease-in-out;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .run:hover { background: var(--ink-strong); }
    .run:disabled { opacity: 0.7; cursor: wait; }
    .run[aria-busy="true"]::after {
      content: "";
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: var(--on-accent);
      animation: run-spin 0.7s linear infinite;
    }
    @keyframes run-spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) {
      .run[aria-busy="true"]::after { animation: none; }
    }
    .status {
      margin: 0;
      flex: 1;
      min-width: 0;
      min-height: 40px;
      max-height: 56px;
      display: flex;
      align-items: center;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
      color: var(--muted);
      font-size: 11.5px;
      line-height: 1.3;
      padding: 6px 11px;
      overflow: hidden;
      overflow-wrap: anywhere;
    }
    .empty {
      min-height: 100%;
      border: 0;
      border-radius: 0;
      background: var(--canvas);
      color: var(--quiet);
      display: grid;
      place-items: center;
      padding: 34px;
      text-align: center;
    }
    .empty strong { color: var(--muted); }
    .muted { color: var(--muted); font-size: 12px; }
    .error { color: var(--error); font-weight: 600; }
    /* error is more than color: give the status box a red border + tint so it's not color-only */
    .status:has(.error) { border-color: var(--error); background: var(--error-bg); }
    main {
      min-height: 0;
      padding: 0;
      overflow: hidden;
      background: var(--canvas);
    }
  `;
}
