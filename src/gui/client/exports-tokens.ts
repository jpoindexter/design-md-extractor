export function exportsTokensJs(): string {
  return `
      function buildTokenData(data, evidence) {
        const summary = data.summary || {};
        const evidenceTokens = evidence && evidence.tokens ? evidence.tokens : {};
        const summaryTokens = {
          colors: normalizeList(summary.colors),
          typography: normalizeList(summary.typography),
          spacing: normalizeList(summary.spacing),
          radii: normalizeList(summary.radii),
          shadows: normalizeList(summary.shadows),
          surfaces: normalizeList(summary.surfaces),
        };

        // Components are score-sorted, and cards out-score buttons/nav/inputs —
        // a plain top-12 slice would show only cards. Guarantee one of each kind
        // first, then fill the rest by score, so the preview reflects real variety.
        const allComponents = normalizeList(
          evidence && evidence.components && evidence.components.length ? evidence.components : summary.components
        );
        const componentOrder = new Map();
        allComponents.forEach((component, index) => componentOrder.set(component, index));
        const pickedComponents = [];
        const seenKinds = new Set();
        allComponents.forEach((component) => {
          const kind = component && component.kind ? component.kind : 'other';
          if (!seenKinds.has(kind)) { seenKinds.add(kind); pickedComponents.push(component); }
        });
        allComponents.forEach((component) => {
          if (pickedComponents.length < 12 && pickedComponents.indexOf(component) === -1) {
            pickedComponents.push(component);
          }
        });
        pickedComponents.sort((a, b) => componentOrder.get(a) - componentOrder.get(b));

        return {
          colors: normalizeList(evidenceTokens.colors && evidenceTokens.colors.length ? evidenceTokens.colors : summaryTokens.colors).slice(0, 18),
          typography: normalizeList(evidenceTokens.typography && evidenceTokens.typography.length ? evidenceTokens.typography : summaryTokens.typography).slice(0, 14),
          spacing: normalizeList(evidenceTokens.spacing && evidenceTokens.spacing.length ? evidenceTokens.spacing : summaryTokens.spacing).slice(0, 8),
          radii: normalizeList(evidenceTokens.radii && evidenceTokens.radii.length ? evidenceTokens.radii : summaryTokens.radii).slice(0, 8),
          shadows: normalizeList(evidenceTokens.shadows && evidenceTokens.shadows.length ? evidenceTokens.shadows : summaryTokens.shadows).slice(0, 8),
          surfaces: normalizeList(evidence && evidence.surfaces && evidence.surfaces.length ? evidence.surfaces : summaryTokens.surfaces).slice(0, 8),
          components: pickedComponents.slice(0, 12),
        };
      }

      function colorVarName(color, index) {
        const fromEvidence = color && color.cssVariable ? String(color.cssVariable) : '';
        if (fromEvidence.startsWith('--')) return fromEvidence;
        if (fromEvidence) return '--' + slug(fromEvidence);
        return '--color-' + slug(color && color.name ? color.name : 'color-' + (index + 1));
      }

      function buildCssVariables(tokenData) {
        const lines = [':root {'];
        tokenData.colors.forEach((color, index) => {
          lines.push('  ' + colorVarName(color, index) + ': ' + (color.value || '#000000') + ';');
        });

        const uniqueFonts = [];
        const seenFonts = new Set();
        tokenData.typography.forEach((item) => {
          const key = String(item.fontFamily || '').trim();
          if (!key || seenFonts.has(key)) return;
          seenFonts.add(key);
          uniqueFonts.push(key);
        });

        if (uniqueFonts[0]) lines.push('  --font-body: ' + uniqueFonts[0] + ';');
        if (uniqueFonts[1]) lines.push('  --font-display: ' + uniqueFonts[1] + ';');

        tokenData.typography.slice(0, 5).forEach((item, index) => {
          const role = slug(item.role || 'text-' + (index + 1));
          lines.push('  --font-size-' + role + '-' + (index + 1) + ': ' + (item.fontSize || '16px') + ';');
          lines.push('  --font-weight-' + role + '-' + (index + 1) + ': ' + (item.fontWeight || '400') + ';');
        });

        tokenData.spacing.forEach((item, index) => {
          lines.push('  --space-' + slug(item.name || 'space-' + (index + 1)) + ': ' + (item.value || '0px') + ';');
        });
        tokenData.radii.forEach((item, index) => {
          lines.push('  --radius-' + slug(item.name || 'radius-' + (index + 1)) + ': ' + (item.value || '0px') + ';');
        });
        tokenData.shadows.forEach((item, index) => {
          lines.push('  --shadow-' + slug(item.name || 'shadow-' + (index + 1)) + ': ' + (item.value || 'none') + ';');
        });
        lines.push('}');
        return lines.join('\\n');
      }

      function buildTailwindTheme(tokenData) {
        const lines = ['@theme {'];
        tokenData.colors.forEach((color, index) => {
          lines.push('  --color-' + slug(color.name || 'color-' + (index + 1)) + ': ' + (color.value || '#000000') + ';');
        });

        const uniqueFonts = [];
        const seenFonts = new Set();
        tokenData.typography.forEach((item) => {
          const key = String(item.fontFamily || '').trim();
          if (!key || seenFonts.has(key)) return;
          seenFonts.add(key);
          uniqueFonts.push(key);
        });
        if (uniqueFonts[0]) lines.push('  --font-body: ' + uniqueFonts[0] + ';');
        if (uniqueFonts[1]) lines.push('  --font-display: ' + uniqueFonts[1] + ';');

        tokenData.spacing.forEach((item, index) => {
          lines.push('  --spacing-' + slug(item.name || 'space-' + (index + 1)) + ': ' + (item.value || '0px') + ';');
        });
        tokenData.radii.forEach((item, index) => {
          lines.push('  --radius-' + slug(item.name || 'radius-' + (index + 1)) + ': ' + (item.value || '0px') + ';');
        });
        tokenData.shadows.forEach((item, index) => {
          lines.push('  --shadow-' + slug(item.name || 'shadow-' + (index + 1)) + ': ' + (item.value || 'none') + ';');
        });
        lines.push('}');
        return lines.join('\\n');
      }

      function buildJsonTokens(data, tokenData) {
        const payload = {
          runId: data.runId,
          source: data.summary && data.summary.source ? data.summary.source : { primaryUrl: data.url },
          styleThesis: data.summary && data.summary.styleThesis ? data.summary.styleThesis : '',
          pagesInspected: normalizeList(data.summary.pages).length,
          colors: tokenData.colors.map((item, index) => ({
            name: item.name || 'Color ' + (index + 1),
            value: item.value || '#000000',
            role: item.role || 'color',
            confidence: item.confidence || 'low',
          })),
          typography: tokenData.typography.map((item, index) => ({
            name: (item.role || 'text') + '-' + (index + 1),
            fontFamily: item.fontFamily || 'sans-serif',
            fontSize: item.fontSize || '16px',
            fontWeight: item.fontWeight || '400',
            lineHeight: item.lineHeight || 'normal',
            letterSpacing: item.letterSpacing || 'normal',
            confidence: item.confidence || 'low',
          })),
          spacing: tokenData.spacing,
          radii: tokenData.radii,
          shadows: tokenData.shadows,
          surfaces: tokenData.surfaces,
          warnings: normalizeList(data.summary.warnings),
          components: tokenData.components.map((item) => ({
            name: item.name,
            kind: item.kind,
            role: item.role,
            textSample: item.textSample || '',
            selector: item.selector || '',
            count: item.count,
            styles: item.styles || {},
            bounds: item.bounds || null,
            confidence: item.confidence,
          })),
        };
        return JSON.stringify(payload, null, 2);
      }
  `;
}
