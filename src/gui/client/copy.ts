const COPY_ICON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='9' y='9' width='13' height='13' rx='2'/%3E%3Cpath d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'/%3E%3C/svg%3E\")";

const CHECK_ICON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E\")";

export function copyCss(): string {
  return `
    .copy-chip {
      position: absolute; top: 8px; right: 8px; z-index: 2;
      width: 26px; height: 26px; border: 1px solid var(--line); border-radius: 6px;
      background: var(--canvas); color: var(--quiet); cursor: pointer; padding: 0;
      display: inline-grid; place-items: center; opacity: 0; transition: opacity 100ms ease, color 100ms ease, border-color 100ms ease;
    }
    /* reveal on hover/focus of the owning block (or the chip itself) so it stays clean */
    .has-copy:hover .copy-chip, .copy-chip:focus-visible, .copy-chip.copied { opacity: 1; }
    @media (hover: none) { .copy-chip { opacity: 1; } }
    .copy-chip::before {
      content: ""; width: 14px; height: 14px; background-color: currentColor;
      -webkit-mask: ${COPY_ICON} center / 14px no-repeat; mask: ${COPY_ICON} center / 14px no-repeat;
    }
    .copy-chip:hover { color: var(--ink); border-color: var(--line-strong); }
    .copy-chip:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
    .copy-chip.copied { color: var(--badge-high-color); border-color: var(--badge-high-color); }
    .copy-chip.copied::before { -webkit-mask-image: ${CHECK_ICON}; mask-image: ${CHECK_ICON}; }
    .has-copy { position: relative; }
  `;
}

export function copyJs(): string {
  return `
      (function initCopy() {
        function fallbackCopy(text) {
          try {
            var ta = document.createElement('textarea');
            ta.value = text; ta.setAttribute('readonly', '');
            ta.style.position = 'fixed'; ta.style.top = '-1000px'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            document.execCommand('copy'); ta.remove();
          } catch (e) {}
        }
        function flash(btn) {
          btn.classList.add('copied');
          btn.setAttribute('aria-label', 'Copied');
          window.setTimeout(function() {
            btn.classList.remove('copied');
            btn.setAttribute('aria-label', 'Copy');
          }, 1200);
        }
        document.addEventListener('click', function(e) {
          var btn = e.target && e.target.closest ? e.target.closest('.copy-chip') : null;
          if (!btn) return;
          e.preventDefault();
          var text = btn.getAttribute('data-copy') || '';
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() { flash(btn); }, function() { fallbackCopy(text); flash(btn); });
          } else {
            fallbackCopy(text); flash(btn);
          }
        });
      })();
  `;
}
