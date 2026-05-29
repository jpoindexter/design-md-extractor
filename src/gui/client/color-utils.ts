export function colorUtilsJs(): string {
  return `
      function colorToRgb(value) {
        const color = String(value || '').trim().toLowerCase();
        if (color.startsWith('#')) {
          const hex = color.slice(1);
          if (hex.length === 3) {
            return [
              Number.parseInt(hex[0] + hex[0], 16),
              Number.parseInt(hex[1] + hex[1], 16),
              Number.parseInt(hex[2] + hex[2], 16),
            ];
          }
          if (hex.length === 6) {
            return [
              Number.parseInt(hex.slice(0, 2), 16),
              Number.parseInt(hex.slice(2, 4), 16),
              Number.parseInt(hex.slice(4, 6), 16),
            ];
          }
        }
        const match = color.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
        if (match) {
          return [Number(match[1]), Number(match[2]), Number(match[3])];
        }
        return null;
      }

      function colorLuminance(value) {
        const rgb = colorToRgb(value);
        if (!rgb) return 0.8;
        return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
      }

      function colorSaturation(value) {
        const rgb = colorToRgb(value);
        if (!rgb) return 0;
        const max = Math.max(rgb[0], rgb[1], rgb[2]) / 255;
        const min = Math.min(rgb[0], rgb[1], rgb[2]) / 255;
        if (max === min) return 0;
        const lightness = (max + min) / 2;
        return (max - min) / (1 - Math.abs(2 * lightness - 1));
      }

      function numericPx(value) {
        const match = String(value || '').match(/([\\d.]+)/);
        return match ? Number.parseFloat(match[1]) : 0;
      }

      function contrastTextColor(background) {
        return colorLuminance(background) > 0.62 ? '#141715' : '#f4f6f4';
      }

      function pickReadableTextColor(colors, background) {
        const bgLum = colorLuminance(background);
        const ranked = normalizeList(colors)
          .map((color) => safeColorValue(color && color.value ? color.value : ''))
          .filter(Boolean)
          .map((value) => ({
            value,
            delta: Math.abs(colorLuminance(value) - bgLum),
            saturation: colorSaturation(value),
          }))
          .sort((a, b) => b.delta - a.delta || a.saturation - b.saturation);
        const readable = ranked.find((item) => item.delta >= 0.34);
        return readable ? readable.value : contrastTextColor(background);
      }

      function uniqueColorValues(items) {
        const seen = new Set();
        return normalizeList(items)
          .map((item) => safeColorValue(item && item.value ? item.value : item))
          .filter((value) => {
            if (!colorToRgb(value) || isTransparentColor(value)) return false;
            const key = value.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
      }

      function blendColor(value, target, amount) {
        const rgb = colorToRgb(value);
        if (!rgb) return value;
        const mixed = rgb.map((part, index) => Math.round(part * (1 - amount) + target[index] * amount));
        return 'rgb(' + mixed.join(', ') + ')';
      }

      function alphaColor(value, alpha) {
        const rgb = colorToRgb(value);
        if (!rgb) return 'rgba(0, 0, 0, ' + alpha + ')';
        return 'rgba(' + rgb.join(', ') + ', ' + alpha + ')';
      }

      function confidenceScore(value) {
        if (value === 'high') return 3;
        if (value === 'medium') return 2;
        return 1;
      }

      function sourceWords(source) {
        return [
          source && source.name,
          source && source.role,
          source && source.purpose,
          ...(normalizeList(source && source.sampleSelectors)),
        ]
          .join(' ')
          .toLowerCase();
      }

      function tokenSourceForValue(value, sources) {
        return normalizeList(sources).find((source) => safeColorValue(source && source.value).toLowerCase() === String(value).toLowerCase()) || {};
      }
  `;
}
