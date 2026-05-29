export function highlightCss(): string {
  return `
    /* lightweight syntax coloring for the export code blocks (frost background) */
    .tok-heading { color: #1d4ed8; font-weight: 650; }
    .tok-color { color: #0e7490; }
    .tok-var { color: #c2410c; }
    .tok-str { color: #15803d; }
    .tok-num { color: #9a3412; }
  `;
}

export function highlightJs(): string {
  return `
      // Single-pass tokenizer: escapes every gap AND token through escapeHtml, so
      // it is XSS-safe; rules are backslash-free to survive the template literal.
      function hlRules() {
        return [
          { re: /^#{1,6} .*/gm, cls: 'tok-heading' },
          { re: /#[0-9a-fA-F]{3,8}/g, cls: 'tok-color' },
          { re: /--[a-zA-Z0-9-]+/g, cls: 'tok-var' },
          { re: /"[^"]*"/g, cls: 'tok-str' },
          { re: /[0-9]+(?:[.][0-9]+)?(?:px|rem|em|%|deg|ms|s)?/g, cls: 'tok-num' }
        ];
      }
      function highlightCode(raw) {
        var text = String(raw || '');
        var rules = hlRules();
        var combined = new RegExp(rules.map(function(r) { return '(?:' + r.re.source + ')'; }).join('|'), 'gm');
        var anchored = rules.map(function(r) { return new RegExp('^(?:' + r.re.source + ')$', 'm'); });
        var out = '', last = 0, m;
        while ((m = combined.exec(text)) !== null) {
          if (m[0].length === 0) { combined.lastIndex++; continue; }
          if (m.index > last) out += escapeHtml(text.slice(last, m.index));
          var cls = '';
          for (var i = 0; i < anchored.length; i++) {
            if (anchored[i].test(m[0])) { cls = rules[i].cls; break; }
          }
          out += cls ? '<span class="' + cls + '">' + escapeHtml(m[0]) + '</span>' : escapeHtml(m[0]);
          last = m.index + m[0].length;
        }
        if (last < text.length) out += escapeHtml(text.slice(last));
        return out;
      }
      function renderCode(elId, text) {
        var el = typeof elId === 'string' ? document.getElementById(elId) : elId;
        if (!el) return;
        el.innerHTML = highlightCode(text);
      }
  `;
}
