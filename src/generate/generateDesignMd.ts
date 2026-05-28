import type { Evidence } from '../types/evidence.js';

function siteName(url: string): string {
  const parsed = new URL(url);
  if (parsed.protocol === 'file:') {
    const segments = parsed.pathname.split('/').filter(Boolean);
    return segments.at(-1) ?? 'local-file';
  }

  const host = parsed.hostname.replace(/^www\./, '');
  return host || 'site';
}

function colorRows(evidence: Evidence): string {
  if (evidence.tokens.colors.length === 0) {
    return '| Name | Value | Token | Role | Confidence |\\n|------|-------|-------|------|------------|\\n';
  }

  return [
    '| Name | Value | Token | Role | Confidence |',
    '|------|-------|-------|------|------------|',
    ...evidence.tokens.colors.map(
      (color) =>
        `| ${color.name} | \`${color.value}\` | \`${color.cssVariable ?? ''}\` | ${color.role} | ${color.confidence} |`,
    ),
  ].join('\n');
}

function typographyRows(evidence: Evidence): string {
  return [
    '| Role | Font | Size | Weight | Line Height | Letter Spacing | Confidence |',
    '|------|------|------|--------|-------------|----------------|------------|',
    ...evidence.tokens.typography.map(
      (typography) =>
        `| ${typography.role} | ${typography.fontFamily} | ${typography.fontSize} | ${typography.fontWeight} | ${typography.lineHeight} | ${typography.letterSpacing} | ${typography.confidence} |`,
    ),
  ].join('\n');
}

function surfaceRows(evidence: Evidence): string {
  return [
    '| Level | Name | Value | Purpose | Confidence |',
    '|-------|------|-------|---------|------------|',
    ...evidence.surfaces.map(
      (surface) =>
        `| ${surface.level} | ${surface.name} | \`${surface.value}\` | ${surface.purpose} | ${surface.confidence} |`,
    ),
  ].join('\n');
}

export function generateDesignMd(evidence: Evidence): string {
  const name = siteName(evidence.source.primaryUrl);
  const inspectedPages = evidence.source.pages.map((page) => `- ${page.url}: ${page.status}`).join('\n');
  const viewportList = evidence.viewports
    .map((viewport) => `- ${viewport.name}: ${viewport.width}x${viewport.height}`)
    .join('\n');
  const warnings =
    evidence.warnings.length === 0
      ? '- No extraction warnings recorded.'
      : evidence.warnings.map((warning) => `- ${warning.severity}: ${warning.message}`).join('\n');

  return `# Design System: ${name}

## 1. Style Thesis

${name} uses a ${evidence.layout.density} visual density. The extracted style reference below is grounded in computed browser evidence and should be refined by reviewing screenshots before use in production.

## 2. Source Evidence

Captured at: ${evidence.source.capturedAt}

Inspected pages:

${inspectedPages}

Viewports:

${viewportList}

## 3. Tokens

### Colors

${colorRows(evidence)}

### Typography

${typographyRows(evidence)}

## 4. Surfaces

${surfaceRows(evidence)}

## 5. Components

${
  evidence.components.length === 0
    ? 'No reusable components were confidently detected.'
    : evidence.components
        .map((component) => `### ${component.name}\n\nRole: ${component.role}\n\nConfidence: ${component.confidence}`)
        .join('\n\n')
}

## 6. Layout System

Density: ${evidence.layout.density}

## 7. Imagery & Media

Strategy: ${evidence.imagery.strategy}

${evidence.imagery.notes?.map((note) => `- ${note}`).join('\n') ?? '- No imagery notes recorded.'}

## 8. Responsive Behavior

${evidence.responsive.notes.map((note) => `- ${note}`).join('\n')}

## 9. Do's and Don'ts

### Do
- Use the extracted tokens by semantic role.
- Preserve confidence notes when adapting the design.

### Don't
- Do not copy proprietary assets, logos, or licensed typefaces.
- Do not treat sparse evidence as a complete brand system.

## 10. Agent Prompt Guide

Use the color, typography, surface, and component tables above as the source of truth. Build one component at a time and reference token names instead of raw values where possible.

## 11. Known Gaps

${warnings}
`;
}
