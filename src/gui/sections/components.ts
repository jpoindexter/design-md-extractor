// Browser JS globals available at runtime:
// escapeHtml, contrastTextColor, safeColorValue, currentTheme, currentHostname, currentThesis
// specimenStyleForComponent, cleanComponentLabel, pickPreviewComponents, pickReadableTextColor, selectAccentColor

export function componentsCss(): string {
  // .component-specimen-grid + all specimen styles live in css/sections.ts (single source of truth).
  return '';
}

export function componentsJs(): string {
  return `
// Atoms (button/link/badge/input) show their real short label; containers (card/nav)
// show a clean heading + body in the EXTRACTED font instead of the page's garbled,
// node-concatenated text — demonstrates the typeface without the trashy run-on copy.
function specimenInner(kind, label, name) {
  if (kind === 'button' || kind === 'link' || kind === 'badge' || kind === 'input') {
    return '<span>' + escapeHtml(label || name || 'Label') + '</span>';
  }
  return '<strong class="specimen-head">' + escapeHtml(name || 'Card') + '</strong>' +
    '<span class="specimen-body">The quick brown fox jumps over the lazy dog.</span>';
}

function renderComponents(components, tokenData) {
  var target = document.getElementById('components');
  if (!target) return;
  if (!components.length) {
    target.innerHTML = '<p class="muted">No component signals found.</p>';
    return;
  }
  target.innerHTML = components
    .map(function(component) {
      var styles = component.styles || {};
      var kind = String(component.kind || 'component').toLowerCase();
      var name = component.name || 'Component';
      var label = cleanComponentLabel(component, component.role || name || 'Component');
      var count = String(component.count || 0);
      var confidence = component.confidence || 'low';
      var objectContent = specimenInner(kind, label, name);
      var metaLine = [
        styles.border ? 'border ' + styles.border : '',
        styles.borderRadius ? 'radius ' + styles.borderRadius : '',
        styles.padding ? 'padding ' + styles.padding : '',
        styles.boxShadow && styles.boxShadow !== 'none' ? 'shadow' : '',
      ].filter(Boolean).join(' \xb7 ');
      var copyRule = '.' + kind + ' {\\n' + [
        styles.color ? '  color: ' + styles.color + ';' : '',
        styles.backgroundColor ? '  background: ' + styles.backgroundColor + ';' : '',
        styles.border ? '  border: ' + styles.border + ';' : '',
        styles.borderRadius ? '  border-radius: ' + styles.borderRadius + ';' : '',
        styles.padding ? '  padding: ' + styles.padding + ';' : '',
        styles.fontFamily ? '  font-family: ' + styles.fontFamily + ';' : '',
        styles.fontSize ? '  font-size: ' + styles.fontSize + ';' : '',
        styles.fontWeight ? '  font-weight: ' + styles.fontWeight + ';' : '',
        styles.boxShadow && styles.boxShadow !== 'none' ? '  box-shadow: ' + styles.boxShadow + ';' : '',
      ].filter(Boolean).join('\\n') + '\\n}';
      return [
        '<article class="component-specimen has-copy">',
        '<button class="copy-chip" type="button" aria-label="Copy" title="Copy CSS rule" data-copy="' + escapeHtml(copyRule) + '"></button>',
        '<div class="component-specimen-stage">',
        '<div class="component-specimen-object is-' + escapeHtml(kind) + '" style="' +
          escapeHtml(specimenStyleForComponent(component, tokenData)) +
        '">' + objectContent + '</div>',
        '</div>',
        '<div class="component-specimen-info">',
        '<strong class="component-specimen-title">' +
          escapeHtml(name) +
          ' <span class="component-specimen-count">\xb7 ' + escapeHtml(count) + ' samples</span> ' +
          '<span class="token-confidence ' + escapeHtml(confidence) + '">' + escapeHtml(confidence) + '</span>' +
        '</strong>',
        metaLine
          ? '<code class="component-specimen-meta">' + escapeHtml(metaLine) + '</code>'
          : '',
        '</div>',
        '</article>',
      ].join('');
    })
    .join('');
}

function renderComponentPreview(tokenData) {
  var target = document.getElementById('component-preview');
  if (!target) return;
  var surface = currentTheme ? currentTheme.surface : tokenData.surfaces[0] ? safeColorValue(tokenData.surfaces[0].value) : '#ffffff';
  var textColor = currentTheme ? currentTheme.text : pickReadableTextColor(tokenData.colors, surface);
  var accent = currentTheme ? currentTheme.accent : selectAccentColor(tokenData, surface);
  var accentText = contrastTextColor(accent);
  var headlineFont = currentTheme ? currentTheme.fonts.display : tokenData.typography[0] ? tokenData.typography[0].fontFamily : 'sans-serif';
  var bodyFont = currentTheme ? currentTheme.fonts.body : tokenData.typography[1] ? tokenData.typography[1].fontFamily : headlineFont;
  var sampleComponents = pickPreviewComponents(tokenData.components);
  var sampleHtml = sampleComponents.length
    ? [
        '<div class="component-samples">',
        sampleComponents
          .map(function(component) {
            var kind = String(component.kind || 'component').toLowerCase();
            var label = cleanComponentLabel(component, component.role || component.name || component.kind || 'Component');
            var content = specimenInner(kind, label, component.name || 'Component');
            return '<div class="sample-component component-specimen-object is-' + escapeHtml(kind) + '" style="' +
              escapeHtml(specimenStyleForComponent(component, tokenData)) +
            '">' + content + '</div>';
          })
          .join(''),
        '</div>',
      ].join('')
    : '';
  var paletteHtml = tokenData.colors.length
    ? '<div class="preview-palette">' +
        tokenData.colors.slice(0, 5).map(function(color) {
          return '<span style="background:' + escapeHtml(safeColorValue(color.value)) + '"></span>';
        }).join('') +
      '</div>'
    : '';
  var firstStyled = sampleComponents[0] || tokenData.components.find(function(c) { return c.styles; }) || null;
  var firstStyles = firstStyled && firstStyled.styles ? firstStyled.styles : {};
  var styleGrid = [
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
    styleGrid.map(function(entry) {
      return '<div class="style-chip"><strong>' + escapeHtml(entry[0]) + '</strong>' + escapeHtml(entry[1]) + '</div>';
    }).join(''),
    '</div>',
    '</div>',
  ].join('');
}
`.trim();
}
