export function renderAppHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Design MD Extractor</title>
    <style>
      :root {
        --ink: #111412;
        --muted: #68706b;
        --line: #d9ddd7;
        --canvas: #f4f5f1;
        --panel: #ffffff;
        --panel-soft: #eef1ec;
        --accent: #176b52;
        --accent-2: #1f3f7a;
        --error: #9f1239;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: var(--ink);
        background:
          linear-gradient(180deg, rgba(23,107,82,0.06), transparent 22%),
          linear-gradient(130deg, rgba(31,63,122,0.06), transparent 34%),
          var(--canvas);
        font-family: "IBM Plex Sans", "Aptos", "Helvetica Neue", sans-serif;
      }
      button, input, select { font: inherit; }
      .shell {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 350px minmax(0, 1fr);
      }
      .side {
        border-right: 1px solid var(--line);
        background: rgba(255,255,255,0.78);
        backdrop-filter: blur(14px);
        padding: 22px;
      }
      .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
      .mark {
        width: 28px;
        height: 28px;
        border: 2px solid var(--ink);
        border-radius: 7px;
        display: grid;
        place-items: center;
      }
      .mark::before {
        content: "";
        width: 12px;
        height: 12px;
        border-radius: 3px;
        background: var(--accent);
      }
      h1 { margin: 0; font-size: 18px; line-height: 1.2; }
      .lede {
        margin: 6px 0 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }
      form { display: grid; gap: 13px; }
      label {
        display: grid;
        gap: 7px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 640;
      }
      input, select {
        width: 100%;
        min-height: 42px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #fff;
        color: var(--ink);
        padding: 9px 11px;
      }
      .run {
        border: 0;
        min-height: 44px;
        border-radius: 8px;
        background: var(--accent);
        color: #fff;
        font-weight: 750;
        cursor: pointer;
      }
      .run:disabled { opacity: 0.56; cursor: wait; }
      .status {
        margin-top: 16px;
        min-height: 44px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel-soft);
        color: var(--muted);
        font-size: 13px;
        line-height: 1.4;
        padding: 12px;
      }
      main { padding: 18px; overflow: auto; }
      .empty {
        min-height: calc(100vh - 36px);
        border: 1px solid var(--line);
        border-radius: 8px;
        background: rgba(255,255,255,0.78);
        color: var(--muted);
        display: grid;
        place-items: center;
        padding: 30px;
        text-align: center;
      }
      .result { display: none; gap: 14px; }
      .result.active { display: grid; }
      .result-head {
        display: flex;
        gap: 14px;
        justify-content: space-between;
        align-items: flex-start;
      }
      .result-head h2 { margin: 0; font-size: 25px; }
      .result-head p { margin: 6px 0 0; color: var(--muted); font-size: 13px; }
      .actions { display: flex; flex-wrap: wrap; gap: 8px; }
      .actions a {
        text-decoration: none;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #fff;
        color: var(--ink);
        font-size: 13px;
        font-weight: 700;
        padding: 9px 11px;
      }
      .workspace {
        display: grid;
        grid-template-columns: minmax(0, 1.58fr) minmax(320px, 1fr);
        gap: 14px;
        align-items: start;
      }
      .reference { display: grid; gap: 12px; }
      .panel {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: rgba(255,255,255,0.9);
        padding: 14px;
      }
      .panel h3 {
        margin: 0 0 10px;
        font-size: 12px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--muted);
      }
      .hero-figure {
        margin: 0;
        border: 1px solid var(--line);
        border-radius: 8px;
        overflow: hidden;
        background: #fff;
      }
      .hero-figure img {
        width: 100%;
        aspect-ratio: 16 / 10;
        object-fit: cover;
        display: block;
      }
      .hero-meta {
        padding: 9px 11px;
        border-top: 1px solid var(--line);
        color: var(--muted);
        font-size: 12px;
      }
      .thumb-strip {
        margin-top: 10px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 8px;
      }
      .thumb-strip a {
        border: 1px solid var(--line);
        border-radius: 8px;
        overflow: hidden;
        display: block;
      }
      .thumb-strip img {
        width: 100%;
        aspect-ratio: 16 / 10;
        object-fit: cover;
        display: block;
      }
      .thesis { margin: 0; font-size: 14px; line-height: 1.5; }
      .swatch-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(165px, 1fr));
        gap: 8px;
      }
      .swatch-item {
        border: 1px solid var(--line);
        border-radius: 8px;
        overflow: hidden;
        background: #fff;
      }
      .swatch-chip { height: 44px; border-bottom: 1px solid var(--line); }
      .swatch-meta { padding: 8px 9px; display: grid; gap: 3px; }
      .swatch-meta strong { font-size: 12px; }
      .swatch-meta code { font-size: 12px; color: var(--muted); overflow-wrap: anywhere; }
      .dense-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }
      .dense-table th {
        text-align: left;
        color: var(--muted);
        font-weight: 650;
        border-bottom: 1px solid var(--line);
        padding: 0 0 6px;
      }
      .dense-table td {
        border-bottom: 1px solid var(--line);
        padding: 7px 0;
        vertical-align: top;
      }
      .dense-table tr:last-child td { border-bottom: 0; }
      .muted { color: var(--muted); font-size: 12px; }
      .tri-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }
      .guidelines {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .guidelines h4 {
        margin: 0 0 6px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .guidelines ul {
        margin: 0;
        padding-left: 16px;
        color: var(--ink);
        font-size: 12px;
        line-height: 1.4;
      }
      .guidelines li + li { margin-top: 5px; }
      .component-list { display: grid; gap: 8px; }
      .component-row {
        border-bottom: 1px solid var(--line);
        display: flex;
        gap: 10px;
        justify-content: space-between;
        padding-bottom: 8px;
      }
      .component-row:last-child { border-bottom: 0; padding-bottom: 0; }
      .component-row strong { font-size: 13px; }
      .component-row span { color: var(--muted); font-size: 12px; text-align: right; }
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
      }
      .mono-list li + li { margin-top: 4px; }
      .export-pane {
        position: sticky;
        top: 10px;
        max-height: calc(100vh - 28px);
        overflow: auto;
      }
      .tabs {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 7px;
        margin-bottom: 10px;
      }
      .tab {
        border: 1px solid var(--line);
        background: #fff;
        color: var(--ink);
        border-radius: 8px;
        min-height: 34px;
        font-size: 12px;
        font-weight: 680;
        cursor: pointer;
      }
      .tab.active {
        border-color: var(--accent-2);
        color: var(--accent-2);
        background: rgba(31,63,122,0.06);
      }
      .tab-panel { display: none; }
      .tab-panel.active { display: block; }
      .export-note { margin: 0 0 8px; color: var(--muted); font-size: 12px; }
      .excerpt {
        margin: 0;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel-soft);
        padding: 10px;
        font-size: 12px;
        line-height: 1.45;
        max-height: 320px;
        overflow: auto;
        white-space: pre-wrap;
      }
      .code-block {
        margin: 0;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #0f141b;
        color: #d8e0ec;
        font-size: 12px;
        line-height: 1.45;
        padding: 10px;
        max-height: 520px;
        overflow: auto;
        white-space: pre;
      }
      .error { color: var(--error); }
      @media (max-width: 1180px) {
        .workspace { grid-template-columns: minmax(0, 1fr); }
        .export-pane {
          position: static;
          max-height: none;
        }
      }
      @media (max-width: 860px) {
        .shell { grid-template-columns: 1fr; }
        .side { border-right: 0; border-bottom: 1px solid var(--line); }
        .result-head { display: grid; }
        .actions { justify-content: flex-start; }
      }
      @media (max-width: 680px) {
        .guidelines,
        .split-list,
        .tri-grid {
          grid-template-columns: minmax(0, 1fr);
        }
        .tabs { grid-template-columns: minmax(0, 1fr); }
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
            <input id="url" name="url" type="url" placeholder="https://ui.shadcn.com" required>
          </label>
          <label>
            Coverage
            <select id="max-pages" name="maxPages">
              <option value="7" selected>Broad scan, up to 7 pages</option>
              <option value="4">Quick scan, up to 4 pages</option>
              <option value="12">Deep scan, up to 12 pages</option>
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
        <div id="result" class="result">
          <div class="result-head">
            <div>
              <h2 id="result-title">Style extraction</h2>
              <p id="result-meta"></p>
            </div>
            <div class="actions">
              <a id="open-preview" href="#" target="_blank" rel="noreferrer">Preview</a>
              <a id="open-design" href="#" target="_blank" rel="noreferrer">DESIGN.md</a>
              <a id="open-evidence" href="#" target="_blank" rel="noreferrer">Evidence</a>
            </div>
          </div>
          <div class="workspace">
            <div class="reference">
              <section class="panel">
                <h3>Hero Capture</h3>
                <div id="hero"></div>
              </section>
              <section class="panel">
                <h3>Style Thesis</h3>
                <p id="thesis" class="thesis"></p>
              </section>
              <section class="panel">
                <h3>Color Palette</h3>
                <div id="colors" class="swatch-grid"></div>
              </section>
              <section class="panel">
                <h3>Typography</h3>
                <table class="dense-table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Font</th>
                      <th>Size / Weight</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody id="typography-body"></tbody>
                </table>
              </section>
              <section class="panel">
                <h3>Spacing, Radius, Shadows</h3>
                <div class="tri-grid">
                  <div>
                    <p class="muted">Spacing</p>
                    <table class="dense-table"><tbody id="spacing-body"></tbody></table>
                  </div>
                  <div>
                    <p class="muted">Radius</p>
                    <table class="dense-table"><tbody id="radii-body"></tbody></table>
                  </div>
                  <div>
                    <p class="muted">Shadows</p>
                    <table class="dense-table"><tbody id="shadows-body"></tbody></table>
                  </div>
                </div>
                <p class="muted">Surfaces</p>
                <table class="dense-table"><tbody id="surfaces-body"></tbody></table>
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

      const tabs = Array.from(document.querySelectorAll('.tab'));
      tabs.forEach((tabButton) => {
        tabButton.addEventListener('click', () => {
          const tab = tabButton.getAttribute('data-tab');
          tabs.forEach((button) => button.classList.toggle('active', button === tabButton));
          Array.from(document.querySelectorAll('.tab-panel')).forEach((panel) => {
            panel.classList.toggle('active', panel.id === 'tab-' + tab);
          });
        });
      });

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
            count: item.count,
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

      function renderTypography(rows) {
        renderRows(
          'typography-body',
          rows,
          (type) => [
            '<tr>',
            '<td>' + escapeHtml(type.role || 'text') + '</td>',
            '<td>' + escapeHtml(type.fontFamily || 'sans-serif') + '</td>',
            '<td>' + escapeHtml((type.fontSize || '16px') + ' / ' + (type.fontWeight || '400')) + '</td>',
            '<td>' + escapeHtml(type.confidence || 'low') + '</td>',
            '</tr>',
          ].join(''),
          'No typography tokens found.'
        );
      }

      function renderDensityTable(id, rows, emptyText) {
        renderRows(
          id,
          rows,
          (item) => [
            '<tr>',
            '<td>' + escapeHtml(item.name || 'token') + '</td>',
            '<td>' + escapeHtml(item.value || '') + '</td>',
            '<td>' + escapeHtml(item.confidence || 'low') + '</td>',
            '</tr>',
          ].join(''),
          emptyText
        );
      }

      function renderSurfaces(rows) {
        renderRows(
          'surfaces-body',
          rows,
          (surface) => [
            '<tr>',
            '<td>' + escapeHtml(surface.name || ('Surface ' + surface.level)) + '</td>',
            '<td>' + escapeHtml(surface.value || '') + '</td>',
            '<td>' + escapeHtml(surface.confidence || 'low') + '</td>',
            '</tr>',
          ].join(''),
          'No surface tokens found.'
        );
      }

      function renderComponents(components) {
        const target = document.getElementById('components');
        if (!target) return;
        if (!components.length) {
          target.innerHTML = '<p class="muted">No component signals found.</p>';
          return;
        }
        target.innerHTML = components
          .map((component) => [
            '<div class="component-row">',
            '<div><strong>' + escapeHtml(component.name || 'Component') + '</strong><div class="muted">' + escapeHtml(component.role || 'ui') + '</div></div>',
            '<span>' + escapeHtml(String(component.count || 0)) + ' samples<br>' + escapeHtml(component.confidence || 'low') + '</span>',
            '</div>',
          ].join(''))
          .join('');
      }

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

          document.getElementById('result-title').textContent = new URL(data.url).hostname;
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
          renderColors(tokenData.colors);
          renderTypography(tokenData.typography);
          renderDensityTable('spacing-body', tokenData.spacing, 'No spacing tokens found.');
          renderDensityTable('radii-body', tokenData.radii, 'No radius tokens found.');
          renderDensityTable('shadows-body', tokenData.shadows, 'No shadow tokens found.');
          renderSurfaces(tokenData.surfaces);
          renderComponents(tokenData.components);

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

          document.getElementById('design-excerpt').textContent = extractDesignExcerpt(designMd, thesis, data);
          document.getElementById('css-vars').textContent = buildCssVariables(tokenData);
          document.getElementById('tailwind-theme').textContent = buildTailwindTheme(tokenData);
          document.getElementById('json-tokens').textContent = buildJsonTokens(data, tokenData);

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
