import type { Evidence } from '../types/evidence.js';
import { cssVariable } from './generateStyleCss.js';

function colorScale(colors: Evidence['tokens']['colors']): string {
  const keySeen = new Map<string, number>();
  return colors
    .map((c) => {
      const base = (c.cssVariable ?? cssVariable('color', c.name)).replace(
        /^--color-/,
        '',
      );
      const count = keySeen.get(base) ?? 0;
      keySeen.set(base, count + 1);
      const key = count === 0 ? base : `${base}-${count}`;
      return `        '${key}': '${c.value}',`;
    })
    .join('\n');
}

function fontScale(typography: Evidence['tokens']['typography']): string {
  const keySeen = new Map<string, number>();
  return typography
    .map((t) => {
      const base = t.role.replace(/\s+/g, '-');
      const count = keySeen.get(base) ?? 0;
      keySeen.set(base, count + 1);
      const key = count === 0 ? base : `${base}-${count}`;
      return `        '${key}': ['${t.fontSize}', { lineHeight: '${t.lineHeight}', letterSpacing: '${t.letterSpacing}', fontWeight: '${t.fontWeight}' }],`;
    })
    .join('\n');
}

function spacingScale(spacing: Evidence['tokens']['spacing']): string {
  return spacing.map((s, i) => `        '${i + 1}': '${s.value}',`).join('\n');
}

function borderRadiusScale(radii: Evidence['tokens']['radii']): string {
  return radii.map((r, i) => `        '${i + 1}': '${r.value}',`).join('\n');
}

export function generateTailwind(evidence: Evidence): string {
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
${colorScale(evidence.tokens.colors)}
      },
      fontSize: {
${fontScale(evidence.tokens.typography)}
      },
      spacing: {
${spacingScale(evidence.tokens.spacing)}
      },
      borderRadius: {
${borderRadiusScale(evidence.tokens.radii)}
      },
    },
  },
};
`;
}
