import type { Evidence } from '../types/evidence.js';
import { cssVariable, generateStyleCss, slug } from './generateStyleCss.js';

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeAttribute(input: string): string {
  return escapeHtml(input).replaceAll("'", '&#39;');
}

function styleTagContent(input: string): string {
  return input.replace(/<\/style/gi, '<\\/style');
}

function surfaceVariable(surface: Evidence['surfaces'][number]): string {
  return cssVariable('surface', surface.name);
}

function colorVariable(
  color: Evidence['tokens']['colors'][number] | undefined,
): string | undefined {
  return color
    ? (color.cssVariable ?? cssVariable('color', color.name))
    : undefined;
}

function valueVariableMap(evidence: Evidence): Map<string, string> {
  const variables = new Map<string, string>();

  for (const color of evidence.tokens.colors) {
    variables.set(
      color.value.toLowerCase(),
      color.cssVariable ?? cssVariable('color', color.name),
    );
  }

  for (const surface of evidence.surfaces) {
    variables.set(surface.value.toLowerCase(), surfaceVariable(surface));
  }

  return variables;
}

function variableForValue(
  value: string | undefined,
  valueVariables: Map<string, string>,
): string | undefined {
  if (!value) {
    return undefined;
  }

  const variable = valueVariables.get(value.toLowerCase());
  return variable ? `var(${variable})` : value;
}

function inlineStyle(styles: Array<[string, string | undefined]>): string {
  return styles
    .filter((style): style is [string, string] => Boolean(style[1]))
    .map(([property, value]) => `${property}:${value};`)
    .join('');
}

function typographySamples(evidence: Evidence): string {
  if (evidence.tokens.typography.length === 0) {
    return '<p class="empty-state">No typography tokens were confidently detected.</p>';
  }

  return evidence.tokens.typography
    .map((typography) => {
      const role = slug(typography.role);
      const style = inlineStyle([
        ['font-family', `var(--font-${role})`],
        ['font-size', `var(--font-size-${role})`],
        ['font-weight', `var(--font-weight-${role})`],
        ['line-height', `var(--line-height-${role})`],
        ['letter-spacing', `var(--letter-spacing-${role})`],
      ]);
      return `<section class="type-sample"><span>${escapeHtml(typography.role)}</span><p class="type-line" style="${escapeAttribute(style)}">Extracted ${escapeHtml(typography.role)} typography</p><code>${escapeHtml(typography.fontFamily)} / ${escapeHtml(typography.fontSize)}</code></section>`;
    })
    .join('\n');
}

function swatches(evidence: Evidence): string {
  return evidence.tokens.colors
    .map((color) => {
      const variable = color.cssVariable ?? cssVariable('color', color.name);
      return `<section class="swatch"><div class="swatch-chip" style="background:var(${escapeAttribute(variable)})"></div><strong>${escapeHtml(color.name)}</strong><code>${escapeHtml(variable)}: ${escapeHtml(color.value)}</code><p>${escapeHtml(color.role)}</p></section>`;
    })
    .join('\n');
}

function surfaceSamples(evidence: Evidence): string {
  if (evidence.surfaces.length === 0) {
    return '<p class="empty-state">No surface tokens were confidently detected.</p>';
  }

  return evidence.surfaces
    .map((surface) => {
      const variable = surfaceVariable(surface);
      return `<section class="surface-card"><div class="surface-sample" style="background:var(${escapeAttribute(variable)});"></div><strong>${escapeHtml(surface.name)}</strong><code>${escapeHtml(variable)}: ${escapeHtml(surface.value)}</code><p>${escapeHtml(surface.purpose)}</p></section>`;
    })
    .join('\n');
}

function tokenCard(
  token: { name: string; value: string; confidence: string },
  prefix: string,
  className: string,
  label: string,
): string {
  const variable = cssVariable(prefix, token.name);
  return `<section class="token-card token-card-${className}" style="--token-value:var(${escapeAttribute(variable)});"><span>${escapeHtml(label)}</span><strong>${escapeHtml(token.name)}</strong><code>${escapeHtml(variable)}: ${escapeHtml(token.value)}</code><div class="token-visual" aria-hidden="true"></div></section>`;
}

function tokenCards(evidence: Evidence): string {
  const cards = [
    ...evidence.tokens.spacing
      .slice(0, 4)
      .map((token) => tokenCard(token, 'space', 'spacing', 'Spacing')),
    ...evidence.tokens.radii
      .slice(0, 4)
      .map((token) => tokenCard(token, 'radius', 'radius', 'Radius')),
    ...evidence.tokens.shadows
      .slice(0, 4)
      .map((token) => tokenCard(token, 'shadow', 'shadow', 'Shadow')),
  ];

  return cards.length > 0
    ? cards.join('\n')
    : '<p class="empty-state">No spacing, radius, or shadow tokens were confidently detected.</p>';
}

function componentSamples(evidence: Evidence): string {
  if (evidence.components.length === 0) {
    return '<p class="empty-state">No reusable component samples were confidently detected.</p>';
  }

  const valueVariables = valueVariableMap(evidence);

  return evidence.components
    .slice(0, 6)
    .map((component) => {
      const style = inlineStyle([
        [
          'background',
          variableForValue(
            component.styles.backgroundColor ?? component.styles.background,
            valueVariables,
          ),
        ],
        ['color', variableForValue(component.styles.color, valueVariables)],
        [
          'border-color',
          variableForValue(component.styles.borderColor, valueVariables),
        ],
        ['border-radius', component.styles.borderRadius],
        ['box-shadow', component.styles.boxShadow],
        ['padding', component.styles.padding],
      ]);
      const label = component.textSample || component.name;
      const kind = slug(component.kind);
      return `<section class="component-card"><strong>${escapeHtml(component.name)}</strong><p>${escapeHtml(component.role)}</p><div class="component-sample component-sample-${kind}" style="${escapeAttribute(style)}">${escapeHtml(label)}</div></section>`;
    })
    .join('\n');
}

function textColorToken(
  evidence: Evidence,
): Evidence['tokens']['colors'][number] | undefined {
  return (
    evidence.tokens.colors.find((color) =>
      color.properties.includes('color'),
    ) ?? evidence.tokens.colors[0]
  );
}

function accentColorToken(
  evidence: Evidence,
): Evidence['tokens']['colors'][number] | undefined {
  return (
    evidence.tokens.colors.find((color) =>
      /accent|brand|button|action/i.test(color.role),
    ) ??
    evidence.tokens.colors.find(
      (color) =>
        color.properties.includes('background-color') &&
        !/canvas|page|background/i.test(color.role),
    ) ??
    evidence.tokens.colors[1] ??
    evidence.tokens.colors[0]
  );
}

function uiShowcase(evidence: Evidence): string {
  const textVariable = colorVariable(textColorToken(evidence));
  const accentVariable = colorVariable(accentColorToken(evidence));
  const surface = evidence.surfaces[1] ?? evidence.surfaces[0];
  const surfaceValue = surface
    ? `var(${surfaceVariable(surface)})`
    : 'var(--preview-surface)';
  const textValue = textVariable
    ? `var(${textVariable})`
    : 'var(--preview-text)';
  const accentValue = accentVariable ? `var(${accentVariable})` : textValue;
  const buttonStyle = inlineStyle([
    ['background', accentValue],
    ['color', textValue],
    ['border-color', textValue],
    ['border-radius', 'var(--preview-radius)'],
    ['box-shadow', 'var(--preview-shadow)'],
    ['padding', 'var(--preview-space) calc(var(--preview-space) * 2)'],
  ]);
  const cardStyle = inlineStyle([
    ['background', surfaceValue],
    ['border-color', accentValue],
    ['border-radius', 'var(--preview-radius)'],
    ['box-shadow', 'var(--preview-shadow)'],
    ['padding', 'calc(var(--preview-space) * 3)'],
  ]);

  return `<section class="report-section ui-showcase" aria-labelledby="ui-showcase-title">
        <div class="section-heading">
          <span>Applied Tokens</span>
          <h2 id="ui-showcase-title">Sample UI</h2>
        </div>
        <div class="showcase-stage">
          <div class="button-row">
            <button class="ui-button ui-button-primary" style="${escapeAttribute(buttonStyle)}" type="button">Primary action</button>
            <button class="ui-button ui-button-secondary" type="button">Secondary</button>
          </div>
          <article class="ui-card" style="${escapeAttribute(cardStyle)}">
            <span>Card surface</span>
            <h3>Extracted interface sample</h3>
            <p>Buttons, borders, surfaces, radius, spacing, and shadow use the same CSS variables exported below.</p>
          </article>
        </div>
      </section>`;
}

export function generatePreviewHtml(evidence: Evidence): string {
  const tokenCss = generateStyleCss(evidence).trim();
  const cssPreview = escapeHtml(tokenCss);
  const textColorVariable = colorVariable(textColorToken(evidence));
  const accentColorVariable = colorVariable(accentColorToken(evidence));
  const typographyRole = evidence.tokens.typography[0]
    ? slug(evidence.tokens.typography[0].role)
    : undefined;
  const spacingVariable = evidence.tokens.spacing[0]
    ? cssVariable('space', evidence.tokens.spacing[0].name)
    : undefined;
  const radiusVariable = evidence.tokens.radii[0]
    ? cssVariable('radius', evidence.tokens.radii[0].name)
    : undefined;
  const shadowVariable = evidence.tokens.shadows[0]
    ? cssVariable('shadow', evidence.tokens.shadows[0].name)
    : undefined;
  const radiusValue = radiusVariable
    ? `var(${radiusVariable})`
    : 'var(--preview-radius)';
  const shadowValue = shadowVariable
    ? `var(${shadowVariable})`
    : 'var(--preview-shadow)';
  const canvasSurface = evidence.surfaces[0];
  const raisedSurface = evidence.surfaces[1] ?? canvasSurface;
  const canvas = canvasSurface
    ? `var(${surfaceVariable(canvasSurface)})`
    : '#ffffff';
  const surface = raisedSurface
    ? `var(${surfaceVariable(raisedSurface)})`
    : 'color-mix(in srgb, var(--preview-canvas, #ffffff) 94%, currentColor 6%)';

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Design MD Preview</title>
    <style>
${styleTagContent(tokenCss)}
      :root { --preview-canvas: ${canvas}; --preview-surface: ${surface}; --preview-text: ${textColorVariable ? `var(${textColorVariable})` : '#111111'}; --preview-accent: ${accentColorVariable ? `var(${accentColorVariable})` : 'currentColor'}; --preview-space: ${spacingVariable ? `var(${spacingVariable})` : '12px'}; --preview-radius: ${radiusVariable ? `var(${radiusVariable})` : '8px'}; --preview-shadow: ${shadowVariable ? `var(${shadowVariable})` : 'none'}; }
      * { box-sizing: border-box; }
      body { font-family: ${typographyRole ? `var(--font-${typographyRole}, system-ui, sans-serif)` : 'system-ui, sans-serif'}; margin: 0; padding: calc(var(--preview-space) * 4); color: ${textColorVariable ? `var(${textColorVariable})` : 'var(--preview-text, #111111)'}; background: var(--preview-canvas, #ffffff); }
      main { max-width: 1120px; margin: 0 auto; display: grid; gap: calc(var(--preview-space) * 4); }
      .report-header { display: flex; align-items: end; justify-content: space-between; gap: calc(var(--preview-space) * 3); border-bottom: 1px solid color-mix(in srgb, currentColor 18%, transparent); padding-bottom: calc(var(--preview-space) * 3); }
      .eyebrow, .section-heading span, .token-card span, .ui-card span { display: block; font-size: .75rem; font-weight: 700; letter-spacing: 0; text-transform: uppercase; opacity: .66; }
      h1, h2, h3, p { margin-top: 0; }
      h1 { margin-bottom: 0; font-size: 4rem; line-height: 1; letter-spacing: 0; }
      h2 { margin-bottom: 0; font-size: 1.35rem; line-height: 1.15; letter-spacing: 0; }
      h3 { margin-bottom: calc(var(--preview-space) * 1.25); font-size: 1.15rem; line-height: 1.2; letter-spacing: 0; }
      p { line-height: 1.5; }
      .downloads { display: flex; flex-wrap: wrap; gap: 8px; }
      .downloads a { border: 1px solid currentColor; border-radius: var(--preview-radius); color: inherit; padding: 8px 10px; text-decoration: none; }
      .report-section { display: grid; gap: calc(var(--preview-space) * 2); }
      .section-heading { display: grid; gap: calc(var(--preview-space) * .5); }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: calc(var(--preview-space) * 2); }
      .swatch, .type-sample, .component-card, .surface-card, .token-card { border: 1px solid color-mix(in srgb, currentColor 18%, transparent); border-radius: ${radiusValue}; padding: calc(var(--preview-space) * 1.75); background: color-mix(in srgb, var(--preview-surface, #ffffff) 92%, white); box-shadow: ${shadowValue}; }
      .swatch-chip { height: 80px; border-radius: calc(var(--preview-radius, 8px) * .75); border: 1px solid rgba(0,0,0,.14); }
      .surface-sample { height: 80px; border-radius: calc(var(--preview-radius, 8px) * .75); border: 1px solid color-mix(in srgb, currentColor 16%, transparent); }
      .type-sample span, .component-card p, .surface-card p { display: block; margin: 0 0 8px; opacity: .7; }
      .type-sample p { margin: 0; }
      .component-sample { display: inline-flex; align-items: center; justify-content: center; min-height: 40px; max-width: 100%; border: 1px solid color-mix(in srgb, currentColor 25%, transparent); }
      .component-sample-card { display: flex; min-height: 92px; align-items: start; justify-content: start; }
      .token-card { min-height: 136px; display: grid; align-content: start; gap: var(--preview-space); overflow: hidden; }
      .token-visual { min-height: 40px; background: color-mix(in srgb, var(--preview-accent, currentColor) 20%, transparent); border: 1px solid var(--preview-accent, currentColor); }
      .token-card-spacing .token-visual { height: var(--token-value); min-height: var(--token-value); }
      .token-card-radius .token-visual { border-radius: var(--token-value); }
      .token-card-shadow .token-visual { box-shadow: var(--token-value); }
      .showcase-stage { display: grid; grid-template-columns: minmax(220px, .8fr) minmax(260px, 1.2fr); gap: calc(var(--preview-space) * 3); align-items: stretch; border: 1px solid color-mix(in srgb, currentColor 16%, transparent); border-radius: var(--preview-radius); padding: calc(var(--preview-space) * 3); background: color-mix(in srgb, var(--preview-canvas, #ffffff) 88%, white); }
      .button-row { display: flex; flex-wrap: wrap; align-content: start; align-items: center; gap: var(--preview-space); }
      .ui-button { border: 1px solid currentColor; border-radius: var(--preview-radius); font: inherit; min-height: 40px; cursor: default; }
      .ui-button-secondary { background: transparent; color: inherit; padding: var(--preview-space) calc(var(--preview-space) * 2); }
      .ui-card { border: 1px solid; min-height: 180px; }
      .ui-card p { margin-bottom: 0; max-width: 46ch; }
      code { display: block; margin-top: 6px; color: inherit; opacity: .72; }
      pre { border: 1px solid color-mix(in srgb, currentColor 18%, transparent); border-radius: var(--preview-radius); overflow: auto; padding: calc(var(--preview-space) * 2); background: color-mix(in srgb, var(--preview-canvas, #ffffff) 82%, black 4%); }
      @media (max-width: 760px) {
        body { padding: calc(var(--preview-space) * 2); }
        .report-header, .showcase-stage { display: grid; align-items: start; grid-template-columns: 1fr; }
        h1 { font-size: 2.75rem; }
      }
    </style>
  </head>
  <body>
    <main>
      <header class="report-header">
        <div>
          <span class="eyebrow">Static export</span>
          <h1>Design MD Preview</h1>
        </div>
        <nav class="downloads" aria-label="Artifact downloads">
          <a href="DESIGN.md" download>DESIGN.md</a>
          <a href="tokens.css" download>tokens.css</a>
          <a href="evidence.json" download>evidence.json</a>
        </nav>
      </header>
      ${uiShowcase(evidence)}
      <section class="report-section">
        <div class="section-heading">
          <span>Visual Tokens</span>
          <h2>Typography</h2>
        </div>
        <div class="grid">${typographySamples(evidence)}</div>
      </section>
      <section class="report-section">
        <div class="section-heading">
          <span>Palette</span>
          <h2>Colors</h2>
        </div>
        <div class="grid">${swatches(evidence)}</div>
      </section>
      <section class="report-section">
        <div class="section-heading">
          <span>Surface Hierarchy</span>
          <h2>Surfaces</h2>
        </div>
        <div class="grid">${surfaceSamples(evidence)}</div>
      </section>
      <section class="report-section">
        <div class="section-heading">
          <span>Shape And Rhythm</span>
          <h2>Spacing, Radius, Shadow</h2>
        </div>
        <div class="grid">${tokenCards(evidence)}</div>
      </section>
      <section class="report-section">
        <div class="section-heading">
          <span>Observed Patterns</span>
          <h2>Components</h2>
        </div>
        <div class="grid">${componentSamples(evidence)}</div>
      </section>
      <section class="report-section">
        <div class="section-heading">
          <span>Export</span>
          <h2>CSS Tokens</h2>
        </div>
        <pre><code>${cssPreview}</code></pre>
      </section>
    </main>
  </body>
</html>`;
}
