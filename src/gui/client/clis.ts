export function clisJs(): string {
  return `
      let detectedClis = [];
      (function initClis() {
        var aiSelect = document.getElementById('ai-target');
        if (!aiSelect) return;
        var defaultAi = document.getElementById('set-default-ai');
        var AI_KEY = 'design-md-extractor.aiTarget';

        function addDetected(select) {
          if (!select) return;
          var existing = {};
          Array.from(select.options).forEach(function(o) { existing[o.value] = true; });
          var frag = document.createDocumentFragment();
          detectedClis.forEach(function(cli) {
            var value = 'cli:' + cli.id;
            if (existing[value]) return;
            var opt = document.createElement('option');
            opt.value = value;
            opt.textContent = cli.label + ' · detected';
            opt.setAttribute('data-cli', '1');
            frag.appendChild(opt);
          });
          // detected CLIs are the user's actual tools — surface them first
          select.insertBefore(frag, select.firstChild);
        }

        fetch('/api/clis')
          .then(function(r) { return r.ok ? r.json() : { clis: [] }; })
          .then(function(data) {
            detectedClis = Array.isArray(data.clis) ? data.clis : [];
            if (!detectedClis.length) return;
            addDetected(aiSelect);
            addDetected(defaultAi);
            // re-apply a saved cli: selection now that its option exists
            try {
              var saved = window.localStorage.getItem(AI_KEY);
              if (saved && Array.from(aiSelect.options).some(function(o) { return o.value === saved; })) {
                aiSelect.value = saved;
                if (defaultAi) defaultAi.value = saved;
              }
            } catch (e) {}
          })
          .catch(function() {});
      })();
  `;
}
