import type { RawPageEvidence } from '../extract/collectPageEvidence.js';
import { confidenceFromFrequency } from './confidence.js';
import {
  cleanFontFamily,
  cleanSelector,
  componentName,
  normalizeStyleValue,
  structuralSignature,
  styleSignalScore,
} from './normalizeHelpers.js';
import { roundPxValue, roundStyleValues } from './normalizeValues.js';

// Visual component-TYPE identity, computed from a component's desktop-representative
// styles (after stage-1 viewport collapse, so size props are stable rather than
// breakpoint-scaled). Two instances of the same component at different DOM
// locations share this signature and merge into one row with a real reuse count.
// Size props (fontSize/padding/borderRadius/shadow) ARE in the key, so a pill
// button (radius 160px) and a sharp button (radius 8px) stay distinct.
function visualSignature(kind: string, styles: Record<string, string>): string {
  return [
    kind,
    normalizeStyleValue(styles.color),
    normalizeStyleValue(styles.backgroundColor),
    normalizeStyleValue(styles.fontFamily),
    roundPxValue(normalizeStyleValue(styles.fontSize)),
    roundPxValue(normalizeStyleValue(styles.padding)),
    roundPxValue(normalizeStyleValue(styles.borderRadius)),
    normalizeStyleValue(styles.border),
    normalizeStyleValue(styles.boxShadow),
  ].join('|');
}

function pxNum(value: string | undefined): number {
  const n = Number.parseFloat(value ?? '');
  return Number.isFinite(n) ? n : 0;
}

function isTransparentBg(value: string | undefined): boolean {
  const v = (value ?? '').trim().toLowerCase();
  return (
    v === '' ||
    v === 'transparent' ||
    v === 'rgba(0, 0, 0, 0)' ||
    v.startsWith('#00000000')
  );
}

function hasRealBorder(value: string | undefined): boolean {
  const v = (value ?? '').trim().toLowerCase();
  if (!v || v === 'none') return false;
  if (/^0(?:px)?(?:\s|$)/.test(v)) return false;
  return !v.includes('transparent');
}

// Descriptive component name from style signals, e.g. "Primary Pill Button",
// "Outline Button", "Icon Button", "Elevated Card", "Outlined Card".
function describeComponent(
  kind: string,
  styles: Record<string, string>,
  bounds: { width: number; height: number },
  textSample: string,
): string {
  const radius = pxNum(styles.borderRadius);
  const isPill = bounds.height > 0 && radius >= bounds.height / 2 - 1;

  if (kind === 'button') {
    const noText = textSample.trim().length === 0;
    const small = bounds.width <= 64 && bounds.height <= 64;
    if (noText && small) return 'Icon Button';
    let variant: string;
    if (!isTransparentBg(styles.backgroundColor)) variant = 'Primary';
    else if (hasRealBorder(styles.border)) variant = 'Outline';
    else variant = 'Text';
    return `${variant}${isPill ? ' Pill' : ''} Button`;
  }

  if (kind === 'card') {
    if (styles.boxShadow && styles.boxShadow !== 'none') return 'Elevated Card';
    if (hasRealBorder(styles.border)) return 'Outlined Card';
    return 'Surface Card';
  }

  if (kind === 'badge') return isPill ? 'Pill Badge' : 'Badge';

  return componentName(kind);
}

type NormalizedComponent = {
  name: string;
  kind: string;
  role: string;
  textSample: string;
  viewport: string;
  viewports: string[];
  selector: string;
  count: number;
  styles: Record<string, string>;
  bounds: { width: number; height: number };
  confidence: 'high' | 'medium' | 'low';
};

type ComponentEntry = {
  kind: string;
  textSample: string;
  viewport: string;
  selector: string;
  styles: Record<string, string>;
  bounds: { width: number; height: number };
  signalScore: number;
  representativeWidth: number;
  instancesByViewport: Map<string, number>;
};

// Two-stage component normalization:
//   Stage 1 — collapse per-viewport samples into one row per structural identity
//     (kind + selector + fontFamily). Webflow/Framer rem-scale fontSize/padding/
//     borderRadius per breakpoint, so keying on those scaled values would split
//     one element into N near-duplicate rows; structuralSignature ignores them.
//     The widest (desktop) viewport's values become the representative.
//   Stage 2 — regroup those per-element representatives into component TYPES by
//     visualSignature (desktop values, size props included), so the same button/
//     card appearing in many places becomes one row with a real reuse count.
export function normalizeComponents(
  rawPages: Array<RawPageEvidence & { viewport: string }>,
  viewports: Array<{ name: string; width: number; height: number }>,
): NormalizedComponent[] {
  const viewportWidth = new Map<string, number>(
    viewports.map((viewport) => [viewport.name, viewport.width]),
  );
  const widthFor = (name: string): number => viewportWidth.get(name) ?? 0;

  const componentMap = new Map<string, ComponentEntry>();

  for (const page of rawPages) {
    const pageWidth = widthFor(page.viewport);
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

      const key = structuralSignature(
        component.kind,
        component.selector,
        component.styles,
      );
      const signalScore = styleSignalScore(component);
      const existing = componentMap.get(key);

      if (existing) {
        existing.instancesByViewport.set(
          page.viewport,
          (existing.instancesByViewport.get(page.viewport) ?? 0) + 1,
        );
        if (component.textSample.length > existing.textSample.length) {
          existing.textSample = component.textSample;
        }
        // Representative = widest viewport; tiebreak by higher signal score.
        const beatsOnWidth = pageWidth > existing.representativeWidth;
        const tiesOnWidth = pageWidth === existing.representativeWidth;
        if (
          beatsOnWidth ||
          (tiesOnWidth && signalScore > existing.signalScore)
        ) {
          existing.selector = component.selector;
          existing.viewport = page.viewport;
          existing.bounds = component.bounds;
          existing.styles = component.styles;
          existing.signalScore = signalScore;
          existing.representativeWidth = pageWidth;
        }
        continue;
      }

      componentMap.set(key, {
        kind: component.kind,
        textSample: component.textSample,
        viewport: page.viewport,
        selector: component.selector,
        styles: component.styles,
        bounds: component.bounds,
        signalScore,
        representativeWidth: pageWidth,
        instancesByViewport: new Map([[page.viewport, 1]]),
      });
    }
  }

  // Per-element representatives that survived stage 1 (one row per DOM element,
  // viewports already collapsed). count = instances of that element in any single
  // viewport; viewportSet = where it was seen.
  const elements = Array.from(componentMap.values())
    .filter(
      (entry) => entry.signalScore > 0 || entry.textSample.trim().length > 0,
    )
    .map((entry) => ({
      ...entry,
      count: Math.max(...entry.instancesByViewport.values()),
      viewportSet: new Set(entry.instancesByViewport.keys()),
    }));

  // Stage 2: regroup elements into component TYPES by visual signature, summing
  // instance counts. A type seen N times across the page becomes one row, count N.
  type TypeEntry = (typeof elements)[number];
  const typeMap = new Map<string, TypeEntry>();
  for (const element of elements) {
    const key = visualSignature(element.kind, element.styles);
    const existing = typeMap.get(key);
    if (!existing) {
      typeMap.set(key, {
        ...element,
        viewportSet: new Set(element.viewportSet),
      });
      continue;
    }
    existing.count += element.count;
    for (const viewport of element.viewportSet)
      existing.viewportSet.add(viewport);
    if (element.textSample.length > existing.textSample.length) {
      existing.textSample = element.textSample;
    }
    // Representative sample = widest viewport, then highest signal score.
    if (
      element.representativeWidth > existing.representativeWidth ||
      (element.representativeWidth === existing.representativeWidth &&
        element.signalScore > existing.signalScore)
    ) {
      existing.selector = element.selector;
      existing.viewport = element.viewport;
      existing.bounds = element.bounds;
      existing.styles = element.styles;
      existing.signalScore = element.signalScore;
      existing.representativeWidth = element.representativeWidth;
    }
  }

  return Array.from(typeMap.values())
    .sort((a, b) => {
      if (b.signalScore !== a.signalScore) return b.signalScore - a.signalScore;
      return b.count - a.count;
    })
    .slice(0, 80)
    .map((entry) => {
      const viewportNames = [...entry.viewportSet].sort(
        (a, b) => widthFor(b) - widthFor(a),
      );
      const name = describeComponent(
        entry.kind,
        entry.styles,
        entry.bounds,
        entry.textSample,
      );
      return {
        name,
        kind: entry.kind,
        role: `${name} component`,
        textSample: entry.textSample,
        viewport: entry.viewport,
        viewports: viewportNames,
        selector: entry.selector,
        count: entry.count,
        styles: roundStyleValues(entry.styles),
        bounds: entry.bounds,
        confidence: confidenceFromFrequency(entry.count),
      };
    });
}
