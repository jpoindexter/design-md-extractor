import type { Evidence } from '../types/evidence.js';

function siteName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function generateAiPrompt(evidence: Evidence): string {
  const name = siteName(evidence.source.primaryUrl);
  const canvas = evidence.surfaces[0]?.value ?? 'unknown';
  const primaryFont = evidence.tokens.typography[0];
  const topColors = evidence.tokens.colors
    .slice(0, 6)
    .map((c) => `${c.value} (${c.name})`)
    .join(', ');
  const topFonts = [
    ...new Set(evidence.tokens.typography.map((t) => t.fontFamily)),
  ]
    .slice(0, 3)
    .join(', ');
  const topSpacing = evidence.tokens.spacing
    .slice(0, 4)
    .map((s) => s.value)
    .join(', ');
  const topRadii = evidence.tokens.radii
    .slice(0, 3)
    .map((r) => r.value)
    .join(', ');
  const topShadows = evidence.tokens.shadows
    .slice(0, 2)
    .map((s) => s.value)
    .join('; ');
  const componentNames = evidence.components
    .slice(0, 8)
    .map((c) => `${c.name} (${c.kind})`)
    .join(', ');

  const lines: Array<string | null> = [
    `# Rebuild prompt: ${name}`,
    '',
    `Canvas: ${canvas}`,
    `Layout density: ${evidence.layout.density}`,
    evidence.layout.containerWidths?.length
      ? `Container widths: ${evidence.layout.containerWidths.join(', ')}px`
      : null,
    '',
    `## Colors`,
    topColors || 'No colors detected',
    '',
    `## Typography`,
    primaryFont
      ? `Primary: ${primaryFont.fontFamily} — ${primaryFont.fontSize}/${primaryFont.lineHeight} weight ${primaryFont.fontWeight}`
      : 'No typography detected',
    `Font families: ${topFonts || 'unconfirmed'}`,
    '',
    `## Spacing & shape`,
    `Padding scale: ${topSpacing || 'unconfirmed'}`,
    `Border radius: ${topRadii || 'unconfirmed'}`,
    topShadows ? `Shadows: ${topShadows}` : null,
    '',
    `## Components`,
    componentNames || 'No components detected',
    '',
    `## Surfaces`,
    evidence.surfaces.length > 0
      ? evidence.surfaces
          .map((s) => `Level ${s.level} (${s.name}): ${s.value}`)
          .join('\n')
      : 'No surfaces detected',
    '',
    `Captured: ${evidence.source.capturedAt}`,
  ];

  return lines.filter((l): l is string => l !== null).join('\n');
}
