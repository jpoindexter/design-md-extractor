import type { RawPageEvidence } from '../extract/collectPageEvidence.js';
import { confidenceFromFrequency } from './confidence.js';
import {
  cleanFontFamily,
  cleanSelector,
  componentName,
  structuralSignature,
  styleSignalScore,
} from './normalizeHelpers.js';
import { roundStyleValues } from './normalizeValues.js';

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

// Collapse the per-viewport component samples into one row per structural
// identity (kind + selector + fontFamily). Webflow/Framer rem-scale fontSize/
// padding/borderRadius per breakpoint, so keying on those scaled values splits
// one logical element into N near-duplicate rows. structuralSignature ignores
// them; we keep the widest (desktop) viewport's values as the representative,
// track which viewports each was seen in, and set count to the max instances in
// any single viewport (not the cross-viewport total).
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

  return Array.from(componentMap.values())
    .filter(
      (entry) => entry.signalScore > 0 || entry.textSample.trim().length > 0,
    )
    .sort((a, b) => {
      if (b.signalScore !== a.signalScore) return b.signalScore - a.signalScore;
      const aCount = Math.max(...a.instancesByViewport.values());
      const bCount = Math.max(...b.instancesByViewport.values());
      return bCount - aCount;
    })
    .slice(0, 80)
    .map((entry) => {
      const count = Math.max(...entry.instancesByViewport.values());
      const viewportNames = [...entry.instancesByViewport.keys()].sort(
        (a, b) => widthFor(b) - widthFor(a),
      );
      return {
        name: componentName(entry.kind),
        kind: entry.kind,
        role: `${componentName(entry.kind)} component`,
        textSample: entry.textSample,
        viewport: entry.viewport,
        viewports: viewportNames,
        selector: entry.selector,
        count,
        styles: roundStyleValues(entry.styles),
        bounds: entry.bounds,
        confidence: confidenceFromFrequency(count),
      };
    });
}
