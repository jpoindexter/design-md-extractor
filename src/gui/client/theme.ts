export function themeJs(): string {
  return `
      function applySiteFontFaces(evidence) {
        var styleEl = document.getElementById('site-fontfaces');
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = 'site-fontfaces';
          document.head.appendChild(styleEl);
        }
        var faces = evidence && Array.isArray(evidence.fontFaces) ? evidence.fontFaces : [];
        styleEl.textContent = faces
          .map(function(face) {
            var family = safeCssValue(face && face.family, '').replace(/['"]/g, '');
            var src = String((face && face.src) || '');
            if (!family || !/^https?:\\/\\//.test(src)) return '';
            var fmt = /\\.woff2(\\?|$)/i.test(src) ? 'woff2' : (/\\.woff(\\?|$)/i.test(src) ? 'woff' : '');
            return "@font-face{font-family:'" + family + "';" +
              'font-weight:' + safeCssValue(face.weight, '400') + ';' +
              'font-style:' + safeCssValue(face.style, 'normal') + ';' +
              'font-display:swap;' +
              "src:url('" + src.replace(/['"]/g, '') + "')" + (fmt ? " format('" + fmt + "')" : '') + '}';
          })
          .filter(Boolean)
          .join('');
      }

      function selectCanvasColor(tokenData) {
        const sources = [...normalizeList(tokenData.surfaces), ...normalizeList(tokenData.colors)];
        const candidates = uniqueColorValues(sources);
        if (!candidates.length) return '#ffffff';
        const ranked = candidates
          .map((value) => {
            const source = tokenSourceForValue(value, sources);
            const words = sourceWords(source);
            const properties = normalizeList(source.properties);
            const saturation = colorSaturation(value);
            const luminance = colorLuminance(value);
            const roleHit = /canvas|background|surface|page|body|stage|base/.test(words) ? 8 : 0;
            const selectorHit = /(^|[\\s>#.])(body|html|stage)([\\s>#.]|$)/.test(words) ? 8 : 0;
            const backgroundHit = properties.includes('backgroundColor') ? 5 : 0;
            const levelBonus = Number.isFinite(Number(source.level)) ? Math.max(0, 4 - Number(source.level)) : 0;
            const saturationPenalty = saturation > 0.35 ? saturation * 18 : saturation * 2;
            const utilityPenalty = /cursor|svg|icon|badge/.test(words) && !/body|stage/.test(words) ? 6 : 0;
            return {
              value,
              score:
                confidenceScore(source.confidence) * 3 +
                roleHit +
                selectorHit +
                backgroundHit +
                levelBonus -
                saturationPenalty -
                utilityPenalty +
                (luminance > 0.08 && luminance < 0.96 ? 2 : 0),
            };
          })
          .sort((a, b) => b.score - a.score)[0];
        return ranked.value;
      }

      function selectAccentColor(tokenData, canvas) {
        const sources = normalizeList(tokenData.colors || []);
        const candidates = uniqueColorValues(sources);
        const canvasLum = colorLuminance(canvas);
        const accent = candidates
          .map((value) => {
            const source = tokenSourceForValue(value, sources);
            const normalized = String(value).toLowerCase();
            const properties = normalizeList(source.properties);
            const isBrowserDefaultBlue = normalized === '#0000ee' || normalized === '#0000ff' || normalized === 'rgb(0, 0, 238)' || normalized === 'blue';
            const words = sourceWords(source);
            return {
              value,
              saturation: colorSaturation(value),
              delta: Math.abs(colorLuminance(value) - canvasLum),
              frequency: Number(source.frequency || 0),
              roleBonus: /accent|brand|primary|action|button|link|text|foreground/.test(words) || properties.includes('color') || properties.includes('borderColor') ? 1 : 0,
              browserPenalty: isBrowserDefaultBlue ? 10 : 0,
            };
          })
          .filter((item) => item.saturation > 0.28 && item.delta > 0.08 && item.browserPenalty < 10)
          .sort((a, b) => b.roleBonus - a.roleBonus || b.frequency - a.frequency || b.saturation - a.saturation || b.delta - a.delta)[0];
        return (accent || { value: candidates[0] || '#3a5446' }).value;
      }

      function selectTextColor(tokenData, canvas) {
        const sources = normalizeList(tokenData.colors || []);
        const candidates = uniqueColorValues(sources);
        const roleMatch = candidates
          .map((value) => {
            const source = tokenSourceForValue(value, sources);
            const words = sourceWords(source);
            return { value, source, words, delta: Math.abs(colorLuminance(value) - colorLuminance(canvas)) };
          })
          .filter((item) => /text|foreground|heading|body|copy|ink|black/.test(item.words) && item.delta >= 0.34)
          .sort((a, b) => confidenceScore(b.source.confidence) - confidenceScore(a.source.confidence) || b.delta - a.delta)[0];
        if (roleMatch) return roleMatch.value;
        const readable = pickReadableTextColor(
          candidates.map((value) => ({ value })),
          canvas
        );
        return readable || contrastTextColor(canvas);
      }

      function themeFontFamilies(tokenData) {
        const typography = normalizeList(tokenData.typography);
        const valid = typography.filter((item) => {
          const family = String(item.fontFamily || '');
          const size = numericPx(item.fontSize);
          const lineHeight = numericPx(item.lineHeight);
          return family && !/icon|symbol|material/i.test(family) && size > 0 && (lineHeight > 0 || String(item.lineHeight || '').toLowerCase() === 'normal');
        });
        const bodyMatch = valid.find((item) => /body|copy|paragraph|text|p\\b/.test(String(item.role || '').toLowerCase()) && numericPx(item.fontSize) <= 22);
        const displayMatch = valid
          .slice()
          .filter((item) => /heading|display|title|hero|h1/.test(sourceWords(item)) || numericPx(item.fontSize) > 32)
          .sort((a, b) => numericPx(b.fontSize) - numericPx(a.fontSize))[0];
        const body =
          bodyMatch?.fontFamily ||
          valid.find((item) => numericPx(item.fontSize) <= 22)?.fontFamily ||
          valid[0]?.fontFamily ||
          '"Helvetica Neue", Arial, sans-serif';
        const display = displayMatch?.fontFamily || body;
        return { body, display };
      }

      function firstTokenValue(rows, fallback) {
        const row = normalizeList(rows).find((item) => item && item.value);
        return row ? cssTokenValue(row.value, fallback) : fallback;
      }

      function firstComponentStyle(tokenData, key, fallback) {
        const component = normalizeList(tokenData.components).find((item) => item && item.styles && item.styles[key]);
        return component ? cssTokenValue(component.styles[key], fallback) : fallback;
      }

      function scalarPxFromValue(value, fallback) {
        const matches = String(value || '').match(/[\\d.]+px/g) || [];
        const candidates = matches
          .map((part) => Number.parseFloat(part))
          .filter((part) => Number.isFinite(part) && part > 0 && part <= 28)
          .sort((a, b) => a - b);
        return candidates.length ? candidates[0] + 'px' : fallback;
      }

      function selectThemeSpacing(tokenData) {
        const rows = normalizeList(tokenData.spacing);
        const direct = rows.find((item) => /^\\d+(\\.\\d+)?px$/.test(String(item && item.value ? item.value : '').trim()) && numericPx(item.value) > 0 && numericPx(item.value) <= 28);
        if (direct) return cssTokenValue(direct.value, '12px');
        const composite = rows.find((item) => scalarPxFromValue(item && item.value, ''));
        return composite ? scalarPxFromValue(composite.value, '12px') : '12px';
      }

      function parseBorderWidth(border) {
        const match = String(border || '').match(/([\\d.]+)px/);
        return match ? Number.parseFloat(match[1]) : 0;
      }

      function isRealBorder(styles) {
        const border = String(styles && styles.border ? styles.border : '').toLowerCase();
        const borderStyle = String(styles && styles.borderStyle ? styles.borderStyle : '').toLowerCase();
        const width = parseBorderWidth(styles && (styles.borderWidth || styles.border));
        if (border.includes('none') || borderStyle === 'none') return false;
        return width > 0;
      }

      function selectBorderTheme(tokenData, text, canvas) {
        const components = normalizeList(tokenData.components).filter((item) => item && item.styles);
        const realBorders = components.filter((item) => isRealBorder(item.styles));
        const noBorderRatio = components.length ? (components.length - realBorders.length) / components.length : 0;
        if (components.length && noBorderRatio >= 0.62) {
          return { color: 'transparent', width: '0px', style: 'none', frameShadow: 'none' };
        }
        const borderColor =
          realBorders.map((item) => item.styles.borderColor || '').find((value) => value && !isTransparentColor(value)) ||
          alphaColor(text, colorLuminance(canvas) > 0.55 ? 0.18 : 0.24);
        return { color: cssTokenValue(borderColor, alphaColor(text, 0.18)), width: '1px', style: 'solid', frameShadow: 'inset 0 0 0 1px ' + cssTokenValue(borderColor, alphaColor(text, 0.18)) };
      }

      function selectSurfaceRadius(tokenData) {
        const layoutComponents = normalizeList(tokenData.components).filter((component) => {
          const kind = String(component && component.kind ? component.kind : '').toLowerCase();
          const bounds = component && component.bounds ? component.bounds : {};
          const area = Number(bounds.width || 0) * Number(bounds.height || 0);
          return component && component.styles && (/card|navigation|header|section|container/.test(kind) || area > 24000);
        });
        const counts = new Map();
        layoutComponents.forEach((component) => {
          const value = cssTokenValue(component.styles.borderRadius, '');
          if (!value || value.includes('%') || numericPx(value) > 48) return;
          counts.set(value, (counts.get(value) || 0) + 1);
        });
        const dominant = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
        if (dominant) return dominant[0];
        const token = normalizeList(tokenData.radii).find((item) => {
          const value = String(item && item.value ? item.value : '');
          return value && !value.includes('%') && numericPx(value) <= 32;
        });
        return token ? cssTokenValue(token.value, '8px') : '8px';
      }

      function selectThemeShadow(tokenData) {
        const shadows = normalizeList(tokenData.shadows).filter((item) => item && item.value && String(item.value).toLowerCase() !== 'none');
        if (shadows.length) return cssTokenValue(shadows[0].value, 'none');
        const components = normalizeList(tokenData.components).filter((item) => item && item.styles);
        const realShadow = components.find((item) => item.styles.boxShadow && String(item.styles.boxShadow).toLowerCase() !== 'none');
        return realShadow ? cssTokenValue(realShadow.styles.boxShadow, 'none') : 'none';
      }

      function themeTypographyDetails(tokenData, fonts) {
        const typography = normalizeList(tokenData.typography);
        const display = typography
          .slice()
          .filter((item) => item && item.fontFamily === fonts.display)
          .sort((a, b) => numericPx(b.fontSize) - numericPx(a.fontSize))[0] || typography.slice().sort((a, b) => numericPx(b.fontSize) - numericPx(a.fontSize))[0] || {};
        const size = numericPx(display.fontSize);
        return {
          displaySize: (size ? Math.max(38, Math.min(size, 82)) : 72) + 'px',
          displayWeight: cssTokenValue(display.fontWeight, '700'),
          displayLine: cssTokenValue(display.lineHeight, '0.92'),
        };
      }

      function applyExtractedTheme(tokenData) {
        if (!result) return;
        const canvas = selectCanvasColor(tokenData);
        const text = selectTextColor(tokenData, canvas);
        const accent = selectAccentColor(tokenData, canvas);
        const accentText = contrastTextColor(accent);
        const isLight = colorLuminance(canvas) > 0.55;
        const surface = canvas;
        const card = surface;
        const code = isLight ? blendColor(canvas, [255, 255, 255], 0.14) : blendColor(canvas, [0, 0, 0], 0.18);
        const muted = blendColor(text, colorToRgb(canvas) || [255, 255, 255], 0.42);
        const borderTheme = selectBorderTheme(tokenData, text, canvas);
        const radius = selectSurfaceRadius(tokenData);
        const shadow = selectThemeShadow(tokenData);
        const space = selectThemeSpacing(tokenData);
        const sectionSpace = Math.max(24, Math.min((numericPx(space) || 12) * 3, 48)) + 'px';
        const fonts = themeFontFamilies(tokenData);
        const type = themeTypographyDetails(tokenData, fonts);
        currentTheme = { canvas, surface, card, code, text, muted, accent, border: borderTheme.color, radius, shadow, fonts };

        result.classList.add('site-themed');
        document.body.classList.add('site-themed-ui');
        const vars = {
          '--site-canvas': canvas,
          '--site-surface': surface,
          '--site-card': card,
          '--site-code': code,
          '--site-text': text,
          '--site-muted': muted,
          '--site-accent': accent,
          '--site-accent-text': accentText,
          '--site-border': borderTheme.color,
          '--site-border-width': borderTheme.width,
          '--site-border-style': borderTheme.style,
          '--site-radius': radius,
          '--site-shadow': shadow,
          '--site-frame-shadow': borderTheme.frameShadow,
          '--site-space': space,
          '--site-section-space': sectionSpace,
          '--site-font-body': safeCssValue(fonts.body, '"Helvetica Neue", Arial, sans-serif'),
          '--site-font-display': safeCssValue(fonts.display, safeCssValue(fonts.body, '"Helvetica Neue", Arial, sans-serif')),
          '--site-display-size': type.displaySize,
          '--site-display-weight': type.displayWeight,
          '--site-display-line': type.displayLine,
        };
        Object.entries(vars).forEach(([name, value]) => {
          result.style.setProperty(name, value);
          document.documentElement.style.setProperty(name, value);
        });
      }
  `;
}
