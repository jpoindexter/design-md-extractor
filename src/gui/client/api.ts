export function apiJs(): string {
  return `
    const form = document.getElementById('extract-form');
    const status = document.getElementById('status');
    const run = document.getElementById('run');
    const empty = document.getElementById('empty');
    const result = document.getElementById('result');
    const aiTarget = document.getElementById('ai-target');
    const downloadDesign = document.getElementById('download-design');
    const downloadCss = document.getElementById('download-css');
    const downloadTailwind = document.getElementById('download-tailwind');
    const downloadJson = document.getElementById('download-json');
    const downloadPrompt = document.getElementById('download-prompt');
    const downloadBundle = document.getElementById('download-bundle');
    const downloadActive = document.getElementById('download-active');
    const downloadBundleTop = document.getElementById('download-bundle-top');
    const copyActive = document.getElementById('copy-active');
    const modeButtons = Array.from(document.querySelectorAll('.mode-btn'));
    const aiTargetStorageKey = 'design-md-extractor.aiTarget';
    let activeExportTab = 'design';
    let exportMode = 'extended';

    if (aiTarget) {
      try {
        const stored = window.localStorage.getItem(aiTargetStorageKey);
        if (stored && Array.from(aiTarget.options).some(function(o) { return o.value === stored; })) {
          aiTarget.value = stored;
        }
      } catch {}
      aiTarget.addEventListener('change', function() {
        try { window.localStorage.setItem(aiTargetStorageKey, aiTarget.value); } catch {}
        if (latestExportData) {
          latestExportData.aiPrompt = buildAiPrompt(aiTarget.value, latestExportData);
          renderCode('ai-prompt', latestExportData.aiPrompt);
        }
      });
    }

    var tabs = Array.from(document.querySelectorAll('.tab'));
    function syncPressed(group) {
      group.forEach(function(b) { b.setAttribute('aria-pressed', b.classList.contains('active') ? 'true' : 'false'); });
    }
    syncPressed(tabs);
    syncPressed(modeButtons);
    tabs.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var tab = btn.getAttribute('data-tab');
        activeExportTab = tab || 'design';
        tabs.forEach(function(b) { b.classList.toggle('active', b === btn); });
        syncPressed(tabs);
        Array.from(document.querySelectorAll('.tab-panel')).forEach(function(panel) {
          panel.classList.toggle('active', panel.id === 'tab-' + tab);
        });
        updateActiveDownloadLabel();
      });
    });

    modeButtons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        exportMode = btn.getAttribute('data-mode') || 'extended';
        modeButtons.forEach(function(b) { b.classList.toggle('active', b === btn); });
        syncPressed(modeButtons);
        updateDesignPreview();
      });
    });

    if (copyActive) {
      copyActive.addEventListener('click', async function() {
        var panel = document.querySelector('.tab-panel.active pre');
        if (!panel) return;
        await navigator.clipboard.writeText(panel.textContent || '');
        copyActive.textContent = 'Copied';
        window.setTimeout(function() { copyActive.textContent = 'Copy'; }, 1200);
      });
    }

    function renderHero(shots, preferredHref) {
      var target = document.getElementById('hero');
      var all = normalizeList(shots);
      if (!target) return;
      var hero = selectHeroShot(all, preferredHref);
      if (!hero) {
        target.innerHTML = '<p class="muted">No screenshots were captured.</p>';
        return;
      }
      var heroHtml = [
        '<figure class="hero-figure">',
        '<a href="' + escapeHtml(hero.href) + '" target="_blank" rel="noreferrer">',
        '<img src="' + escapeHtml(hero.href) + '" alt="Hero screenshot">',
        '</a>',
        '<figcaption class="hero-meta">' + escapeHtml(hero.viewport) + ' \xb7 ' + escapeHtml(hero.url) + '</figcaption>',
        '</figure>',
      ].join('');
      var thumbs = all.slice(0, 6).map(function(shot) {
        return '<a href="' + escapeHtml(shot.href) + '" target="_blank" rel="noreferrer">' +
          '<img src="' + escapeHtml(shot.href) + '" alt="' + escapeHtml(shot.viewport) + ' screenshot"></a>';
      }).join('');
      target.innerHTML = heroHtml + (thumbs ? '<div class="thumb-strip">' + thumbs + '</div>' : '');
    }

    attachDownloadHandlers();

    form.addEventListener('submit', async function(event) {
      event.preventDefault();
      run.disabled = true;
      run.setAttribute('aria-busy', 'true');
      run.textContent = 'Extracting…';
      status.textContent = 'Discovering pages and assembling style evidence...';
      try {
        var response = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            url: document.getElementById('url').value,
            maxPages: Number(document.getElementById('max-pages').value),
            aiTarget: aiTarget ? aiTarget.value : 'generic',
          }),
        });
        var data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Extraction failed');

        var results = await Promise.all([
          fetch(data.artifacts.designMd).then(function(r) { return r.ok ? r.text() : ''; }).catch(function() { return ''; }),
          fetch(data.artifacts.evidenceJson).then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; }),
        ]);
        var designMd = results[0];
        var evidence = results[1];

        var tokenData = buildTokenData(data, evidence);
        var thesis = createThesis(data, evidence, tokenData);
        var guide = buildGuidelines(data, tokenData);
        var captureStamp = data.summary && data.summary.source ? data.summary.source.capturedAt : '';

        empty.style.display = 'none';
        result.classList.add('active');

        var hostname = new URL(data.url).hostname;
        currentHostname = hostname;
        currentThesis = thesis;
        applyExtractedTheme(tokenData);
        applySiteFontFaces(evidence);
        document.getElementById('result-title').textContent = hostname;
        document.getElementById('result-crumb').textContent = '/ Styles / ' + hostname;
        document.getElementById('result-meta').textContent =
          plural(data.summary.pages.length, 'page') + ' inspected \xb7 run ' + data.runId +
          (captureStamp ? ' \xb7 captured ' + captureStamp : '');
        document.getElementById('open-preview').href = data.artifacts.previewHtml;
        document.getElementById('open-design').href = data.artifacts.designMd;
        document.getElementById('open-evidence').href = data.artifacts.evidenceJson;
        document.getElementById('open-design-inline').href = data.artifacts.designMd;

        renderHero(data.summary.screenshots, data.summary.bestScreenshotHref);
        document.getElementById('thesis').textContent = thesis;
        renderStyleProfile(data, tokenData, evidence);
        renderColorCategories(tokenData.colors);
        renderColors(tokenData.colors);
        renderTypeScale(tokenData.typography);
        renderTypography(tokenData.typography);
        renderFontCards(tokenData.typography);
        renderSpacingTokens(tokenData.spacing);
        renderRadiusTokens(tokenData.radii);
        renderShadowTokens(tokenData.shadows);
        renderSurfaceTokens(tokenData.surfaces);
        renderComponentPreview(tokenData);
        renderComponents(tokenData.components, tokenData);

        setList('pages', normalizeList(data.summary.pages),
          function(page) { return '<li>' + escapeHtml(page.status + ' \xb7 ' + page.url) + '</li>'; },
          'No pages inspected.');
        setList('discovered', normalizeList(data.discoveredPages),
          function(page) { return '<li>' + escapeHtml(page) + '</li>'; },
          'No additional pages discovered.');
        setList('warnings', normalizeList(data.summary.warnings),
          function(w) { return '<li>' + escapeHtml((w.severity || 'info') + ' \xb7 ' + w.message) + '</li>'; },
          'No extraction warnings.');
        setList('guidelines-do', guide.doRules,
          function(rule) { return '<li>' + escapeHtml(rule) + '</li>'; }, 'No rules generated.');
        setList('guidelines-dont', guide.dontRules,
          function(rule) { return '<li>' + escapeHtml(rule) + '</li>'; }, 'No warnings generated.');

        var selectedAiTarget = aiTarget ? aiTarget.value : 'generic';
        var designExcerpt = extractDesignExcerpt(designMd, thesis, data);
        var cssVars = buildCssVariables(tokenData);
        var tailwindTheme = buildTailwindTheme(tokenData);
        var jsonTokens = buildJsonTokens(data, tokenData);
        var aiPrompt = buildAiPrompt(selectedAiTarget, {
          runId: data.runId, url: data.url, thesis: thesis,
          cssVars: cssVars, tailwindTheme: tailwindTheme, jsonTokens: jsonTokens, designMd: designMd,
        });

        latestExportData = {
          runId: data.runId, url: data.url, aiTarget: selectedAiTarget,
          thesis: thesis, designMd: designMd, designExcerpt: designExcerpt,
          cssVars: cssVars, tailwindTheme: tailwindTheme, jsonTokens: jsonTokens, aiPrompt: aiPrompt,
        };

        updateDesignPreview();
        updateActiveDownloadLabel();
        renderCode('css-vars', cssVars);
        renderCode('tailwind-theme', tailwindTheme);
        renderCode('json-tokens', jsonTokens);
        renderCode('ai-prompt', aiPrompt);
        status.textContent = 'Extraction complete: ' + data.runId;
      } catch (error) {
        status.innerHTML = '<span class="error">' + escapeHtml(error && error.message ? error.message : String(error)) + '</span>';
      } finally {
        run.disabled = false;
        run.removeAttribute('aria-busy');
        run.textContent = 'Extract Style';
      }
    });
  `;
}
