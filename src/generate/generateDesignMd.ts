import type { Evidence } from '../types/evidence.js';
import { generateStyleCss } from './generateStyleCss.js';

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

function compactList(
  values: Array<string | number> | undefined,
  unit = '',
): string {
  if (!values || values.length === 0) {
    return 'No strong evidence.';
  }
  return values
    .map((value) => `\`${value}${typeof value === 'number' ? unit : ''}\``)
    .join(', ');
}

function typographyRows(evidence: Evidence): string {
  if (evidence.tokens.typography.length === 0) {
    return '| Role | Font | Size | Weight | Line Height | Letter Spacing | Confidence |\n|------|------|------|--------|-------------|----------------|------------|';
  }

  return [
    '| Role | Font | Size | Weight | Line Height | Letter Spacing | Confidence |',
    '|------|------|------|--------|-------------|----------------|------------|',
    ...evidence.tokens.typography.map(
      (typography) =>
        `| ${typography.role} | ${typography.fontFamily} | ${typography.fontSize} | ${typography.fontWeight} | ${typography.lineHeight} | ${typography.letterSpacing} | ${typography.confidence} |`,
    ),
  ].join('\n');
}

function tokenRows(
  tokens: Array<{ name: string; value: string; confidence: string }>,
): string {
  if (tokens.length === 0) {
    return '| Name | Value | Confidence |\n|------|-------|------------|';
  }

  return [
    '| Name | Value | Confidence |',
    '|------|-------|------------|',
    ...tokens.map(
      (token) => `| ${token.name} | \`${token.value}\` | ${token.confidence} |`,
    ),
  ].join('\n');
}

function gradientRows(evidence: Evidence): string {
  const gradients = evidence.tokens.gradients ?? [];
  if (gradients.length === 0) {
    return 'No gradients detected.';
  }
  return [
    '| Name | Value | Confidence |',
    '|------|-------|------------|',
    ...gradients.map((g) => `| ${g.name} | \`${g.value}\` | ${g.confidence} |`),
  ].join('\n');
}

function surfaceRows(evidence: Evidence): string {
  if (evidence.surfaces.length === 0) {
    return '| Level | Name | Value | Purpose | Confidence |\n|-------|------|-------|---------|------------|';
  }

  return [
    '| Level | Name | Value | Purpose | Confidence |',
    '|-------|------|-------|---------|------------|',
    ...evidence.surfaces.map(
      (surface) =>
        `| ${surface.level} | ${surface.name} | \`${surface.value}\` | ${surface.purpose} | ${surface.confidence} |`,
    ),
  ].join('\n');
}

function primaryColor(evidence: Evidence, fallbackRole: string): string {
  return (
    evidence.tokens.colors.find((color) =>
      color.role.toLowerCase().includes(fallbackRole),
    )?.value ?? 'unconfirmed'
  );
}

function styleThesis(evidence: Evidence, name: string): string {
  const typography = evidence.tokens.typography[0];
  const canvas =
    evidence.surfaces[0]?.value ?? primaryColor(evidence, 'background');
  const colorSummary =
    evidence.tokens.colors.length === 0
      ? 'an unconfirmed palette'
      : `${canvas} canvas cues and ${primaryColor(evidence, 'text')} text cues`;
  const typeSummary = typography
    ? `${typography.fontFamily} for ${typography.role} at ${typography.fontSize}/${typography.lineHeight}`
    : 'an unconfirmed type system';
  const surfaceSummary =
    evidence.surfaces.length === 0
      ? 'no confirmed surface hierarchy'
      : `${evidence.surfaces.length} observed surface level${evidence.surfaces.length === 1 ? '' : 's'}`;
  const componentSummary =
    evidence.components.length === 0
      ? 'components need manual review'
      : `${evidence.components.length} reusable component sample${evidence.components.length === 1 ? '' : 's'}`;

  return `${name} reads as a ${evidence.layout.density} interface with ${colorSummary}, ${typeSummary}, and ${surfaceSummary}. The strongest reusable move is the relationship between those tokens and ${componentSummary}; keep the roles intact when adapting the style rather than copying the original page verbatim.`;
}

function componentSection(evidence: Evidence): string {
  if (evidence.components.length === 0) {
    return 'No reusable components were confidently detected. Treat buttons, cards, forms, and navigation as gaps to inspect manually before implementation.';
  }

  return evidence.components
    .map((component) => {
      const background =
        component.styles.backgroundColor ??
        component.styles.background ??
        'unconfirmed';
      const color = component.styles.color ?? 'unconfirmed';
      const font = component.styles.fontFamily ?? 'unconfirmed';
      const fontSize = component.styles.fontSize ?? 'unconfirmed';
      const fontWeight = component.styles.fontWeight ?? 'unconfirmed';
      const radius = component.styles.borderRadius ?? 'unconfirmed';
      const shadow = component.styles.boxShadow ?? 'unconfirmed';
      const padding = component.styles.padding ?? 'unconfirmed';
      const sample = component.textSample
        ? `\`${component.textSample}\``
        : 'No text sample captured';
      const viewportPhrase =
        component.viewports && component.viewports.length > 0
          ? `across ${component.viewports.join(', ')}`
          : `in ${component.viewport}`;

      return `### ${component.name}

- Role: ${component.role}.
- Text sample: ${sample}.
- Color: background \`${background}\`, text \`${color}\`.
- Typography: ${font}, ${fontSize}, weight ${fontWeight}.
- Spacing: padding \`${padding}\`, observed bounds ${component.bounds.width}x${component.bounds.height}px.
- Radius: \`${radius}\`.
- Border and shadow: shadow \`${shadow}\`.
- Observed as \`${component.kind}\` at \`${component.selector}\` ${viewportPhrase}; count ${component.count}.
- Confidence: ${component.confidence}.`;
    })
    .join('\n\n');
}

function warningsSection(evidence: Evidence): string {
  const warnings =
    evidence.warnings.length === 0
      ? ['- No extraction warnings recorded.']
      : evidence.warnings.map(
          (warning) => `- ${warning.severity}: ${warning.message}`,
        );

  if (evidence.screenshots.length === 0) {
    warnings.push('- No screenshots were included in this artifact set.');
  }
  if (evidence.tokens.spacing.length === 0) {
    warnings.push('- Spacing tokens were not confidently detected.');
  }
  if (evidence.tokens.radii.length === 0) {
    warnings.push('- Radius tokens were not confidently detected.');
  }
  if (evidence.tokens.shadows.length === 0) {
    warnings.push('- Shadow tokens were not confidently detected.');
  }

  return warnings.join('\n');
}

export function generateDesignMd(evidence: Evidence): string {
  const name = siteName(evidence.source.primaryUrl);
  const inspectedPages = evidence.source.pages
    .map((page) => `- ${page.url}: ${page.status}`)
    .join('\n');
  const viewportList = evidence.viewports
    .map(
      (viewport) => `- ${viewport.name}: ${viewport.width}x${viewport.height}`,
    )
    .join('\n');
  const screenshots =
    evidence.screenshots.length === 0
      ? '- No screenshots captured.'
      : evidence.screenshots
          .map((screenshot) => `- ${screenshot.viewport}: ${screenshot.path}`)
          .join('\n');

  return `# Design System: ${name}

## 1. Style Thesis

${styleThesis(evidence, name)}

## 2. Source Evidence

Captured at: ${evidence.source.capturedAt}

Inspected pages:

${inspectedPages}

Viewports:

${viewportList}

Screenshots:

${screenshots}

## 3. Tokens

### Colors

${colorRows(evidence)}

### Typography

${typographyRows(evidence)}

### Spacing

${tokenRows(evidence.tokens.spacing)}

### Radii

${tokenRows(evidence.tokens.radii)}

### Shadows

${tokenRows(evidence.tokens.shadows)}

### Gradients

${gradientRows(evidence)}

## 4. Surfaces

${surfaceRows(evidence)}

## 5. Components

${componentSection(evidence)}

## 6. Layout System

Density: ${evidence.layout.density}

Container widths: ${compactList(evidence.layout.containerWidths, 'px')}.

Section rhythm: ${compactList(evidence.layout.sectionGaps)}.

Use the captured density as the baseline. Preserve relative spacing before inventing new scale steps.

## 7. Imagery & Media

Strategy: ${evidence.imagery.strategy}

${evidence.imagery.notes?.map((note) => `- ${note}`).join('\n') ?? '- No imagery notes recorded.'}

## 8. Responsive Behavior

${evidence.responsive.notes.map((note) => `- ${note}`).join('\n')}

## 9. Do's and Don'ts

### Do
- Preserve the ${evidence.layout.density} density and token roles before changing visual weight.
- Use the extracted tokens by semantic role, not just by matching raw values.
- Keep low-confidence tokens behind manual review until screenshots confirm them.

### Don't
- Do not copy proprietary assets, logos, or licensed typefaces.
- Do not treat sparse evidence as a complete brand system.
- Do not reuse component values outside their observed role without checking the source screenshot.

## 10. Agent Prompt Guide

Use the color, typography, surface, and component tables above as the source of truth. Build one component at a time and reference token names instead of raw values where possible.

### CSS Token Starter

\`\`\`css
${generateStyleCss(evidence).trim()}
\`\`\`

## 11. Known Gaps

${warningsSection(evidence)}
`;
}
