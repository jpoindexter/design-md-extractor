import type { Evidence } from '../types/evidence.js';
import { generateStyleCss } from './generateStyleCss.js';

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function generatePreviewHtml(evidence: Evidence): string {
  const swatches = evidence.tokens.colors
    .map(
      (color) =>
        `<section class="swatch"><div style="background:${color.value}"></div><strong>${color.name}</strong><code>${color.value}</code><p>${color.role}</p></section>`,
    )
    .join('\n');
  const cssPreview = escapeHtml(generateStyleCss(evidence).trim());

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Design MD Preview</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; padding: 32px; color: #111; background: #fff; }
      main { max-width: 1120px; margin: 0 auto; }
      header { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
      h1 { margin: 0; }
      .downloads { display: flex; flex-wrap: wrap; gap: 8px; }
      .downloads a { border: 1px solid #d4d4d4; border-radius: 6px; color: #111; padding: 8px 10px; text-decoration: none; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
      .swatch { border: 1px solid #e5e5e5; border-radius: 8px; padding: 12px; }
      .swatch div { height: 80px; border-radius: 6px; border: 1px solid rgba(0,0,0,.1); }
      code { display: block; margin-top: 6px; color: #555; }
      pre { border: 1px solid #e5e5e5; border-radius: 8px; overflow: auto; padding: 16px; background: #fafafa; }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>Design MD Preview</h1>
        <nav class="downloads" aria-label="Artifact downloads">
          <a href="DESIGN.md" download>DESIGN.md</a>
          <a href="tokens.css" download>tokens.css</a>
          <a href="evidence.json" download>evidence.json</a>
        </nav>
      </header>
      <h2>Colors</h2>
      <div class="grid">${swatches}</div>
      <h2>CSS Tokens</h2>
      <pre><code>${cssPreview}</code></pre>
    </main>
  </body>
</html>`;
}
