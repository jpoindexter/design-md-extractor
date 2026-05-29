// Browser JS globals available at runtime:
// escapeHtml, confidenceRank, safeColorValue, normalizeList, colorCategorySummary

export function colorsCss(): string {
  return '';
}

export function colorsJs(): string {
  return `
function renderColorCategories(colors) {
  var target = document.getElementById('color-categories');
  if (!target) return;
  var groups = colorCategorySummary(colors);
  var renderGroup = function(title, list) {
    var items = normalizeList(list);
    var names = items.map(function(item) { return item.name || item.value || 'n/a'; });
    var dots = items.map(function(c) {
      return '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' +
        escapeHtml(safeColorValue(c.value)) +
        ';border:1px solid rgba(0,0,0,0.12)"></span>';
    }).join('');
    return [
      '<article class="category">',
      '<h4>' + escapeHtml(title) + '</h4>',
      dots
        ? '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px;">' + dots + '</div>'
        : '',
      '<p class="muted">' + escapeHtml(names.length ? names.join(' \xb7 ') : 'No tokens detected') + '</p>',
      '</article>',
    ].join('');
  };
  target.innerHTML = [
    renderGroup('Brand', groups.brand),
    renderGroup('Accents', groups.accents),
    renderGroup('Neutrals', groups.neutrals),
  ].join('');
}

function renderColors(colors) {
  var target = document.getElementById('colors');
  if (!target) return;
  if (!colors.length) {
    target.innerHTML = '<p class="muted">No color tokens found.</p>';
    return;
  }
  target.innerHTML = colors
    .slice()
    .sort(function(a, b) { return confidenceRank(b.confidence) - confidenceRank(a.confidence); })
    .map(function(color, index) {
      var cssVarLine = color.cssVariable
        ? '<code style="font-size:10px;color:var(--quiet)">' + escapeHtml(color.cssVariable) + '</code>'
        : '';
      return [
        '<article class="swatch-item has-copy">',
        '<button class="copy-chip" type="button" aria-label="Copy" title="Copy color" data-copy="' + escapeHtml(color.value || '') + '"></button>',
        '<div class="swatch-chip" style="background:' + escapeHtml(safeColorValue(color.value)) + '"></div>',
        '<div class="swatch-meta">',
        '<strong>' + escapeHtml(color.name || ('Color ' + (index + 1))) + '</strong>',
        '<code>' + escapeHtml(color.value || '') + '</code>',
        '<span class="token-confidence ' + escapeHtml(color.confidence || 'low') + '">' +
          escapeHtml(color.role || 'token') + ' \xb7 ' + escapeHtml(color.confidence || 'low') +
        '</span>',
        cssVarLine,
        '</div>',
        '</article>',
      ].join('');
    })
    .join('');
}
`.trim();
}
