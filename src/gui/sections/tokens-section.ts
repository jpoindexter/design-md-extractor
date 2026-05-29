// Browser JS globals available at runtime:
// escapeHtml, cssTokenValue, clampPaddingValue, safeColorValue, contrastTextColor

export function tokensSectionCss(): string {
  return '';
}

export function tokensSectionJs(): string {
  return `
function renderSpacingTokens(rows) {
  var target = document.getElementById('spacing-body');
  if (!target) return;
  if (!rows.length) {
    target.innerHTML = '<p class="muted">No spacing tokens found.</p>';
    return;
  }
  target.innerHTML = rows
    .map(function(item) {
      var value = cssTokenValue(item.value, '0px');
      var previewPadding = clampPaddingValue(value);
      return [
        '<article class="visual-token-card has-copy">',
        '<button class="copy-chip" type="button" aria-label="Copy" title="Copy value" data-copy="' + escapeHtml('padding: ' + value + ';') + '"></button>',
        '<h4>' + escapeHtml(item.name || 'Padding') + '</h4>',
        '<div class="token-demo padding-demo" style="padding:' + escapeHtml(previewPadding) + '">',
        '<div class="padding-demo-inner">content</div>',
        '</div>',
        '<code class="token-code">padding: ' + escapeHtml(value) + '</code>',
        '<span class="token-confidence ' + escapeHtml(item.confidence || 'low') + '">' +
          escapeHtml(item.confidence || 'low') +
        '</span>',
        '</article>',
      ].join('');
    })
    .join('');
}

function renderRadiusTokens(rows) {
  var target = document.getElementById('radii-body');
  if (!target) return;
  if (!rows.length) {
    target.innerHTML = '<p class="muted">No radius tokens found.</p>';
    return;
  }
  target.innerHTML = rows
    .map(function(item) {
      var value = cssTokenValue(item.value, '0px');
      return [
        '<article class="visual-token-card has-copy">',
        '<button class="copy-chip" type="button" aria-label="Copy" title="Copy value" data-copy="' + escapeHtml('border-radius: ' + value + ';') + '"></button>',
        '<h4>' + escapeHtml(item.name || 'Radius') + '</h4>',
        '<div class="radius-demo" style="border-radius:' + escapeHtml(value) + '"></div>',
        '<code class="token-code">border-radius: ' + escapeHtml(value) + '</code>',
        '<span class="token-confidence ' + escapeHtml(item.confidence || 'low') + '">' +
          escapeHtml(item.confidence || 'low') +
        '</span>',
        '</article>',
      ].join('');
    })
    .join('');
}

function renderShadowTokens(rows) {
  var target = document.getElementById('shadows-body');
  if (!target) return;
  if (!rows.length) {
    target.innerHTML = [
      '<article class="visual-token-card">',
      '<h4>No shadow tokens found</h4>',
      '<div class="shadow-demo"></div>',
      '<code class="token-code">box-shadow: none</code>',
      '</article>',
    ].join('');
    return;
  }
  target.innerHTML = rows
    .map(function(item) {
      var value = cssTokenValue(item.value, 'none');
      return [
        '<article class="visual-token-card has-copy">',
        '<button class="copy-chip" type="button" aria-label="Copy" title="Copy value" data-copy="' + escapeHtml('box-shadow: ' + value + ';') + '"></button>',
        '<h4>' + escapeHtml(item.name || 'Shadow') + '</h4>',
        '<div class="shadow-demo" style="box-shadow:' + escapeHtml(value) + '"></div>',
        '<code class="token-code">box-shadow: ' + escapeHtml(value) + '</code>',
        '<span class="token-confidence ' + escapeHtml(item.confidence || 'low') + '">' +
          escapeHtml(item.confidence || 'low') +
        '</span>',
        '</article>',
      ].join('');
    })
    .join('');
}

function renderSurfaceTokens(rows) {
  var target = document.getElementById('surfaces-body');
  if (!target) return;
  if (!rows.length) {
    target.innerHTML = '<p class="muted">No surface tokens found.</p>';
    return;
  }
  target.innerHTML = rows
    .map(function(surface) {
      var value = safeColorValue(surface.value || '#ffffff');
      var text = contrastTextColor(value);
      var name = escapeHtml(surface.name || ('Surface ' + surface.level));
      var purpose = escapeHtml(surface.purpose || 'surface');
      var confidence = surface.confidence || 'low';
      return [
        '<article class="visual-token-card has-copy">',
        '<button class="copy-chip" type="button" aria-label="Copy" title="Copy color" data-copy="' + escapeHtml(value) + '"></button>',
        '<div class="surface-demo" style="background:' + escapeHtml(value) + ';color:' + escapeHtml(text) + '">',
        '<strong style="font-size:13px">' + name + '</strong>',
        '<code style="font-size:11px;opacity:0.8">' + escapeHtml(value) + '</code>',
        '</div>',
        '<p style="font-size:11px;color:var(--muted);margin:6px 0 0">' + purpose + '</p>',
        '<span class="token-confidence ' + escapeHtml(confidence) + '">' + escapeHtml(confidence) + '</span>',
        '</article>',
      ].join('');
    })
    .join('');
}
`.trim();
}
