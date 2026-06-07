import { confidenceFromFrequency } from './confidence.js';
import { roundPxValue } from './normalizeValues.js';

export function tokenNameFromColor(value: string, index: number): string {
  if (value === '#ffffff') return 'Canvas White';
  if (value === '#000000') return 'Rich Black';

  const hex =
    value.startsWith('#') && value.length === 7 ? value.slice(1) : null;
  if (hex) {
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const s =
      max === min
        ? 0
        : l > 0.5
          ? (max - min) / (2 - max - min)
          : (max - min) / (max + min);

    if (l > 0.93) return 'Off White';
    if (l < 0.08) return 'Near Black';
    if (s < 0.12)
      return l > 0.6 ? 'Light Gray' : l > 0.35 ? 'Gray' : 'Dark Gray';

    const d = max - min;
    const h =
      max === r
        ? ((g - b) / d + (g < b ? 6 : 0)) / 6
        : max === g
          ? ((b - r) / d + 2) / 6
          : ((r - g) / d + 4) / 6;
    const hDeg = h * 360;

    if (hDeg < 15 || hDeg >= 345) return 'Red';
    if (hDeg < 45) return 'Orange';
    if (hDeg < 75) return 'Yellow';
    if (hDeg < 150) return 'Green';
    if (hDeg < 195) return 'Teal';
    if (hDeg < 255) return 'Blue';
    if (hDeg < 300) return 'Purple';
    return 'Pink';
  }

  return `Color ${index + 1}`;
}

export function componentName(kind: string): string {
  return kind
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

export function normalizeStyleValue(value: string | undefined): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

export function nonTransparentColor(value: string | undefined): boolean {
  const normalized = normalizeStyleValue(value);
  return (
    normalized !== '' &&
    normalized !== 'transparent' &&
    normalized !== 'rgba(0, 0, 0, 0)' &&
    normalized !== '#00000000'
  );
}

// NOTE: the `[\\d.]` here matches a literal backslash, not digits — a pre-existing
// quirk kept verbatim during extraction so scoring behavior is unchanged.
export function numericPx(value: string | undefined): number {
  const match = String(value ?? '').match(/([\\d.]+)/);
  return match ? Number.parseFloat(match[1]) : 0;
}

export function nonZeroBorder(value: string | undefined): boolean {
  const normalized = normalizeStyleValue(value);
  if (!normalized || normalized === 'none') return false;
  return (
    !/^0(?:\\.0+)?px\\b/.test(normalized) &&
    !normalized.includes(' transparent')
  );
}

export function styleSignalScore(component: {
  styles: Record<string, string>;
  textSample: string;
  bounds: { width: number; height: number };
}): number {
  let score = 0;
  if (nonTransparentColor(component.styles.backgroundColor)) score += 3;
  if (nonZeroBorder(component.styles.border)) score += 2;
  if (numericPx(component.styles.borderRadius) > 0) score += 2;
  if (numericPx(component.styles.padding) >= 8) score += 2;
  if (
    normalizeStyleValue(component.styles.boxShadow) !== '' &&
    normalizeStyleValue(component.styles.boxShadow) !== 'none'
  )
    score += 2;
  if (component.textSample.trim().length >= 10) score += 1;
  if (component.bounds.width >= 120 && component.bounds.height >= 60)
    score += 1;
  return score;
}

export function typographySignalScore(item: {
  role: string;
  fontSize: string;
  fontWeight: string;
  seen: number;
}): number {
  const role = normalizeStyleValue(item.role);
  const size = numericPx(item.fontSize);
  const weight = Number.parseInt(item.fontWeight, 10);
  let score = item.seen * 3 + size / 4;
  if (role.includes('heading')) score += 12;
  if (role.includes('button') || role.includes('link')) score += 4;
  if (Number.isFinite(weight) && weight >= 600) score += 2;
  if (size >= 32) score += 8;
  return score;
}

export function styleSignature(styles: Record<string, string>): string {
  return [
    normalizeStyleValue(styles.color),
    normalizeStyleValue(styles.backgroundColor),
    normalizeStyleValue(styles.border),
    normalizeStyleValue(styles.borderRadius),
    normalizeStyleValue(styles.padding),
    normalizeStyleValue(styles.fontFamily),
    normalizeStyleValue(styles.fontSize),
    normalizeStyleValue(styles.fontWeight),
    normalizeStyleValue(styles.boxShadow),
  ].join('|');
}

// Recover the human-readable family from framework-hashed font tokens (Next.js
// `next/font` emits `__polySans_c5b537` + a `__polySans_Fallback_c5b537` / quoted
// `"Geist Fallback"` duplicate). Maps the former to `polySans`, drops the latter.
// Works on bare font-family lists and the `font` shorthand; clean names pass through.
export function cleanFontFamily(fontFamily: string): string {
  const out: string[] = [];
  for (const raw of fontFamily.split(',')) {
    const part = raw.trim();
    if (!part) continue;
    if (/__[A-Za-z0-9]+_Fallback_[a-z0-9]{4,}/.test(part)) continue;
    if (/\sFallback$/i.test(part.replace(/['"]/g, '').trim())) continue;
    const cleaned = part
      .replace(/__([A-Za-z][A-Za-z0-9]*)_[a-z0-9]{4,}/g, '$1')
      .trim();
    if (cleaned && !out.includes(cleaned)) out.push(cleaned);
  }
  return out.join(', ') || fontFamily.trim();
}

// First family in a list, normalized for matching (no quotes, lowercase).
export function firstFamilyName(fontFamily: string): string {
  return (fontFamily.split(',')[0] || '')
    .trim()
    .replace(/['"]/g, '')
    .toLowerCase();
}

// Drop framework-generated hashed class tokens (e.g. `.__variable_c5b537`) from a
// sample selector so DESIGN.md/JSON show a readable DOM path, not build-hash noise.
export function cleanSelector(selector: string): string {
  const cleaned = selector
    .replace(/\.__\w+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return cleaned || selector.trim();
}

export function isUsefulTokenValue(
  value: string | undefined,
  rejected: string[],
): value is string {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 && !rejected.includes(normalized);
}

export function styleTokensFromComponents(
  components: Array<{ styles: Record<string, string> }>,
  property: string,
  label: string,
  rejected: string[],
): Array<{
  name: string;
  value: string;
  confidence: 'high' | 'medium' | 'low';
}> {
  const counts = new Map<string, number>();
  for (const component of components) {
    const value = component.styles[property];
    if (!isUsefulTokenValue(value, rejected)) continue;
    const normalized = roundPxValue(value);
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([value, count], index) => ({
      name: `${label} ${index + 1}`,
      value,
      confidence: confidenceFromFrequency(count),
    }));
}

type ColorCountData = {
  frequency: number;
  backgroundCount: number;
  properties: Set<string>;
  selectors: Set<string>;
};
type Confidence = 'high' | 'medium' | 'low';
type SurfaceToken = {
  level: number;
  name: string;
  value: string;
  purpose: string;
  sampleSelectors: string[];
  confidence: Confidence;
};

// Rank background colors into surface levels; fall back to the top colors if none.
export function buildSurfaces(
  colorCounts: Map<string, ColorCountData>,
  colors: Array<{
    value: string;
    role: string;
    sampleSelectors: string[];
    confidence: Confidence;
  }>,
): SurfaceToken[] {
  const candidates = Array.from(colorCounts.entries())
    .filter(([, data]) => data.backgroundCount > 0)
    .sort((a, b) =>
      b[1].backgroundCount !== a[1].backgroundCount
        ? b[1].backgroundCount - a[1].backgroundCount
        : b[1].frequency - a[1].frequency,
    )
    .slice(0, 4)
    .map(([value, data], index) => ({
      level: index,
      name: index === 0 ? 'Base Surface' : `Surface ${index}`,
      value,
      purpose: 'Surface or background color',
      sampleSelectors: Array.from(data.selectors).slice(0, 5),
      confidence: confidenceFromFrequency(data.backgroundCount),
    }));
  if (candidates.length > 0) return candidates;
  return colors.slice(0, 4).map((color, index) => ({
    level: index,
    name: index === 0 ? 'Base Surface' : `Surface ${index}`,
    value: color.value,
    purpose: color.role,
    sampleSelectors: color.sampleSelectors,
    confidence: color.confidence,
  }));
}

type FontFace = { family: string; weight: string; style: string; src: string };

// Capture self-hosted @font-face rules for the families the report shows, under
// the same humanized family name used elsewhere, so the GUI can render real type.
export function buildFontFaces(
  rawPages: Array<{ fontFaces?: FontFace[] }>,
  typography: Array<{ fontFamily: string }>,
  components: Array<{ styles: Record<string, string> }>,
): FontFace[] {
  const usedFamilies = new Set<string>();
  for (const item of typography)
    usedFamilies.add(firstFamilyName(item.fontFamily));
  for (const component of components) {
    if (component.styles.fontFamily) {
      usedFamilies.add(firstFamilyName(component.styles.fontFamily));
    }
  }
  const faces = new Map<string, FontFace>();
  for (const page of rawPages) {
    for (const face of page.fontFaces ?? []) {
      if (/_Fallback_[a-z0-9]{4,}/.test(face.family)) continue;
      const family = cleanFontFamily(face.family);
      if (!family || !usedFamilies.has(family.toLowerCase())) continue;
      const key = `${family.toLowerCase()}|${face.weight}|${face.style}`;
      if (faces.has(key)) continue;
      faces.set(key, {
        family,
        weight: face.weight,
        style: face.style,
        src: face.src,
      });
    }
  }
  return Array.from(faces.values()).slice(0, 16);
}
