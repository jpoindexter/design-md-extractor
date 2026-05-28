import type { RawPageEvidence } from '../extract/collectPageEvidence.js';
import type { Evidence } from '../types/evidence.js';
import { confidenceFromFrequency } from './confidence.js';
import { EvidenceSchema } from './evidenceSchema.js';

type NormalizeInput = {
  primaryUrl: string;
  pages: Array<{ url: string; status: 'success' | 'failed'; error?: string }>;
  capturedAt: string;
  viewports: Array<{ name: string; width: number; height: number }>;
  screenshots: Array<{ viewport: string; url: string; path: string }>;
  rawPages: Array<RawPageEvidence & { viewport: string }>;
};

function tokenNameFromColor(value: string, index: number): string {
  if (value === '#ffffff') return 'Canvas White';
  if (value === '#000000') return 'Rich Black';
  return `Color ${index + 1}`;
}

function componentName(kind: string): string {
  return kind
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

export function normalizeEvidence(input: NormalizeInput): Evidence {
  const colorCounts = new Map<string, { frequency: number; properties: Set<string>; selectors: Set<string> }>();

  for (const page of input.rawPages) {
    for (const color of page.colors) {
      const current = colorCounts.get(color.value) ?? {
        frequency: 0,
        properties: new Set<string>(),
        selectors: new Set<string>(),
      };
      current.frequency += 1;
      current.properties.add(color.property);
      current.selectors.add(color.selector);
      colorCounts.set(color.value, current);
    }
  }

  const colors = Array.from(colorCounts.entries())
    .sort((a, b) => b[1].frequency - a[1].frequency)
    .slice(0, 16)
    .map(([value, data], index) => {
      const name = tokenNameFromColor(value, index);
      return {
        name,
        value,
        cssVariable: `--color-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        role: data.properties.has('backgroundColor') ? 'Surface or background color' : 'Text, border, or accent color',
        properties: Array.from(data.properties),
        frequency: data.frequency,
        sampleSelectors: Array.from(data.selectors).slice(0, 5),
        confidence: confidenceFromFrequency(data.frequency),
      };
    });

  const typography = input.rawPages
    .flatMap((page) => page.typography)
    .slice(0, 12)
    .map((typography) => ({
      role: typography.role,
      fontFamily: typography.fontFamily,
      fallback: 'system-ui',
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      lineHeight: typography.lineHeight,
      letterSpacing: typography.letterSpacing,
      sampleSelectors: [typography.selector],
      confidence: 'medium' as const,
    }));

  const components = input.rawPages
    .flatMap((page) =>
      page.components.map((component) => ({
        name: componentName(component.kind),
        kind: component.kind,
        role: `${componentName(component.kind)} component`,
        textSample: component.textSample,
        viewport: page.viewport,
        selector: component.selector,
        count: 1,
        styles: component.styles,
        bounds: component.bounds,
        confidence: 'medium' as const,
      })),
    )
    .slice(0, 80);

  const evidence: Evidence = {
    version: '0.1.0',
    source: {
      primaryUrl: input.primaryUrl,
      pages: input.pages,
      capturedAt: input.capturedAt,
    },
    viewports: input.viewports,
    screenshots: input.screenshots,
    tokens: {
      colors,
      typography,
      spacing: [],
      radii: [],
      shadows: [],
    },
    surfaces: colors.slice(0, 4).map((color, index) => ({
      level: index,
      name: index === 0 ? 'Base Surface' : `Surface ${index}`,
      value: color.value,
      purpose: color.role,
      sampleSelectors: color.sampleSelectors,
      confidence: color.confidence,
    })),
    components,
    layout: {
      density: 'comfortable',
    },
    imagery: {
      strategy: 'unknown',
      notes: [],
    },
    responsive: {
      notes: input.viewports.map((viewport) => `${viewport.name} captured at ${viewport.width}x${viewport.height}.`),
    },
    warnings:
      input.pages.length <= 1
        ? [
            {
              code: 'limited-pages',
              message: 'Only one page was inspected, so site-wide coverage is limited.',
              severity: 'info' as const,
            },
          ]
        : [],
  };

  return EvidenceSchema.parse(evidence);
}
