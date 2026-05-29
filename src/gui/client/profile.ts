export function profileJs(): string {
  return `
      let currentHostname = '';
      let currentThesis = '';
      let currentTheme = null;
      let latestExportData = null;

      function clampSpecimenSize(fontSize) {
        const px = numericPx(fontSize);
        if (!px || !Number.isFinite(px)) return '18px';
        return Math.max(12, Math.min(px, 74)) + 'px';
      }

      function typeSpecimenCopy(item) {
        const role = String(item && item.role ? item.role : '').toLowerCase();
        const size = numericPx(item && item.fontSize ? item.fontSize : '');
        if (size > 32 || role.includes('heading') || role.includes('display') || role.includes('title')) {
          return 'THE QUICK BROWN FOX JUMPS';
        }
        if (role.includes('link') || role.includes('nav')) {
          return 'Studio Projects About Contact';
        }
        if (role.includes('button')) {
          return 'Primary Action';
        }
        return 'The quick brown fox jumps over a precise interface.';
      }

      function clampPaddingValue(value) {
        return String(value || '')
          .split(/\\s+/)
          .filter(Boolean)
          .slice(0, 4)
          .map((part) => {
            const match = part.match(/^([\\d.]+)px$/);
            if (!match) return part;
            return Math.min(Number.parseFloat(match[1]), 48) + 'px';
          })
          .join(' ') || '0px';
      }

      function toneLabel(colors) {
        const list = normalizeList(colors);
        if (!list.length) return 'Mixed';
        const avg = list.slice(0, 4).reduce((sum, color) => sum + colorLuminance(color.value), 0) / Math.min(4, list.length);
        if (avg < 0.35) return 'Dark';
        if (avg > 0.65) return 'Light';
        return 'Balanced';
      }

      function selectAccentColors(colors) {
        return normalizeList(colors)
          .filter((color) => colorSaturation(color.value) >= 0.42)
          .slice(0, 2);
      }

      function colorCategorySummary(colors) {
        const list = normalizeList(colors);
        const accents = selectAccentColors(list);
        const neutrals = list.filter((color) => colorSaturation(color.value) < 0.2).slice(0, 3);
        return {
          brand: list[0] ? [list[0]] : [],
          accents,
          neutrals,
        };
      }

      function selectHeroShot(shots, preferredHref) {
        const all = normalizeList(shots);
        if (preferredHref) {
          const preferred = all.find((shot) => shot.href === preferredHref);
          if (preferred) return preferred;
        }
        return all.find((shot) => shot.viewport === 'desktop') || all[0] || null;
      }

      function renderRows(id, rows, mapRow, emptyText) {
        const target = document.getElementById(id);
        if (!target) return;
        if (!rows.length) {
          target.innerHTML = '<tr><td class="muted">' + escapeHtml(emptyText) + '</td></tr>';
          return;
        }
        target.innerHTML = rows.map(mapRow).join('');
      }

      function setList(id, rows, mapRow, emptyText) {
        const target = document.getElementById(id);
        if (!target) return;
        target.innerHTML = rows.length ? rows.map(mapRow).join('') : '<li>' + escapeHtml(emptyText) + '</li>';
      }

      function firstNonEmpty(lines) {
        return normalizeList(lines).find((line) => String(line || '').trim().length > 0) || '';
      }

      function plural(count, singular, pluralForm) {
        var n = Number(count) || 0;
        return n + ' ' + (n === 1 ? singular : (pluralForm || singular + 's'));
      }

      function aiTargetLabel(target) {
        if (target && target.indexOf('custom:') === 0) {
          var id = target.slice(7);
          var list = typeof customTargets !== 'undefined' ? customTargets : [];
          var found = list.find(function(t) { return t.id === id; });
          return found ? found.label : 'Custom Assistant';
        }
        if (target === 'codex') return 'Codex';
        if (target === 'claude') return 'Claude';
        if (target === 'chatgpt') return 'ChatGPT';
        return 'Generic Assistant';
      }

      function createThesis(data, evidence, tokenData) {
        if (data && data.summary && typeof data.summary.styleThesis === 'string' && data.summary.styleThesis.trim()) {
          return data.summary.styleThesis.trim();
        }
        const layoutDensity = evidence && evidence.layout && evidence.layout.density ? evidence.layout.density : 'balanced';
        const imagery = evidence && evidence.imagery && evidence.imagery.strategy ? evidence.imagery.strategy : 'mixed visual strategy';
        const pageCount = normalizeList(data.summary.pages).length;
        const colorCount = tokenData.colors.length;
        const typographyCount = tokenData.typography.length;
        return 'This style reads as ' + layoutDensity + ' density, with ' + colorCount + ' primary color tokens, ' + typographyCount + ' typography tokens, and a ' + imagery + ' approach across ' + pageCount + ' inspected page(s).';
      }

      function renderStyleProfile(data, tokenData, evidence) {
        const target = document.getElementById('style-profile');
        if (!target) return;
        const pages = normalizeList(data.summary.pages);
        const accents = selectAccentColors(tokenData.colors);
        const theme = toneLabel(tokenData.surfaces.length ? tokenData.surfaces : tokenData.colors);
        const topFont = tokenData.typography[0] ? tokenData.typography[0].fontFamily : 'Unknown';
        const shotCount = normalizeList(data.summary.screenshots).length;
        const surfaceCount = normalizeList(tokenData.surfaces).length;
        const accentLabel = accents.length === 1 ? 'accent signal' : 'accent signals';

        const cards = [
          [
            '<article class="profile-card">',
            '<h4>Theme</h4>',
            '<p>' + escapeHtml(theme) + ' tone with ' + escapeHtml(String(accents.length)) + ' ' + accentLabel + '.</p>',
            '</article>',
          ].join(''),
          [
            '<article class="profile-card">',
            '<h4>Coverage</h4>',
            '<p>' + escapeHtml(plural(pages.length, 'page')) + ' inspected across ' + escapeHtml(plural(shotCount, 'screenshot')) + '.</p>',
            '</article>',
          ].join(''),
          [
            '<article class="profile-card">',
            '<h4>Typography Lead</h4>',
            '<p>' + escapeHtml(topFont) + '</p>',
            '</article>',
          ].join(''),
          [
            '<article class="profile-card">',
            '<h4>Surfaces</h4>',
            '<p>' + escapeHtml(plural(surfaceCount, 'surface level')) + ' detected.</p>',
            '</article>',
          ].join(''),
        ];

        const pills = [
          '<div class="token-pills">',
          '<span class="token-pill">Colors ' + escapeHtml(String(tokenData.colors.length)) + '</span>',
          '<span class="token-pill">Typography ' + escapeHtml(String(tokenData.typography.length)) + '</span>',
          '<span class="token-pill">Components ' + escapeHtml(String(tokenData.components.length)) + '</span>',
          '</div>',
        ].join('');

        target.innerHTML = cards.join('') + pills;
      }

      function buildGuidelines(data, tokenData) {
        const pages = normalizeList(data.summary.pages);
        const successCount = pages.filter((page) => page.status === 'success').length;
        const failureCount = pages.length - successCount;
        const warnings = normalizeList(data.summary.warnings);
        const componentKinds = new Set(normalizeList(data.summary.components).map((component) => component.kind).filter(Boolean));
        const frequentColor = tokenData.colors[0];
        const fontFamilies = Array.from(new Set(tokenData.typography.map((item) => item.fontFamily).filter(Boolean)));

        const doRules = [
          'Use the top color tokens as semantic roles before adding new hues.',
          'Preserve the dominant font family stack: ' + (firstNonEmpty(fontFamilies) || 'not enough evidence') + '.',
          'Match interaction patterns from ' + componentKinds.size + ' detected component types.',
          'Validate style decisions on desktop, tablet, and mobile screenshots.'
        ];

        if (frequentColor && frequentColor.value) {
          doRules[0] = 'Anchor UI hierarchy around ' + frequentColor.value + ' as a recurring high-signal color.';
        }

        const dontRules = [
          'Do not treat single-page evidence as a complete brand system.',
          'Avoid adding decorative styles that conflict with detected spacing and radius tokens.',
          'Do not ignore low-confidence tokens without screenshot verification.',
        ];

        if (failureCount > 0) {
          dontRules[0] = 'Do not finalize a style system before resolving ' + failureCount + ' failed page capture(s).';
        }

        if (successCount <= 1) {
          dontRules.push('Avoid overfitting to one hero state when multi-page coverage is limited.');
        }
        if (warnings.length > 0) {
          dontRules.push('Resolve extraction warnings before locking final style decisions.');
        }

        return { doRules, dontRules };
      }

      function extractDesignExcerpt(designMd, thesis, data) {
        const text = String(designMd || '').trim();
        if (!text) {
          return [
            '# Style Reference',
            '',
            'Site: ' + data.url,
            'Run: ' + data.runId,
            '',
            thesis,
          ].join('\\n');
        }
        const lines = text
          .split('\\n')
          .filter((line) => line.trim().length > 0 && !line.startsWith('|') && !line.startsWith('---'))
          .slice(0, 14);
        return lines.join('\\n');
      }

      function updateDesignPreview() {
        const target = document.getElementById('design-excerpt');
        if (!target || !latestExportData) return;
        renderCode(target,
          exportMode === 'compact'
            ? latestExportData.designExcerpt
            : latestExportData.designMd || latestExportData.designExcerpt);
      }
  `;
}
