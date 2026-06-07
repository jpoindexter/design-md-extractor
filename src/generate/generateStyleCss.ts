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

  const varSeen = new Map<string, number>();
  for (const color of evidence.tokens.colors) {
    const base = color.cssVariable ?? cssVariable('color', color.name);
    const count = varSeen.get(base) ?? 0;
    varSeen.set(base, count + 1);
    const varName = count === 0 ? base : `${base}-${count}`;
    lines.push(`  ${varName}: ${color.value};`);
  }

  for (const surface of evidence.surfaces) {
    lines.push(`  ${cssVariable('surface', surface.name)}: ${surface.value};`);
  }

  const roleSeen = new Map<string, number>();
  for (const typography of evidence.tokens.typography) {
    const role = slug(typography.role);
    const count = roleSeen.get(role) ?? 0;
    roleSeen.set(role, count + 1);
    const varRole = count === 0 ? role : `${role}-${count}`;
    lines.push(`  --font-${varRole}: ${typography.fontFamily};`);
    lines.push(`  --font-size-${varRole}: ${typography.fontSize};`);
    lines.push(`  --font-weight-${varRole}: ${typography.fontWeight};`);
    lines.push(`  --line-height-${varRole}: ${typography.lineHeight};`);
    lines.push(`  --letter-spacing-${varRole}: ${typography.letterSpacing};`);
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
