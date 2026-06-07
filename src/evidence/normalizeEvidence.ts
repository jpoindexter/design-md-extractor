import type { RawPageEvidence } from '../extract/collectPageEvidence.js';
import type { Evidence } from '../types/evidence.js';
import { confidenceFromFrequency } from './confidence.js';
import { EvidenceSchema } from './evidenceSchema.js';
import {
  buildFontFaces,
  buildSurfaces,
  type ColorCountData,
  cleanFontFamily,
  cleanSelector,
  componentName,
  styleSignalScore,
  styleSignature,
  styleTokensFromComponents,
  tokenNameFromColor,
  typographySignalScore,
} from './normalizeHelpers.js';
import { normalizeTypographyKey } from './normalizeValues.js';

type NormalizeInput = {
  primaryUrl: string;
  pages: Array<{ url: string; status: 'success' | 'failed'; error?: string }>;
  capturedAt: string;
  viewports: Array<{ name: string; width: number; height: number }>;
  screenshots: Array<{ viewport: string; url: string; path: string }>;
  rawPages: Array<RawPageEvidence & { viewport: string }>;
};

export function normalizeEvidence(input: NormalizeInput): Evidence {
  const colorCounts = new Map<string, ColorCountData>();

  for (const page of input.rawPages) {
    for (const color of page.colors) {
      const current = colorCounts.get(color.value) ?? {
        frequency: 0,
        backgroundCount: 0,
        pageBackgroundCount: 0,
        aboveFoldArea: 0,
        totalArea: 0,
        properties: new Set<string>(),
        selectors: new Set<string>(),
      };
      current.frequency += 1;
      if (color.property === 'backgroundColor') {
        current.backgroundCount += 1;
        const area = color.area ?? 0;
        if (color.aboveFold && area > current.aboveFoldArea) {
          current.aboveFoldArea = area;
        }
        if (area > current.totalArea) {
          current.totalArea = area;
        }
      }
      current.properties.add(color.property);
      current.selectors.add(cleanSelector(color.selector));
      colorCounts.set(color.value, current);
    }
    if (page.rootBackground) {
      const bgData = colorCounts.get(page.rootBackground);
      if (bgData) bgData.pageBackgroundCount += 1;
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
        role:
          data.backgroundCount > 0
            ? 'Surface or background color'
            : 'Text, border, or accent color',
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
    const cleanFamily = cleanFontFamily(sample.fontFamily);
    const cleanSel = cleanSelector(sample.selector);
    const key = normalizeTypographyKey({
      role: sample.role,
      fontFamily: cleanFamily,
      fontSize: sample.fontSize,
      fontWeight: sample.fontWeight,
      lineHeight: sample.lineHeight,
      letterSpacing: sample.letterSpacing,
    });
    const current = typographyMap.get(key);
    if (current) {
      current.seen += 1;
      if (
        current.sampleSelectors.length < 3 &&
        !current.sampleSelectors.includes(cleanSel)
      ) {
        current.sampleSelectors.push(cleanSel);
      }
      continue;
    }

    typographyMap.set(key, {
      role: sample.role,
      fontFamily: cleanFamily,
      fallback: 'system-ui',
      fontSize: sample.fontSize,
      fontWeight: sample.fontWeight,
      lineHeight: sample.lineHeight,
      letterSpacing: sample.letterSpacing,
      sampleSelectors: [cleanSel],
      seen: 1,
    });
  }

  const typography = Array.from(typographyMap.values())
    .sort((a, b) => {
      const scoreDelta = typographySignalScore(b) - typographySignalScore(a);
      if (scoreDelta !== 0) return scoreDelta;
      return b.seen - a.seen;
    })
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
      viewports: Set<string>;
      selector: string;
      count: number;
      styles: Record<string, string>;
      bounds: { width: number; height: number };
      signalScore: number;
    }
  >();

  for (const page of input.rawPages) {
    for (const component of page.components) {
      if (component.styles.fontFamily) {
        component.styles.fontFamily = cleanFontFamily(
          component.styles.fontFamily,
        );
      }
      if (component.styles.font) {
        component.styles.font = cleanFontFamily(component.styles.font);
      }
      component.selector = cleanSelector(component.selector);
      const key = [component.kind, styleSignature(component.styles)].join('|');
      const existing = componentMap.get(key);
      if (existing) {
        existing.count += 1;
        existing.viewports.add(page.viewport);
        if (component.textSample.length > existing.textSample.length) {
          existing.textSample = component.textSample;
        }
        if (styleSignalScore(component) > existing.signalScore) {
          existing.selector = component.selector;
          existing.viewport = page.viewport;
          existing.bounds = component.bounds;
          existing.signalScore = styleSignalScore(component);
        }
        continue;
      }

      const signalScore = styleSignalScore(component);
      componentMap.set(key, {
        name: componentName(component.kind),
        kind: component.kind,
        role: `${componentName(component.kind)} component`,
        textSample: component.textSample,
        viewport: page.viewport,
        viewports: new Set([page.viewport]),
        selector: component.selector,
        count: 1,
        styles: component.styles,
        bounds: component.bounds,
        signalScore,
      });
    }
  }

  const components = Array.from(componentMap.values())
    .filter(
      (component) =>
        component.signalScore > 0 || component.textSample.trim().length > 0,
    )
    .sort((a, b) => {
      if (b.signalScore !== a.signalScore) return b.signalScore - a.signalScore;
      return b.count - a.count;
    })
    .slice(0, 80)
    .map((component) => ({
      ...component,
      viewports: [...component.viewports],
      confidence: confidenceFromFrequency(component.count),
    }));

  const spacing = styleTokensFromComponents(components, 'padding', 'Padding', [
    '0px',
    '0px 0px',
    '0px 0px 0px 0px',
  ]);
  const radii = styleTokensFromComponents(
    components,
    'borderRadius',
    'Radius',
    ['0px', '0px 0px', '0px 0px 0px 0px'],
  );
  const shadows = styleTokensFromComponents(components, 'boxShadow', 'Shadow', [
    'none',
  ]);

  const surfaces = buildSurfaces(colorCounts, colors);

  const top1 = surfaces[0];
  const top2 = surfaces[1];
  const d1 = top1 ? colorCounts.get(top1.value) : undefined;
  const d2 = top2 ? colorCounts.get(top2.value) : undefined;
  const ambiguityWarnings: Array<{
    code: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
  }> = [];

  if (
    top1 &&
    top2 &&
    d1 &&
    d2 &&
    d1.pageBackgroundCount > 0 &&
    d2.pageBackgroundCount > 0
  ) {
    const ratio = d2.pageBackgroundCount / d1.pageBackgroundCount;
    if (ratio >= 0.75) {
      ambiguityWarnings.push({
        code: 'AMBIGUOUS_CANVAS',
        message: `Canvas is ambiguous: ${top1.value} and ${top2.value} appear as the root background on similar numbers of pages. Confirm the base surface manually.`,
        severity: 'warning',
      });
      if (top1.confidence === 'high') {
        top1.confidence = 'medium';
      }
    }
  }

  const fontFaces = buildFontFaces(input.rawPages, typography, components);

  const uniquePageUrls = new Set(input.pages.map((page) => page.url));

  // Aggregate layout signals from all raw pages.
  const allContainerWidths = input.rawPages.flatMap(
    (p) => p.containerWidths ?? [],
  );
  const allSectionGaps = input.rawPages.flatMap((p) => p.sectionGaps ?? []);

  function topNValues<T extends string | number>(values: T[], n: number): T[] {
    const counts = new Map<string, number>();
    for (const v of values)
      counts.set(String(v), (counts.get(String(v)) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k]) => values.find((v) => String(v) === k) as T);
  }

  const containerWidths = [...new Set(topNValues(allContainerWidths, 4))].sort(
    (a, b) => b - a,
  );

  const medianGap =
    allSectionGaps.length > 0
      ? allSectionGaps.slice().sort((a, b) => a - b)[
          Math.floor(allSectionGaps.length / 2)
        ]
      : undefined;

  const density =
    medianGap === undefined
      ? 'comfortable'
      : medianGap < 24
        ? 'compact'
        : medianGap > 64
          ? 'spacious'
          : 'comfortable';

  const sectionGapTokens = topNValues(
    allSectionGaps.map((g) => `${g}px`),
    4,
  );

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
      spacing,
      radii,
      shadows,
    },
    surfaces,
    components,
    fontFaces,
    layout: {
      density,
      containerWidths: containerWidths.length > 0 ? containerWidths : undefined,
      sectionGaps: sectionGapTokens.length > 0 ? sectionGapTokens : undefined,
    },
    imagery: {
      strategy: 'unknown',
      notes: [],
    },
    responsive: {
      notes: input.viewports.map(
        (viewport) =>
          `${viewport.name} captured at ${viewport.width}x${viewport.height}.`,
      ),
    },
    warnings: [
      ...ambiguityWarnings,
      ...(uniquePageUrls.size <= 1
        ? [
            {
              code: 'limited-pages',
              message:
                'Only one page was inspected, so site-wide coverage is limited.',
              severity: 'info' as const,
            },
          ]
        : []),
    ],
  };

  return EvidenceSchema.parse(evidence);
}
