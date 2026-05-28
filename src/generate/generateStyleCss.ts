import type { Evidence } from '../types/evidence.js';

export function slug(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return normalized || 'token';
}

export function cssVariable(prefix: string, name: string): string {
  const normalizedName = slug(name);
  const prefixSlug = slug(prefix);
  const suffix = normalizedName.startsWith(`${prefixSlug}-`)
    ? normalizedName.slice(prefixSlug.length + 1)
    : normalizedName;
  return `--${prefixSlug}-${suffix || 'token'}`;
}

function cssLines(evidence: Evidence): string[] {
  const lines = [':root {'];

  for (const color of evidence.tokens.colors) {
    lines.push(
      `  ${color.cssVariable ?? cssVariable('color', color.name)}: ${color.value};`,
    );
  }

  for (const surface of evidence.surfaces) {
    lines.push(`  ${cssVariable('surface', surface.name)}: ${surface.value};`);
  }

  for (const typography of evidence.tokens.typography) {
    const role = slug(typography.role);
    lines.push(`  --font-${role}: ${typography.fontFamily};`);
    lines.push(`  --font-size-${role}: ${typography.fontSize};`);
    lines.push(`  --font-weight-${role}: ${typography.fontWeight};`);
    lines.push(`  --line-height-${role}: ${typography.lineHeight};`);
    lines.push(`  --letter-spacing-${role}: ${typography.letterSpacing};`);
  }

  for (const spacing of evidence.tokens.spacing) {
    lines.push(`  ${cssVariable('space', spacing.name)}: ${spacing.value};`);
  }

  for (const radius of evidence.tokens.radii) {
    lines.push(`  ${cssVariable('radius', radius.name)}: ${radius.value};`);
  }

  for (const shadow of evidence.tokens.shadows) {
    lines.push(`  ${cssVariable('shadow', shadow.name)}: ${shadow.value};`);
  }

  lines.push('}');
  return lines;
}

export function generateStyleCss(evidence: Evidence): string {
  return `${cssLines(evidence).join('\n')}\n`;
}
