export function accordionCss(): string {
  return `
    /* collapsible reference sections so the report isn't one long scroll */
    .result.refero-layout .accordion { border-top: 1px solid var(--line); padding: 22px 0; margin-top: 0; }
    .result.refero-layout .accordion + .accordion { margin-top: 0; }
    .result.refero-layout .accordion.is-collapsed { padding: 18px 0; }
    .result.refero-layout .accordion > h3 { margin: 0 0 22px; }
    .result.refero-layout .accordion.is-collapsed > h3 { margin-bottom: 0; }
    .panel-toggle {
      all: unset;
      box-sizing: border-box;
      display: flex; align-items: center; justify-content: space-between; gap: 14px;
      width: 100%; cursor: pointer;
      font: inherit; color: inherit;
    }
    .panel-toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; border-radius: 4px; }
    .panel-toggle-label { min-width: 0; }
    .panel-chevron {
      flex: none; width: 9px; height: 9px;
      border-right: 2px solid var(--quiet); border-bottom: 2px solid var(--quiet);
      transform: rotate(45deg); transform-origin: center; transition: transform 160ms ease; margin-bottom: 4px;
    }
    .panel-toggle:hover .panel-chevron { border-color: var(--ink); }
    .accordion.is-collapsed .panel-chevron { transform: rotate(-45deg); margin-bottom: 0; margin-top: 4px; }
    .accordion.is-collapsed .panel-content { display: none; }
    @media (prefers-reduced-motion: reduce) { .panel-chevron { transition: none; } }
  `;
}

export function accordionJs(): string {
  return `
      (function initAccordions() {
        var openByDefault = ['color palette', 'typography'];
        var panels = Array.from(document.querySelectorAll('.result.refero-layout .reference > .panel'));
        panels.forEach(function(panel) {
          // hero + thesis stay always-visible (their headings are sr-only intros)
          if (panel.classList.contains('reference-hero') || panel.classList.contains('style-summary')) return;
          var h3 = panel.querySelector(':scope > h3');
          if (!h3) return;
          var title = h3.textContent.trim();

          // move everything after the heading into a collapsible content wrapper
          var content = document.createElement('div');
          content.className = 'panel-content';
          content.id = 'acc-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          var node = h3.nextSibling;
          while (node) { var next = node.nextSibling; content.appendChild(node); node = next; }
          panel.appendChild(content);

          var open = openByDefault.indexOf(title.toLowerCase()) !== -1;
          panel.classList.add('accordion');
          if (!open) panel.classList.add('is-collapsed');

          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'panel-toggle';
          btn.setAttribute('aria-expanded', open ? 'true' : 'false');
          btn.setAttribute('aria-controls', content.id);
          var label = document.createElement('span');
          label.className = 'panel-toggle-label';
          label.textContent = title;
          var chevron = document.createElement('span');
          chevron.className = 'panel-chevron';
          chevron.setAttribute('aria-hidden', 'true');
          h3.textContent = '';
          btn.appendChild(label);
          btn.appendChild(chevron);
          h3.appendChild(btn);

          btn.addEventListener('click', function() {
            var collapsed = panel.classList.toggle('is-collapsed');
            btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
          });
        });
      })();
  `;
}
