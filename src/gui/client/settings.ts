export function settingsCss(): string {
  return `
    /* status + settings share one bottom-aligned row so nothing floats in the corner */
    .side-right { display: flex; align-items: flex-end; gap: 10px; min-width: 0; }
    .settings-btn {
      flex: none; width: 40px; height: 40px; border: 1px solid var(--field-border); border-radius: 6px;
      background: var(--panel); color: var(--muted); cursor: pointer; padding: 0;
      display: inline-grid; place-items: center;
    }
    .settings-btn::before {
      content: ""; width: 18px; height: 18px; background-color: currentColor;
      -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='3'/%3E%3Cpath d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'/%3E%3C/svg%3E") center / 18px no-repeat;
      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='3'/%3E%3Cpath d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'/%3E%3C/svg%3E") center / 18px no-repeat;
    }
    .settings-btn:hover { border-color: var(--ink-strong); color: var(--ink); }
    .settings-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    .settings-modal { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: 24px; background: rgba(13,21,27,0.42); }
    .settings-modal[hidden] { display: none; }
    .settings-panel {
      width: min(560px, 100%); max-height: 86vh; overflow: auto;
      background: var(--canvas); border: 1px solid var(--line-strong); border-radius: 14px;
      box-shadow: 0 24px 60px rgba(12, 41, 126, 0.18);
    }
    .settings-head {
      position: sticky; top: 0; background: var(--canvas); z-index: 1;
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 22px; border-bottom: 1px solid var(--line);
    }
    .settings-head h2 { margin: 0; font-size: 19px; font-weight: 650; letter-spacing: -0.2px; color: var(--ink-strong); }
    .settings-close { border: 0; background: transparent; font-size: 22px; line-height: 1; color: var(--quiet); cursor: pointer; width: 32px; height: 32px; border-radius: 6px; }
    .settings-close:hover { background: var(--panel); color: var(--ink); }
    .settings-close:focus-visible { outline: 2px solid rgba(12,41,112,0.4); outline-offset: 1px; }
    .settings-body { padding: 6px 22px 24px; display: grid; gap: 24px; }
    .settings-group { display: grid; gap: 10px; }
    .settings-group h3 { margin: 14px 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--quiet); }
    .settings-group label { display: grid; gap: 6px; color: var(--muted); font-size: 11px; font-weight: 680; text-transform: uppercase; letter-spacing: 0; }
    .settings-hint { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.5; }
    .settings-hint code { font-family: var(--mono); background: var(--panel); border: 1px solid var(--line); border-radius: 4px; padding: 1px 5px; }
    .settings-add-row { display: flex; gap: 8px; }
    .settings-add-row input { flex: 1; min-width: 0; }
    .settings-add-row button {
      border: 1px solid var(--line-strong); border-radius: 6px; background: var(--accent-soft); color: #fff;
      font-size: 12px; font-weight: 700; padding: 0 14px; min-height: 38px; cursor: pointer; white-space: nowrap;
    }
    .settings-add-row button:hover { background: #000; }
    .custom-target-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; border: 1px solid var(--line); border-radius: 8px; padding: 8px 8px 8px 12px; background: var(--panel); }
    .custom-target-row span { font-size: 13px; color: var(--ink); overflow-wrap: anywhere; }
    .custom-target-row button { border: 1px solid var(--line); border-radius: 6px; background: var(--canvas); color: var(--error); font-size: 11px; font-weight: 680; min-height: 30px; padding: 0 10px; cursor: pointer; }
    .custom-target-row button:hover { border-color: var(--error); }
    .settings-empty { margin: 0; color: var(--quiet); font-size: 12px; font-style: italic; }
    .settings-soon { border-top: 1px dashed var(--line-strong); padding-top: 18px; }
    .settings-tag { display: inline-block; margin-left: 8px; font-size: 9px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--accent); border: 1px solid var(--line-strong); border-radius: 999px; padding: 2px 8px; vertical-align: middle; }
  `;
}

export function settingsModalHtml(): string {
  return `
    <div id="settings-modal" class="settings-modal" hidden role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div class="settings-panel">
        <div class="settings-head">
          <h2 id="settings-title">Settings</h2>
          <button id="close-settings" class="settings-close" type="button" aria-label="Close settings">&times;</button>
        </div>
        <div class="settings-body">
          <section class="settings-group">
            <h3>Defaults</h3>
            <label>Default AI assistant
              <select id="set-default-ai"></select>
            </label>
            <label>Default coverage
              <select id="set-default-coverage">
                <option value="7">Broad · 7 pages</option>
                <option value="4">Quick · 4 pages</option>
                <option value="12">Deep · 12 pages</option>
              </select>
            </label>
            <p class="settings-hint">Remembered in this browser and pre-selected next time.</p>
          </section>
          <section class="settings-group">
            <h3>Custom assistants / CLIs</h3>
            <p class="settings-hint">Add the AI or CLI you actually use (Cursor, Aider, Gemini CLI, Cline&hellip;). It appears in the AI Assistant picker and tailors the generated prompt's greeting.</p>
            <div id="custom-targets-list"></div>
            <div class="settings-add-row">
              <input id="custom-target-name" type="text" placeholder="e.g. Cursor, Aider, Gemini CLI" autocapitalize="words" spellcheck="false">
              <button id="add-custom-target" type="button">Add</button>
            </div>
          </section>
          <section class="settings-group">
            <h3>Output</h3>
            <p class="settings-hint">Runs are saved under <code id="output-location">out/gui-runs/</code> and served at <code>/runs/</code>.</p>
          </section>
          <section class="settings-group settings-soon">
            <h3>Bring your own AI <span class="settings-tag">optional, later</span></h3>
            <p class="settings-hint">Today this tool is fully local &mdash; it never calls an AI or needs a key; the picker above only chooses which prompt template you copy into your own agent. A future option can use your own Anthropic/OpenAI key to write a sharper Style Thesis, off by default.</p>
          </section>
        </div>
      </div>
    </div>`;
}

export function settingsJs(): string {
  return `
      let customTargets = [];
      (function initSettings() {
        var AI_KEY = 'design-md-extractor.aiTarget';
        var COVERAGE_KEY = 'design-md-extractor.coverage';
        var CUSTOM_KEY = 'design-md-extractor.customTargets';
        var aiSelect = document.getElementById('ai-target');
        var coverageSelect = document.getElementById('max-pages');
        var openBtn = document.getElementById('open-settings');
        var modal = document.getElementById('settings-modal');
        var closeBtn = document.getElementById('close-settings');
        var defaultAi = document.getElementById('set-default-ai');
        var defaultCoverage = document.getElementById('set-default-coverage');
        var listEl = document.getElementById('custom-targets-list');
        var nameInput = document.getElementById('custom-target-name');
        var addBtn = document.getElementById('add-custom-target');
        if (!aiSelect || !modal) return;

        function read(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } }
        function write(key, value) { try { window.localStorage.setItem(key, value); } catch (e) {} }

        function loadCustomTargets() {
          try {
            var raw = window.localStorage.getItem(CUSTOM_KEY);
            customTargets = raw ? JSON.parse(raw) : [];
          } catch (e) { customTargets = []; }
          if (!Array.isArray(customTargets)) customTargets = [];
        }
        function saveCustomTargets() { write(CUSTOM_KEY, JSON.stringify(customTargets)); }

        function populate(select) {
          if (!select) return;
          var current = select.value;
          Array.from(select.querySelectorAll('option[data-custom]')).forEach(function(o) { o.remove(); });
          customTargets.forEach(function(t) {
            var opt = document.createElement('option');
            opt.value = 'custom:' + t.id;
            opt.textContent = t.label;
            opt.setAttribute('data-custom', '1');
            select.appendChild(opt);
          });
          if (Array.from(select.options).some(function(o) { return o.value === current; })) select.value = current;
        }

        function mirrorDefaultAi() {
          if (!defaultAi) return;
          defaultAi.innerHTML = aiSelect.innerHTML;
          defaultAi.value = aiSelect.value;
        }

        function renderCustomList() {
          if (!listEl) return;
          if (!customTargets.length) {
            listEl.innerHTML = '<p class="settings-empty">No custom assistants yet \\u2014 add the AI or CLI you actually use.</p>';
            return;
          }
          listEl.innerHTML = customTargets.map(function(t) {
            return '<div class="custom-target-row"><span>' + escapeHtml(t.label) + '</span>' +
              '<button type="button" data-remove="' + escapeHtml(t.id) + '">Remove</button></div>';
          }).join('');
          Array.from(listEl.querySelectorAll('button[data-remove]')).forEach(function(btn) {
            btn.addEventListener('click', function() {
              var id = btn.getAttribute('data-remove');
              customTargets = customTargets.filter(function(t) { return t.id !== id; });
              saveCustomTargets();
              if (aiSelect.value === 'custom:' + id) {
                aiSelect.value = 'generic';
                aiSelect.dispatchEvent(new Event('change'));
              }
              populate(aiSelect); mirrorDefaultAi(); renderCustomList();
            });
          });
        }

        // ----- init: custom options must exist before api.ts restores a saved custom target -----
        loadCustomTargets();
        populate(aiSelect);

        // restore persisted coverage (api.ts already restores the AI target)
        var savedCoverage = read(COVERAGE_KEY);
        if (savedCoverage && coverageSelect && Array.from(coverageSelect.options).some(function(o) { return o.value === savedCoverage; })) {
          coverageSelect.value = savedCoverage;
        }
        // reflect any saved AI target into the live select now so the modal mirrors it
        var savedAi = read(AI_KEY);
        if (savedAi && Array.from(aiSelect.options).some(function(o) { return o.value === savedAi; })) {
          aiSelect.value = savedAi;
        }

        if (coverageSelect) {
          coverageSelect.addEventListener('change', function() {
            write(COVERAGE_KEY, coverageSelect.value);
            if (defaultCoverage) defaultCoverage.value = coverageSelect.value;
          });
        }

        mirrorDefaultAi();
        if (defaultCoverage && coverageSelect) defaultCoverage.value = coverageSelect.value;
        renderCustomList();

        function openModal() { mirrorDefaultAi(); modal.hidden = false; if (closeBtn) closeBtn.focus(); }
        function closeModal() { modal.hidden = true; if (openBtn) openBtn.focus(); }
        if (openBtn) openBtn.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', function(e) { if (e.target === modal) closeModal(); });
        document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

        if (defaultAi) {
          defaultAi.addEventListener('change', function() {
            aiSelect.value = defaultAi.value;
            aiSelect.dispatchEvent(new Event('change'));
          });
        }
        if (defaultCoverage) {
          defaultCoverage.addEventListener('change', function() {
            if (coverageSelect) {
              coverageSelect.value = defaultCoverage.value;
              coverageSelect.dispatchEvent(new Event('change'));
            }
          });
        }

        function addTarget() {
          if (!nameInput) return;
          var label = nameInput.value.trim();
          if (!label) return;
          var id = 't' + Date.now().toString(36);
          customTargets.push({ id: id, label: label });
          saveCustomTargets();
          nameInput.value = '';
          populate(aiSelect);
          renderCustomList();
          aiSelect.value = 'custom:' + id;
          aiSelect.dispatchEvent(new Event('change'));
          mirrorDefaultAi();
        }
        if (addBtn) addBtn.addEventListener('click', addTarget);
        if (nameInput) {
          nameInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') { e.preventDefault(); addTarget(); }
          });
        }
      })();
  `;
}
