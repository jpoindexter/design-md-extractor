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
  const colorCounts = new Map<string, { frequency: number; backgroundCount: number; properties: Set<string>; selectors: Set<string> }>();

  for (const page of input.rawPages) {
    for (const color of page.colors) {
      const current = colorCounts.get(color.value) ?? {
        frequency: 0,
        backgroundCount: 0,
        properties: new Set<string>(),
        selectors: new Set<string>(),
      };
      current.frequency += 1;
      if (color.property === 'backgroundColor') {
        current.backgroundCount += 1;
      }
      current.properties.add(color.property);
      current.selectors.add(color.selector);
      colorCounts.set(color.value, current);
    }
  }

  const colors = Array.from(colorCounts.entries())
    .sort((a, b) => {
      if (b[1].backgroundCount !== a[1].backgroundCount) {
        return b[1].backgroundCount - a[1].backgroundCount;
      }
      return b[1].frequency - a[1].frequency;
    })
    .slice(0, 16)
    .map(([value, data], index) => {
      const name = tokenNameFromColor(value, index);
      return {
        name,
        value,
        cssVariable: `--color-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        role: data.backgroundCount > 0 ? 'Surface or background color' : 'Text, border, or accent color',
        properties: Array.from(data.properties),
        frequency: data.frequency,
        sampleSelectors: Array.from(data.selectors).slice(0, 5),
        confidence: confidenceFromFrequency(data.frequency),
      };
    });

  const typographyMap = new Map<
    string,
    {
      role: string;
      fontFamily: string;
      fallback: string;
      fontSize: string;
      fontWeight: string;
      lineHeight: string;
      letterSpacing: string;
      sampleSelectors: string[];
      seen: number;
    }
  >();

  for (const sample of input.rawPages.flatMap((page) => page.typography)) {
    const key = [
      sample.role,
      sample.fontFamily,
      sample.fontSize,
      sample.fontWeight,
      sample.lineHeight,
      sample.letterSpacing,
    ].join('|');
    const current = typographyMap.get(key);
    if (current) {
      current.seen += 1;
      if (current.sampleSelectors.length < 3 && !current.sampleSelectors.includes(sample.selector)) {
        current.sampleSelectors.push(sample.selector);
      }
      continue;
    }

    typographyMap.set(key, {
      role: sample.role,
      fontFamily: sample.fontFamily,
      fallback: 'system-ui',
      fontSize: sample.fontSize,
      fontWeight: sample.fontWeight,
      lineHeight: sample.lineHeight,
      letterSpacing: sample.letterSpacing,
      sampleSelectors: [sample.selector],
      seen: 1,
    });
  }

  const typography = Array.from(typographyMap.values())
    .sort((a, b) => b.seen - a.seen)
    .slice(0, 12)
    .map((item) => ({
      role: item.role,
      fontFamily: item.fontFamily,
      fallback: item.fallback,
      fontSize: item.fontSize,
      fontWeight: item.fontWeight,
      lineHeight: item.lineHeight,
      letterSpacing: item.letterSpacing,
      sampleSelectors: item.sampleSelectors,
      confidence: confidenceFromFrequency(item.seen),
    }));

  const componentMap = new Map<
    string,
    {
      name: string;
      kind: string;
      role: string;
      textSample: string;
      viewport: string;
      selector: string;
      count: number;
      styles: Record<string, string>;
      bounds: { width: number; height: number };
    }
  >();

  for (const page of input.rawPages) {
    for (const component of page.components) {
      const key = [component.kind, component.selector, component.textSample].join('|');
      const existing = componentMap.get(key);
      if (existing) {
        existing.count += 1;
        continue;
      }

      componentMap.set(key, {
        name: componentName(component.kind),
        kind: component.kind,
        role: `${componentName(component.kind)} component`,
        textSample: component.textSample,
        viewport: page.viewport,
        selector: component.selector,
        count: 1,
        styles: component.styles,
        bounds: component.bounds,
      });
    }
  }

  const components = Array.from(componentMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 80)
    .map((component) => ({
      ...component,
      confidence: confidenceFromFrequency(component.count),
    }));

  const surfaceCandidates = Array.from(colorCounts.entries())
    .filter(([, data]) => data.backgroundCount > 0)
    .sort((a, b) => {
      if (b[1].backgroundCount !== a[1].backgroundCount) {
        return b[1].backgroundCount - a[1].backgroundCount;
      }
      return b[1].frequency - a[1].frequency;
    })
    .slice(0, 4)
    .map(([value, data], index) => ({
      level: index,
      name: index === 0 ? 'Base Surface' : `Surface ${index}`,
      value,
      purpose: 'Surface or background color',
      sampleSelectors: Array.from(data.selectors).slice(0, 5),
      confidence: confidenceFromFrequency(data.backgroundCount),
    }));

  const surfaces =
    surfaceCandidates.length > 0
      ? surfaceCandidates
      : colors.slice(0, 4).map((color, index) => ({
          level: index,
          name: index === 0 ? 'Base Surface' : `Surface ${index}`,
          value: color.value,
          purpose: color.role,
          sampleSelectors: color.sampleSelectors,
          confidence: color.confidence,
        }));

  const uniquePageUrls = new Set(input.pages.map((page) => page.url));

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
    surfaces,
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
      uniquePageUrls.size <= 1
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
