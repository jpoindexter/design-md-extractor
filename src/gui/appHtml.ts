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
        --canvas: #f7f8f4;
        --panel: #ffffff;
        --panel-2: #eff3ed;
        --accent: #176b52;
        --accent-2: #3157a4;
        --warn: #b45309;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: var(--ink);
        background:
          linear-gradient(135deg, rgba(23,107,82,0.08), transparent 36%),
          linear-gradient(225deg, rgba(49,87,164,0.08), transparent 30%),
          var(--canvas);
        font-family: "IBM Plex Sans", "Aptos", "Helvetica Neue", sans-serif;
      }
      button, input, select { font: inherit; }
      .shell {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 360px 1fr;
      }
      .side {
        border-right: 1px solid var(--line);
        background: rgba(255,255,255,0.74);
        backdrop-filter: blur(14px);
        padding: 24px;
      }
      .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
      .mark { width: 28px; height: 28px; border: 2px solid var(--ink); border-radius: 7px; display: grid; place-items: center; }
      .mark::before { content: ""; width: 12px; height: 12px; background: var(--accent); border-radius: 3px; }
      h1 { font-size: 18px; line-height: 1.2; margin: 0; letter-spacing: 0; }
      .lede { color: var(--muted); font-size: 13px; line-height: 1.5; margin: 6px 0 0; }
      form { display: grid; gap: 14px; }
      label { display: grid; gap: 7px; color: var(--muted); font-size: 12px; font-weight: 650; }
      input, select {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #fff;
        color: var(--ink);
        min-height: 42px;
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
      .run:disabled { opacity: .55; cursor: wait; }
      .status {
        margin-top: 18px;
        min-height: 44px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel-2);
        padding: 12px;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.4;
      }
      main { padding: 24px; overflow: auto; }
      .empty {
        min-height: calc(100vh - 48px);
        border: 1px solid var(--line);
        border-radius: 8px;
        background: rgba(255,255,255,.66);
        display: grid;
        place-items: center;
        color: var(--muted);
        text-align: center;
        padding: 28px;
      }
      .result { display: none; gap: 18px; }
      .result.active { display: grid; }
      .topbar {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: flex-start;
      }
      .title h2 { margin: 0; font-size: 26px; letter-spacing: 0; }
      .title p { margin: 6px 0 0; color: var(--muted); }
      .actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
      .actions a {
        border: 1px solid var(--line);
        background: #fff;
        color: var(--ink);
        text-decoration: none;
        border-radius: 8px;
        padding: 9px 11px;
        font-size: 13px;
        font-weight: 700;
      }
      .grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 14px; }
      section {
        background: rgba(255,255,255,.86);
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 16px;
      }
      section h3 { margin: 0 0 12px; font-size: 13px; letter-spacing: 0; text-transform: uppercase; color: var(--muted); }
      .wide { grid-column: span 12; }
      .half { grid-column: span 6; }
      .third { grid-column: span 4; }
      .swatches { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
      .swatch { border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: #fff; }
      .chip { height: 64px; border-bottom: 1px solid var(--line); }
      .swatch div:last-child { padding: 9px; display: grid; gap: 3px; min-width: 0; }
      code { color: var(--muted); font-size: 12px; overflow-wrap: anywhere; }
      .list { display: grid; gap: 8px; }
      .row { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--line); padding-bottom: 8px; }
      .row:last-child { border-bottom: 0; padding-bottom: 0; }
      .row strong { font-size: 13px; }
      .row span { color: var(--muted); font-size: 12px; text-align: right; }
      .screens { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
      .shot { border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: #fff; }
      .shot img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; display: block; border-bottom: 1px solid var(--line); }
      .shot p { margin: 0; padding: 9px; color: var(--muted); font-size: 12px; }
      .pages { color: var(--muted); font-size: 13px; line-height: 1.55; }
      .error { color: #9f1239; }
      @media (max-width: 860px) {
        .shell { grid-template-columns: 1fr; }
        .side { border-right: 0; border-bottom: 1px solid var(--line); }
        .topbar { display: grid; }
        .actions { justify-content: flex-start; }
        .half, .third { grid-column: span 12; }
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
            <p class="lede">The app will inspect internal pages, render desktop/tablet/mobile, and assemble style evidence.</p>
          </div>
        </div>
        <div id="result" class="result">
          <div class="topbar">
            <div class="title">
              <h2 id="result-title">Style extraction</h2>
              <p id="result-meta"></p>
            </div>
            <div class="actions">
              <a id="open-preview" href="#" target="_blank" rel="noreferrer">Preview</a>
              <a id="open-design" href="#" target="_blank" rel="noreferrer">DESIGN.md</a>
              <a id="open-evidence" href="#" target="_blank" rel="noreferrer">Evidence</a>
            </div>
          </div>
          <div class="grid">
            <section class="wide">
              <h3>Screenshots</h3>
              <div id="screens" class="screens"></div>
            </section>
            <section class="half">
              <h3>Colors</h3>
              <div id="colors" class="swatches"></div>
            </section>
            <section class="half">
              <h3>Typography</h3>
              <div id="typography" class="list"></div>
            </section>
            <section class="third">
              <h3>Components</h3>
              <div id="components" class="list"></div>
            </section>
            <section class="third">
              <h3>Pages</h3>
              <div id="pages" class="pages"></div>
            </section>
            <section class="third">
              <h3>Discovered</h3>
              <div id="discovered" class="pages"></div>
            </section>
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

      function setRows(id, rows, render) {
        document.getElementById(id).innerHTML = rows.length ? rows.map(render).join('') : '<p class="lede">No data found.</p>';
      }

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        run.disabled = true;
        status.textContent = 'Discovering internal pages and rendering viewports...';

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

          empty.style.display = 'none';
          result.classList.add('active');
          document.getElementById('result-title').textContent = new URL(data.url).hostname;
          document.getElementById('result-meta').textContent = data.summary.pages.length + ' pages inspected';
          document.getElementById('open-preview').href = data.artifacts.previewHtml;
          document.getElementById('open-design').href = data.artifacts.designMd;
          document.getElementById('open-evidence').href = data.artifacts.evidenceJson;

          setRows('colors', data.summary.colors, (color) =>
            '<article class="swatch"><div class="chip" style="background:' + color.value + '"></div><div><strong>' + color.name + '</strong><code>' + color.value + '</code><code>' + color.confidence + ' - ' + color.role + '</code></div></article>'
          );
          setRows('typography', data.summary.typography, (type) =>
            '<div class="row"><strong>' + type.role + '</strong><span>' + type.fontFamily + '<br>' + type.fontSize + ' / ' + type.fontWeight + ' / ' + type.confidence + '</span></div>'
          );
          setRows('components', data.summary.components, (component) =>
            '<div class="row"><strong>' + component.name + '</strong><span>' + component.count + ' samples<br>' + component.confidence + '</span></div>'
          );
          setRows('screens', data.summary.screenshots, (shot) =>
            '<article class="shot"><a href="' + shot.href + '" target="_blank" rel="noreferrer"><img src="' + shot.href + '" alt="' + shot.viewport + ' screenshot"></a><p>' + shot.viewport + '</p></article>'
          );
          document.getElementById('pages').innerHTML = data.summary.pages.map((page) => '<div>' + page.status + ' - ' + page.url + '</div>').join('');
          document.getElementById('discovered').innerHTML = data.discoveredPages.length ? data.discoveredPages.map((page) => '<div>' + page + '</div>').join('') : '<p class="lede">No additional pages discovered.</p>';
          status.textContent = 'Extraction complete: ' + data.runId;
        } catch (error) {
          status.innerHTML = '<span class="error">' + error.message + '</span>';
        } finally {
          run.disabled = false;
        }
      });
    </script>
  </body>
</html>`;
}
