import { tokensCss } from './css/tokens.js';
import { baseCss } from './css/base.js';
import { layoutCss } from './css/layout.js';
import { sectionsCss } from './css/sections.js';
import { resultThemeCss } from './css/result-theme.js';
import { responsiveCss } from './css/responsive.js';
import { colorsCss, colorsJs } from './sections/colors.js';
import { typographyCss, typographyJs } from './sections/typography.js';
import {
  tokensSectionCss,
  tokensSectionJs,
} from './sections/tokens-section.js';
import { componentsCss, componentsJs } from './sections/components.js';
import { coverageCss, coverageJs } from './sections/coverage.js';
import { utilsJs } from './client/utils.js';
import { colorUtilsJs } from './client/color-utils.js';
import { highlightCss, highlightJs } from './client/highlight.js';
import { themeJs } from './client/theme.js';
import { profileJs } from './client/profile.js';
import { exportsTokensJs } from './client/exports-tokens.js';
import { exportsDownloadsJs } from './client/exports-downloads.js';
import {
  settingsCss,
  settingsJs,
  settingsModalHtml,
} from './client/settings.js';
import { copyCss, copyJs } from './client/copy.js';
import { accordionCss, accordionJs } from './client/accordion.js';
import { apiJs } from './client/api.js';

function css(): string {
  return [
    tokensCss(),
    baseCss(),
    layoutCss(),
    sectionsCss(),
    resultThemeCss(),
    responsiveCss(),
    colorsCss(),
    typographyCss(),
    tokensSectionCss(),
    componentsCss(),
    coverageCss(),
    settingsCss(),
    copyCss(),
    accordionCss(),
    highlightCss(),
  ].join('\n');
}

function js(): string {
  return [
    utilsJs(),
    colorUtilsJs(),
    highlightJs(),
    themeJs(),
    profileJs(),
    exportsTokensJs(),
    exportsDownloadsJs(),
    colorsJs(),
    typographyJs(),
    tokensSectionJs(),
    componentsJs(),
    coverageJs(),
    settingsJs(),
    copyJs(),
    accordionJs(),
    apiJs(),
  ].join('\n');
}

export function renderAppHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Design MD Extractor</title>
    <style>
${css()}
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
              <option value="7" selected>Broad · 7 pages</option>
              <option value="4">Quick · 4 pages</option>
              <option value="12">Deep · 12 pages</option>
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
        <div class="side-right">
          <div id="status" class="status" role="status" aria-live="polite">Idle</div>
          <button id="open-settings" class="settings-btn" type="button" aria-label="Settings" title="Settings" aria-haspopup="dialog" aria-controls="settings-modal"></button>
        </div>
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
                <h2>Hero Capture</h2>
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
                <div id="components" class="component-specimen-grid"></div>
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
              <div class="tabs">
                <button class="tab active" type="button" data-tab="design">DESIGN.md</button>
                <button class="tab" type="button" data-tab="css">CSS Vars</button>
                <button class="tab" type="button" data-tab="tailwind">Tailwind v4</button>
                <button class="tab" type="button" data-tab="json">JSON</button>
                <button class="tab" type="button" data-tab="prompt">AI Prompt</button>
                <button id="download-bundle-top" class="download-btn bundle-btn tabs-bundle" type="button">Download all (.zip)</button>
              </div>
              <div class="export-actions">
                <div class="mode-tabs" aria-label="Preview length">
                  <button class="mode-btn" type="button" data-mode="compact">Compact</button>
                  <button class="mode-btn active" type="button" data-mode="extended">Extended</button>
                </div>
                <div class="export-tools">
                  <button id="copy-active" class="copy-btn" type="button">Copy</button>
                  <button id="download-active" class="download-btn" type="button">Download</button>
                </div>
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
    ${settingsModalHtml()}
    <script>
${js()}
    </script>
  </body>
</html>`;
}
