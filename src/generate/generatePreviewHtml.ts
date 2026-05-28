import type { Evidence } from '../types/evidence.js';

export function generatePreviewHtml(evidence: Evidence): string {
  const swatches = evidence.tokens.colors
    .map(
      (color) =>
        `<section class="swatch"><div style="background:${color.value}"></div><strong>${color.name}</strong><code>${color.value}</code><p>${color.role}</p></section>`,
    )
    .join('\n');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Design MD Preview</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; padding: 32px; color: #111; background: #fff; }
      main { max-width: 1120px; margin: 0 auto; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
      .swatch { border: 1px solid #e5e5e5; border-radius: 8px; padding: 12px; }
      .swatch div { height: 80px; border-radius: 6px; border: 1px solid rgba(0,0,0,.1); }
      code { display: block; margin-top: 6px; color: #555; }
    </style>
  </head>
  <body>
    <main>
      <h1>Design MD Preview</h1>
      <h2>Colors</h2>
      <div class="grid">${swatches}</div>
    </main>
  </body>
</html>`;
}
