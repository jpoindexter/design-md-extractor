// Browser JS globals available at runtime:
// escapeHtml, normalizeList, numericPx, clampSpecimenSize, typeSpecimenCopy, renderRows

export function typographyCss(): string {
  return `.font-details-grid {
  display: grid;
  gap: 3px;
  margin-top: 8px;
  font-size: 11px;
  color: var(--muted);
  font-family: var(--mono);
  line-height: 1.5;
}`;
}

export function typographyJs(): string {
  return `
function renderTypography(rows) {
  renderRows(
    'typography-body',
    rows,
    function(type) {
      // Render the family name in its own typeface + weight + tracking at a
      // fixed size so each row previews the real style without blowing up row height.
      var sampleStyle =
        'font-family:' + safeCssValue(type.fontFamily, 'inherit') + ';' +
        'font-weight:' + safeCssValue(type.fontWeight, '400') + ';' +
        'letter-spacing:' + safeCssValue(type.letterSpacing, 'normal') + ';' +
        'font-size:15px;line-height:1.3';
      return [
        '<tr>',
        '<td>' + escapeHtml(type.role || 'text') + '</td>',
        '<td style="' + escapeHtml(sampleStyle) + '">' + escapeHtml(type.fontFamily || 'sans-serif') + '</td>',
        '<td>' + escapeHtml((type.fontSize || '16px') + ' / ' + (type.fontWeight || '400')) + '</td>',
        '<td>' + escapeHtml((type.lineHeight || 'normal') + ' / ' + (type.letterSpacing || 'normal')) + '</td>',
        '<td>' + escapeHtml(type.confidence || 'low') + '</td>',
        '</tr>',
      ].join('');
    },
    'No typography tokens found.'
  );
}

function renderTypeScale(rows) {
  var target = document.getElementById('type-scale');
  if (!target) return;
  var sorted = normalizeList(rows)
    .slice()
    .sort(function(a, b) { return numericPx(b.fontSize) - numericPx(a.fontSize); })
    .slice(0, 7);
  if (!sorted.length) {
    target.innerHTML = '<p class="muted">No type scale tokens found.</p>';
    return;
  }
  target.innerHTML = sorted
    .map(function(item) {
      var copyCss = [
        'font-family: ' + (item.fontFamily || 'sans-serif') + ';',
        'font-size: ' + (item.fontSize || '16px') + ';',
        'font-weight: ' + (item.fontWeight || '400') + ';',
        'line-height: ' + (item.lineHeight || 'normal') + ';',
        'letter-spacing: ' + (item.letterSpacing || 'normal') + ';',
      ].join(' ');
      return [
        '<article class="scale-row has-copy">',
        '<button class="copy-chip" type="button" aria-label="Copy" title="Copy CSS" data-copy="' + escapeHtml(copyCss) + '"></button>',
        '<div class="meta">' + escapeHtml(
          (item.role || 'text') + ' \xb7 ' +
          (item.fontSize || '16px') + ' \xb7 ' +
          (item.fontWeight || '400') + ' \xb7 ' +
          (item.lineHeight || 'normal')
        ) + '</div>',
        '<p class="sample" style="' +
          'font-family:' + escapeHtml(safeCssValue(item.fontFamily, 'sans-serif')) + ';' +
          'font-size:' + escapeHtml(clampSpecimenSize(item.fontSize || '16px')) + ';' +
          'font-weight:' + escapeHtml(item.fontWeight || '400') + ';' +
          'line-height:' + escapeHtml(item.lineHeight || '1.1') + ';' +
          'letter-spacing:' + escapeHtml(item.letterSpacing || 'normal') +
        '">' + escapeHtml(typeSpecimenCopy(item)) + '</p>',
        '</article>',
      ].join('');
    })
    .join('');
}

function renderFontCards(rows) {
  var target = document.getElementById('font-cards');
  if (!target) return;
  var grouped = new Map();
  normalizeList(rows).forEach(function(item) {
    var key = item.fontFamily || 'sans-serif';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  });
  var entries = Array.from(grouped.entries()).slice(0, 4);
  if (!entries.length) {
    target.innerHTML = '<p class="muted">No font families detected.</p>';
    return;
  }
  var labels = ['Primary', 'Secondary', 'Additional', 'Additional'];
  target.innerHTML = entries
    .map(function(entry, index) {
      var font = entry[0];
      var items = entry[1];
      var roles = Array.from(new Set(items.map(function(i) { return i.role; }).filter(Boolean))).join(', ');
      var weights = Array.from(new Set(items.map(function(i) { return i.fontWeight; }).filter(Boolean))).join(', ');
      var sizes = Array.from(new Set(items.map(function(i) { return i.fontSize; }).filter(Boolean))).slice(0, 6).join(', ');
      var primaryWeight = items[0] && items[0].fontWeight ? items[0].fontWeight : '400';
      var primaryName = String(font).split(',')[0].trim().replace(/^['"]|['"]$/g, '') || font;
      return [
        '<article class="font-card has-copy">',
        '<button class="copy-chip" type="button" aria-label="Copy" title="Copy font-family" data-copy="' + escapeHtml('font-family: ' + font + ';') + '"></button>',
        '<p class="font-label">' + escapeHtml(labels[index] || 'Additional') + '</p>',
        '<h4 style="font-family:' + escapeHtml(safeCssValue(font, 'sans-serif')) + ';font-size:26px;font-weight:' + escapeHtml(primaryWeight) + ';margin:6px 0;line-height:1.1;">' +
          escapeHtml(primaryName) +
        '</h4>',
        '<div class="font-details-grid">',
        '<span>Roles: ' + escapeHtml(roles || 'text') + '</span>',
        '<span>Weights: ' + escapeHtml(weights || '400') + '</span>',
        '<span>Sizes: ' + escapeHtml(sizes || '16px') + '</span>',
        '<span>Stack: ' + escapeHtml(font) + '</span>',
        '</div>',
        '</article>',
      ].join('');
    })
    .join('');
}
`.trim();
}
