# Extraction Quality Fix — All 4 Phases

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix canvas misdetection, token noise, and output gaps in the design-md-extractor pipeline; extend it with full export bundles and layout detection.

**Architecture:** Value-normalization layer (A) is the keystone — it cleans spacing/radii/shadows across the board. Canvas re-ranking (B) adds `rootBackground` + area signals captured in the browser, then re-orders surfaces by prominence rather than raw occurrence count. Exports consolidation (D) ports 4 in-browser generators to `src/generate/`, writes them to disk each run, and adds a server-side zip bundle endpoint. No new runtime dependencies.

**Phase order — quickest to slowest (dependencies respected):**
1. Phase 1 — Core quality (H → E → A → B → C), ~1.5h
2. Phase 3 — Type/component depth (F), ~40m
3. Phase 4 — Layout extraction (G), ~1h
4. Phase 2 — Exports + bundle (D), ~1.5h

**Tech Stack:** TypeScript/ESM/strict, Vitest, Playwright (browser-context collection), Zod, Node.js built-ins only.

**Hard constraints:**
- New `RawPageEvidence` fields are optional/default-0 — legacy tests fall through to old `backgroundCount → frequency` ranking.
- Collection code runs in `page.evaluate()` — no Node APIs, no imports, must stay serializable.
- `surfaces[0]` is the canvas — not the occurrence-sorted color list.
- Area de-nesting uses max-per-color (not sum) to avoid double-counting nested backgrounds.
- No new runtime dependencies (port existing in-browser zip to Node).

**Baseline:** Run `npm run build && npm test` first. All 28 tests must pass before any change.

---

## File Map

| Created | Responsibility |
|---|---|
| `src/evidence/normalizeValues.ts` | `roundPxValue`, `normalizeShadowValue`, `normalizeTypographyKey` |
| `tests/unit/normalizeValues.test.ts` | Unit tests for normalizeValues |
| `tests/unit/normalizeHelpers.test.ts` | Unit tests for tokenNameFromColor |
| `tests/unit/generateStyleCss.test.ts` | Assert no duplicate `--*` names |
| `src/generate/generateTailwind.ts` | Tailwind theme config generator |
| `src/generate/generateTokensJson.ts` | W3C-style design-tokens JSON generator |
| `src/generate/generateAiPrompt.ts` | AI rebuild prompt generator |
| `src/io/zip.ts` | Pure-Node ZIP archive (no new deps) |

| Modified | What changes |
|---|---|
| `src/evidence/normalizeHelpers.ts` | HSL color naming; `ColorCountData` type adds `pageBackgroundCount`/`aboveFoldArea`/`totalArea`; `buildSurfaces` sort order; `styleTokensFromComponents` normalizes values |
| `src/generate/generateStyleCss.ts` | Deduplicate typography `--*` variable names |
| `src/extract/collectPageEvidence.ts` | Add `rootBackground`, `area`/`aboveFold` per color, layout signals |
| `src/evidence/normalizeEvidence.ts` | Aggregate new fields; ambiguity warning + confidence cap; typography dedup key; component `viewports[]`; layout population |
| `src/evidence/evidenceSchema.ts` | Add optional `viewports` to component schema |
| `src/generate/generateDesignMd.ts` | Canvas cue → `surfaces[0].value` |
| `src/gui/runGuiExtraction.ts` | Dominant-color → `surfaces[0].value` |
| `src/io/writeArtifacts.ts` | Write 3 new artifact files per run |
| `src/crawl/runExtraction.ts` | Pass new generators to writeArtifacts |
| `src/gui/server.ts` | Add `GET /runs/:id/bundle.zip` route |
| `tests/fixtures/sample-site.html` | Add light hero + large dark footer + responsive paddings |
| `tests/unit/normalizeEvidence.test.ts` | New canvas/ambiguity/area test cases |

---

## Phase 1 — Core Quality

---

### Task 1 — H: Color naming heuristics in `tokenNameFromColor`

**Files:**
- Modify: `src/evidence/normalizeHelpers.ts`
- Create: `tests/unit/normalizeHelpers.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/normalizeHelpers.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { tokenNameFromColor } from '../../src/evidence/normalizeHelpers.js';

describe('tokenNameFromColor', () => {
  it('returns canonical names for pure black and white', () => {
    expect(tokenNameFromColor('#ffffff', 0)).toBe('Canvas White');
    expect(tokenNameFromColor('#000000', 0)).toBe('Rich Black');
  });

  it('names grays and near-neutrals by lightness', () => {
    expect(tokenNameFromColor('#f5f5f5', 0)).toBe('Off White');
    expect(tokenNameFromColor('#888888', 0)).toBe('Gray');
    expect(tokenNameFromColor('#aaaaaa', 0)).toBe('Light Gray');
    expect(tokenNameFromColor('#333333', 0)).toBe('Dark Gray');
    expect(tokenNameFromColor('#111111', 0)).toBe('Near Black');
  });

  it('maps hue ranges to color names', () => {
    expect(tokenNameFromColor('#ff2200', 0)).toBe('Red');
    expect(tokenNameFromColor('#ff6600', 0)).toBe('Orange');
    expect(tokenNameFromColor('#ffdd00', 0)).toBe('Yellow');
    expect(tokenNameFromColor('#22aa44', 0)).toBe('Green');
    expect(tokenNameFromColor('#00bbcc', 0)).toBe('Teal');
    expect(tokenNameFromColor('#2244ff', 0)).toBe('Blue');
    expect(tokenNameFromColor('#8833ee', 0)).toBe('Purple');
    expect(tokenNameFromColor('#ff44aa', 0)).toBe('Pink');
  });

  it('falls back to Color N for rgba and malformed values', () => {
    expect(tokenNameFromColor('rgba(255,0,0,0.5)', 2)).toBe('Color 3');
    expect(tokenNameFromColor('transparent', 0)).toBe('Color 1');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run tests/unit/normalizeHelpers.test.ts
```

Expected: several FAIL — "Off White" / "Gray" / "Red" etc. not returned yet.

- [ ] **Step 3: Replace `tokenNameFromColor` in `src/evidence/normalizeHelpers.ts`**

Replace lines 3–6 (the existing `tokenNameFromColor`):

```typescript
export function tokenNameFromColor(value: string, index: number): string {
  if (value === '#ffffff') return 'Canvas White';
  if (value === '#000000') return 'Rich Black';

  const hex = value.startsWith('#') && value.length === 7 ? value.slice(1) : null;
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
    if (s < 0.12) return l > 0.6 ? 'Light Gray' : l > 0.35 ? 'Gray' : 'Dark Gray';

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
```

- [ ] **Step 4: Run tests — all pass**

```bash
npx vitest run tests/unit/normalizeHelpers.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Run full suite — still green**

```bash
npm test
```

Expected: 28+ tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/evidence/normalizeHelpers.ts tests/unit/normalizeHelpers.test.ts
git commit -m "feat(evidence): HSL-based color naming heuristics in tokenNameFromColor"
```

---

### Task 2 — E: Deduplicate typography CSS variable names

**Files:**
- Modify: `src/generate/generateStyleCss.ts`
- Create: `tests/unit/generateStyleCss.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/generateStyleCss.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { generateStyleCss } from '../../src/generate/generateStyleCss.js';
import type { Evidence } from '../../src/types/evidence.js';

const base: Evidence = {
  version: '0.1.0',
  source: {
    primaryUrl: 'https://example.com',
    pages: [{ url: 'https://example.com', status: 'success' }],
    capturedAt: '2026-01-01T00:00:00.000Z',
  },
  viewports: [{ name: 'desktop', width: 1440, height: 900 }],
  screenshots: [],
  tokens: {
    colors: [],
    typography: [],
    spacing: [],
    radii: [],
    shadows: [],
  },
  surfaces: [],
  components: [],
  layout: { density: 'comfortable' },
  imagery: { strategy: 'unknown', notes: [] },
  responsive: { notes: [] },
  warnings: [],
};

describe('generateStyleCss', () => {
  it('emits no duplicate CSS variable names when typography roles repeat', () => {
    const evidence: Evidence = {
      ...base,
      tokens: {
        ...base.tokens,
        typography: [
          {
            role: 'text',
            fontFamily: 'Inter',
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '24px',
            letterSpacing: '0px',
            sampleSelectors: [],
            confidence: 'high',
          },
          {
            role: 'text',
            fontFamily: 'Inter',
            fontSize: '14px',
            fontWeight: '400',
            lineHeight: '20px',
            letterSpacing: '0px',
            sampleSelectors: [],
            confidence: 'medium',
          },
          {
            role: 'heading',
            fontFamily: 'Inter',
            fontSize: '32px',
            fontWeight: '700',
            lineHeight: '40px',
            letterSpacing: '-0.5px',
            sampleSelectors: [],
            confidence: 'high',
          },
        ],
      },
    };

    const css = generateStyleCss(evidence);
    const varNames = [...css.matchAll(/--([a-z][a-z0-9-]*)\s*:/g)].map((m) => m[1]);
    expect(new Set(varNames).size).toBe(varNames.length);
    expect(css).toContain('--font-text:');
    expect(css).toContain('--font-size-text:');
    expect(css).toContain('--font-text-1:');
    expect(css).toContain('--font-size-text-1:');
    expect(css).toContain('--font-heading:');
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run tests/unit/generateStyleCss.test.ts
```

Expected: FAIL — duplicate `--font-text:` / `--font-size-text:` etc.

- [ ] **Step 3: Fix `cssLines` in `src/generate/generateStyleCss.ts`**

Replace the typography loop (lines 34–41):

```typescript
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
```

- [ ] **Step 4: Run tests — pass**

```bash
npx vitest run tests/unit/generateStyleCss.test.ts
```

Expected: PASS.

- [ ] **Step 5: Full suite**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/generate/generateStyleCss.ts tests/unit/generateStyleCss.test.ts
git commit -m "fix(generate): deduplicate typography CSS variable names by appending index on repeat role"
```

---

### Task 3 — A: Value normalization layer

**Files:**
- Create: `src/evidence/normalizeValues.ts`
- Create: `tests/unit/normalizeValues.test.ts`
- Modify: `src/evidence/normalizeHelpers.ts` (import + use in `styleTokensFromComponents`)

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/normalizeValues.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import {
  roundPxValue,
  normalizeShadowValue,
  normalizeTypographyKey,
} from '../../src/evidence/normalizeValues.js';

describe('roundPxValue', () => {
  it('rounds fractional px to integers', () => {
    expect(roundPxValue('67.1635px')).toBe('67px');
    expect(roundPxValue('4.88002px')).toBe('5px');
    expect(roundPxValue('19.5201px')).toBe('20px');
  });

  it('rounds all parts of a multi-value string', () => {
    expect(roundPxValue('4.88002px 19.5201px')).toBe('5px 20px');
    expect(roundPxValue('12.5px 24.9px 6.1px')).toBe('13px 25px 6px');
  });

  it('leaves integer px values unchanged', () => {
    expect(roundPxValue('8px')).toBe('8px');
    expect(roundPxValue('16px 32px')).toBe('16px 32px');
  });

  it('leaves non-px values unchanged', () => {
    expect(roundPxValue('1.5rem')).toBe('1.5rem');
    expect(roundPxValue('none')).toBe('none');
    expect(roundPxValue('')).toBe('');
  });
});

describe('normalizeShadowValue', () => {
  it('collapses extra whitespace', () => {
    expect(normalizeShadowValue('0  4px  8px  rgba(0,0,0,0.1)')).toBe(
      '0 4px 8px rgba(0,0,0,0.1)',
    );
  });

  it('passes a clean shadow through', () => {
    expect(normalizeShadowValue('0 2px 4px rgba(0,0,0,0.1)')).toBe(
      '0 2px 4px rgba(0,0,0,0.1)',
    );
  });
});

describe('normalizeTypographyKey', () => {
  it('rounds px values in the key so scaled duplicates collapse', () => {
    const a = normalizeTypographyKey({
      role: 'body',
      fontFamily: 'Inter',
      fontSize: '16.0001px',
      fontWeight: '400',
      lineHeight: '24.0002px',
      letterSpacing: '0.0001px',
    });
    const b = normalizeTypographyKey({
      role: 'body',
      fontFamily: 'Inter',
      fontSize: '15.9999px',
      fontWeight: '400',
      lineHeight: '23.9998px',
      letterSpacing: '0px',
    });
    expect(a).toBe(b);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run tests/unit/normalizeValues.test.ts
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Create `src/evidence/normalizeValues.ts`**

```typescript
export function roundPxValue(value: string): string {
  return value.replace(/(\d+(?:\.\d+)?)px/g, (_, n) => `${Math.round(parseFloat(n))}px`);
}

export function normalizeShadowValue(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeTypographyKey(item: {
  role: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
}): string {
  return [
    item.role,
    item.fontFamily,
    roundPxValue(item.fontSize),
    item.fontWeight,
    roundPxValue(item.lineHeight),
    roundPxValue(item.letterSpacing),
  ].join('|');
}
```

- [ ] **Step 4: Run tests — pass**

```bash
npx vitest run tests/unit/normalizeValues.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Wire `roundPxValue` into `styleTokensFromComponents` in `src/evidence/normalizeHelpers.ts`**

Add the import at the top (after the existing import):

```typescript
import { roundPxValue } from './normalizeValues.js';
```

In `styleTokensFromComponents`, replace the `counts.set` line:

```typescript
// Before:
counts.set(value, (counts.get(value) ?? 0) + 1);

// After:
const normalized = roundPxValue(value);
counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
```

And update the return map to use `normalized` (the entries map uses whatever key was set, so no change needed to the `Array.from(counts.entries())` part).

Full updated `styleTokensFromComponents`:

```typescript
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
```

- [ ] **Step 6: Full suite**

```bash
npm test
```

Expected: all pass. Spacing/radii token values in existing tests are already integers (e.g., `8px`, `6px`) so no expectation changes needed.

- [ ] **Step 7: Commit**

```bash
git add src/evidence/normalizeValues.ts tests/unit/normalizeValues.test.ts src/evidence/normalizeHelpers.ts
git commit -m "feat(evidence): value normalization layer — round fractional px, normalize shadow whitespace"
```

---

### Task 4 — B: Canvas detection, area de-nesting, surface re-ranking

**Files:**
- Modify: `src/extract/collectPageEvidence.ts`
- Modify: `src/evidence/normalizeHelpers.ts`
- Modify: `src/evidence/normalizeEvidence.ts`
- Modify: `src/generate/generateDesignMd.ts`
- Modify: `src/gui/runGuiExtraction.ts`
- Modify: `tests/unit/normalizeEvidence.test.ts`

#### Step group A — Update `RawPageEvidence` type and browser collection

- [ ] **Step 1: Extend `RawPageEvidence` type in `src/extract/collectPageEvidence.ts`**

Replace the `RawPageEvidence` type definition (lines 3–27):

```typescript
export type RawPageEvidence = {
  rootBackground?: string;
  colors: Array<{
    value: string;
    property: string;
    selector: string;
    area?: number;
    aboveFold?: boolean;
  }>;
  typography: Array<{
    selector: string;
    role: string;
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    letterSpacing: string;
  }>;
  components: Array<{
    kind: string;
    selector: string;
    textSample: string;
    styles: Record<string, string>;
    bounds: { width: number; height: number };
  }>;
  fontFaces?: Array<{
    family: string;
    weight: string;
    style: string;
    src: string;
  }>;
  containerWidths?: number[];
  sectionGaps?: number[];
};
```

- [ ] **Step 2: Capture `rootBackground` in the browser code**

Inside `page.evaluate()`, after the `elements` list is built (line ~291), add before the `for` loop:

```typescript
    // Capture the page's root background for canvas detection.
    // Fall through from body → html if body is transparent.
    function rootBgColor(): string {
      const bodyBg = normalizeColor(window.getComputedStyle(document.body).backgroundColor);
      if (bodyBg && bodyBg !== 'transparent') return bodyBg;
      return normalizeColor(window.getComputedStyle(document.documentElement).backgroundColor);
    }
    const rootBackground = rootBgColor();
```

- [ ] **Step 3: Hoist `rect` in the main element loop and add `area`/`aboveFold` to color entries**

In the main `for` loop, move `const rect = element.getBoundingClientRect()` to just after `const selector = ...`, then update the color push:

Full replacement of the main loop body (lines ~299–368, showing just the changed sections):

```typescript
    for (const [order, element] of elements.entries()) {
      const style = window.getComputedStyle(element);
      const selector = selectorPath(element);
      const rect = element.getBoundingClientRect(); // hoisted — used for colors + components

      for (const property of ['color', 'backgroundColor', 'borderColor']) {
        const value = (style as CSSStyleDeclaration & Record<string, string>)[
          property
        ];
        if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
          colors.push({
            value: normalizeColor(value),
            property,
            selector,
            area: Math.round(rect.width * rect.height),
            aboveFold: rect.top < window.innerHeight,
          });
        }
      }

      // typography push — unchanged
      typography.push({
        selector,
        role: roleFor(element),
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
      });

      // component detection — rect already defined above, remove the duplicate const rect line
      const kind = componentKind(element, style, rect);
      if (kind) {
        // ... rest of component block unchanged ...
      }
    }
```

> Note: the original code has `const rect = element.getBoundingClientRect()` at ~line 322 (inside the loop, before component detection). Remove that line since `rect` is now hoisted.

- [ ] **Step 4: Add layout signal capture at the end of `page.evaluate()`, before `return`**

Just before `return { colors, typography, components, fontFaces };`, insert:

```typescript
    // Layout signals: container widths and section vertical gaps.
    const layoutSections = Array.from(
      document.querySelectorAll(
        'section, main, article, header, footer, [class*="section"], [class*="container"], [class*="wrapper"]',
      ),
    ).filter(isVisible);

    const containerWidths: number[] = [];
    const sectionRects: number[] = [];

    for (const el of layoutSections) {
      const elStyle = window.getComputedStyle(el);
      const elRect = el.getBoundingClientRect();
      const mw = numericPx(elStyle.maxWidth);
      const cw = mw > 200 && mw < window.innerWidth - 1 ? mw : elRect.width;
      if (cw > 200 && cw < window.innerWidth - 1) {
        containerWidths.push(Math.round(cw));
      }
      sectionRects.push(Math.round(elRect.top + window.scrollY));
    }

    const sortedTops = sectionRects.slice().sort((a, b) => a - b);
    const sectionGaps: number[] = [];
    for (let i = 1; i < sortedTops.length; i++) {
      const gap = (sortedTops[i] ?? 0) - (sortedTops[i - 1] ?? 0);
      if (gap > 8 && gap < 400) sectionGaps.push(gap);
    }
```

Update the return to include the new fields:

```typescript
    return { colors, typography, components, fontFaces, containerWidths, sectionGaps, rootBackground: rootBackground || undefined };
```

#### Step group B — Update `ColorCountData` and `buildSurfaces` in normalizeHelpers.ts

- [ ] **Step 5: Update `ColorCountData` type and `buildSurfaces` sort in `src/evidence/normalizeHelpers.ts`**

Replace the existing `ColorCountData` type (lines 173–178):

```typescript
type ColorCountData = {
  frequency: number;
  backgroundCount: number;
  pageBackgroundCount: number;
  aboveFoldArea: number;
  totalArea: number;
  properties: Set<string>;
  selectors: Set<string>;
};
```

Export it (add `export` keyword) — `normalizeEvidence.ts` will use it:

```typescript
export type ColorCountData = {
  frequency: number;
  backgroundCount: number;
  pageBackgroundCount: number;
  aboveFoldArea: number;
  totalArea: number;
  properties: Set<string>;
  selectors: Set<string>;
};
```

Update `buildSurfaces` signature to use the exported type:

```typescript
export function buildSurfaces(
  colorCounts: Map<string, ColorCountData>,
  colors: Array<{ ... }>,
): SurfaceToken[] {
  const candidates = Array.from(colorCounts.entries())
    .filter(([, data]) => data.backgroundCount > 0)
    .sort((a, b) => {
      const [, ad] = a;
      const [, bd] = b;
      if (bd.pageBackgroundCount !== ad.pageBackgroundCount)
        return bd.pageBackgroundCount - ad.pageBackgroundCount;
      if (bd.aboveFoldArea !== ad.aboveFoldArea)
        return bd.aboveFoldArea - ad.aboveFoldArea;
      if (bd.backgroundCount !== ad.backgroundCount)
        return bd.backgroundCount - ad.backgroundCount;
      return bd.frequency - ad.frequency;
    })
    // ... rest unchanged (.slice(0, 4).map(...))
```

#### Step group C — Update aggregation in `normalizeEvidence.ts`

- [ ] **Step 6: Update the `colorCounts` Map type and aggregation in `normalizeEvidence.ts`**

Replace the `colorCounts` declaration and the aggregation loop (lines 28–54):

```typescript
  const colorCounts = new Map<
    string,
    {
      frequency: number;
      backgroundCount: number;
      pageBackgroundCount: number;
      aboveFoldArea: number;
      totalArea: number;
      properties: Set<string>;
      selectors: Set<string>;
    }
  >();

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
    // Bump pageBackgroundCount for the root background of this page/viewport.
    if (page.rootBackground) {
      const bgData = colorCounts.get(page.rootBackground);
      if (bgData) bgData.pageBackgroundCount += 1;
    }
  }
```

#### Step group D — Fix canvas cue in generators

- [ ] **Step 7: Update `styleThesis` in `src/generate/generateDesignMd.ts` to use `surfaces[0]`**

Replace the `colorSummary` line in `styleThesis` (line ~87–88):

```typescript
  const canvas = evidence.surfaces[0]?.value ?? primaryColor(evidence, 'background');
  const textColor = primaryColor(evidence, 'text');
  const colorSummary =
    evidence.tokens.colors.length === 0
      ? 'an unconfirmed palette'
      : `${canvas} canvas cues and ${textColor} text cues`;
```

- [ ] **Step 8: Update `generateStyleThesis` in `src/gui/runGuiExtraction.ts` to use `surfaces[0]`**

Replace line ~53:

```typescript
  // Before:
  const dominantColor = evidence.tokens.colors[0]?.value;
  // After:
  const dominantColor = evidence.surfaces[0]?.value ?? evidence.tokens.colors[0]?.value;
```

#### Step group E — Tests

- [ ] **Step 9: Add canvas detection test to `tests/unit/normalizeEvidence.test.ts`**

Add this `it` block inside the `describe('normalizeEvidence', ...)` block:

```typescript
  it('ranks white page background above dark footer despite more footer occurrences', () => {
    const evidence = normalizeEvidence({
      primaryUrl: 'https://example.com',
      pages: [{ url: 'https://example.com', status: 'success' as const }],
      capturedAt: '2026-05-28T10:00:00.000Z',
      viewports: [{ name: 'desktop', width: 1440, height: 1000 }],
      screenshots: [],
      rawPages: [
        {
          viewport: 'desktop',
          rootBackground: '#ffffff',
          colors: [
            // Dark footer — many small below-fold elements
            ...Array.from({ length: 10 }, (_, i) => ({
              value: '#0a0a0a',
              property: 'backgroundColor' as const,
              selector: `.footer-item-${i}`,
              area: 200,
              aboveFold: false,
            })),
            // White hero — two large above-fold elements
            {
              value: '#ffffff',
              property: 'backgroundColor' as const,
              selector: 'body',
              area: 1440 * 900,
              aboveFold: true,
            },
            {
              value: '#ffffff',
              property: 'backgroundColor' as const,
              selector: 'section.hero',
              area: 1440 * 600,
              aboveFold: true,
            },
          ],
          typography: [],
          components: [],
        },
      ],
    });

    expect(evidence.surfaces[0]?.value).toBe('#ffffff');
  });
```

- [ ] **Step 10: Run updated test suite**

```bash
npm run build && npm test
```

Expected: all pass, including the new canvas test.

- [ ] **Step 11: Commit**

```bash
git add src/extract/collectPageEvidence.ts src/evidence/normalizeHelpers.ts src/evidence/normalizeEvidence.ts src/generate/generateDesignMd.ts src/gui/runGuiExtraction.ts tests/unit/normalizeEvidence.test.ts
git commit -m "fix(evidence): canvas detection via rootBackground + aboveFold area re-ranking"
```

---

### Task 5 — C: Ambiguity warning + confidence cap

**Files:**
- Modify: `src/evidence/normalizeEvidence.ts`
- Modify: `tests/unit/normalizeEvidence.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/unit/normalizeEvidence.test.ts`:

```typescript
  it('adds AMBIGUOUS_CANVAS warning and caps confidence when top-2 page backgrounds are close', () => {
    const evidence = normalizeEvidence({
      primaryUrl: 'https://example.com',
      pages: [
        { url: 'https://example.com', status: 'success' as const },
        { url: 'https://example.com/about', status: 'success' as const },
      ],
      capturedAt: '2026-05-28T10:00:00.000Z',
      viewports: [{ name: 'desktop', width: 1440, height: 1000 }],
      screenshots: [],
      rawPages: [
        // Page 1: rootBackground = white
        {
          viewport: 'desktop',
          rootBackground: '#ffffff',
          colors: [
            { value: '#ffffff', property: 'backgroundColor' as const, selector: 'body', area: 1440 * 900, aboveFold: true },
          ],
          typography: [],
          components: [],
        },
        // Page 2: rootBackground = near-white (different page, almost same signal)
        {
          viewport: 'desktop',
          rootBackground: '#fafafa',
          colors: [
            { value: '#fafafa', property: 'backgroundColor' as const, selector: 'body', area: 1440 * 900, aboveFold: true },
          ],
          typography: [],
          components: [],
        },
      ],
    });

    const ambiguous = evidence.warnings.find((w) => w.code === 'AMBIGUOUS_CANVAS');
    expect(ambiguous).toBeDefined();
    expect(evidence.surfaces[0]?.confidence).not.toBe('high');
  });

  it('does NOT emit AMBIGUOUS_CANVAS when one page background is clearly dominant', () => {
    const evidence = normalizeEvidence({
      primaryUrl: 'https://example.com',
      pages: [{ url: 'https://example.com', status: 'success' as const }],
      capturedAt: '2026-05-28T10:00:00.000Z',
      viewports: [{ name: 'desktop', width: 1440, height: 1000 }],
      screenshots: [],
      rawPages: [
        {
          viewport: 'desktop',
          rootBackground: '#ffffff',
          colors: [
            { value: '#ffffff', property: 'backgroundColor' as const, selector: 'body', area: 1440 * 900, aboveFold: true },
            // Dark section — small, below fold, no pageBackgroundCount signal
            { value: '#111111', property: 'backgroundColor' as const, selector: 'footer', area: 1440 * 100, aboveFold: false },
          ],
          typography: [],
          components: [],
        },
      ],
    });

    expect(evidence.warnings.find((w) => w.code === 'AMBIGUOUS_CANVAS')).toBeUndefined();
  });
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run tests/unit/normalizeEvidence.test.ts
```

Expected: the two new tests FAIL (no AMBIGUOUS_CANVAS warning exists yet).

- [ ] **Step 3: Add ambiguity check in `normalizeEvidence.ts` after `buildSurfaces`**

After `const surfaces = buildSurfaces(colorCounts, colors);` and before building `evidence`, insert:

```typescript
  // Ambiguity check: if top-2 page backgrounds are within 75% of each other, warn.
  const top1 = surfaces[0];
  const top2 = surfaces[1];
  const d1 = top1 ? colorCounts.get(top1.value) : undefined;
  const d2 = top2 ? colorCounts.get(top2.value) : undefined;
  const ambiguityWarnings: Array<{
    code: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
  }> = [];

  if (top1 && top2 && d1 && d2 && d1.pageBackgroundCount > 0 && d2.pageBackgroundCount > 0) {
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
```

Then in the `evidence` object construction, replace the `warnings` field:

```typescript
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
```

- [ ] **Step 4: Run tests — pass**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/evidence/normalizeEvidence.ts tests/unit/normalizeEvidence.test.ts
git commit -m "feat(evidence): AMBIGUOUS_CANVAS warning and confidence cap when top-2 canvases are close"
```

---

### Phase 1 Checkpoint

- [ ] **Build, test, then re-extract monarque**

```bash
npm run build && npm test
node dist/cli.js extract https://monarque.framer.website/ --out out/verify --viewports desktop
```

Check `out/verify/DESIGN.md`:
- `surfaces[0]` value in the canvas cue should now be light (not `#000000`)
- Spacing and radii tokens should be integer px values
- CSS token starter (`out/verify/tokens.css`) should have no duplicate `--font-*` names

Diff against the pre-fix reference:

```bash
diff out/monarque-rerun/DESIGN.md out/verify/DESIGN.md | head -60
```

- [ ] **Commit checkpoint note**

```bash
git commit --allow-empty -m "chore: Phase 1 checkpoint — canvas, spacing, token names verified on monarque"
```

---

## Phase 3 — Type/Component Depth

---

### Task 6 — F: Typography dedup key normalization + component `viewports[]`

**Files:**
- Modify: `src/evidence/normalizeValues.ts` (already has `normalizeTypographyKey`)
- Modify: `src/evidence/normalizeEvidence.ts`
- Modify: `src/evidence/evidenceSchema.ts`
- Modify: `tests/unit/normalizeEvidence.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `tests/unit/normalizeEvidence.test.ts`:

```typescript
  it('deduplicates typography rows that differ only by viewport sub-pixel scaling', () => {
    const evidence = normalizeEvidence({
      primaryUrl: 'https://example.com',
      pages: [{ url: 'https://example.com', status: 'success' as const }],
      capturedAt: '2026-05-28T10:00:00.000Z',
      viewports: [
        { name: 'desktop', width: 1440, height: 1000 },
        { name: 'mobile', width: 375, height: 812 },
      ],
      screenshots: [],
      rawPages: [
        {
          viewport: 'desktop',
          colors: [],
          typography: [
            {
              selector: 'h1',
              role: 'heading',
              fontFamily: 'Inter',
              fontSize: '48.0001px',
              fontWeight: '700',
              lineHeight: '57.6001px',
              letterSpacing: '0px',
            },
          ],
          components: [],
        },
        {
          viewport: 'mobile',
          colors: [],
          typography: [
            {
              selector: 'h1',
              role: 'heading',
              fontFamily: 'Inter',
              fontSize: '47.9999px',
              fontWeight: '700',
              lineHeight: '57.5999px',
              letterSpacing: '0px',
            },
          ],
          components: [],
        },
      ],
    });

    // Should be deduplicated to 1 entry, not 2
    const headingEntries = evidence.tokens.typography.filter(
      (t) => t.role === 'heading' && t.fontFamily === 'Inter',
    );
    expect(headingEntries).toHaveLength(1);
  });

  it('tracks viewports[] on components that appear across multiple viewports', () => {
    const evidence = normalizeEvidence({
      primaryUrl: 'https://example.com',
      pages: [{ url: 'https://example.com', status: 'success' as const }],
      capturedAt: '2026-05-28T10:00:00.000Z',
      viewports: [
        { name: 'desktop', width: 1440, height: 1000 },
        { name: 'mobile', width: 375, height: 812 },
      ],
      screenshots: [],
      rawPages: [
        {
          viewport: 'desktop',
          colors: [],
          typography: [],
          components: [
            {
              kind: 'button',
              selector: 'a.cta',
              textSample: 'Get started',
              styles: { backgroundColor: '#ff5900', borderRadius: '8px', padding: '12px 24px', color: '#fff' },
              bounds: { width: 140, height: 44 },
            },
          ],
        },
        {
          viewport: 'mobile',
          colors: [],
          typography: [],
          components: [
            {
              kind: 'button',
              selector: 'a.cta',
              textSample: 'Get started',
              styles: { backgroundColor: '#ff5900', borderRadius: '8px', padding: '12px 24px', color: '#fff' },
              bounds: { width: 140, height: 44 },
            },
          ],
        },
      ],
    });

    const btn = evidence.components.find((c) => c.kind === 'button');
    expect(btn?.viewports).toBeDefined();
    expect(btn?.viewports).toHaveLength(2);
    expect(btn?.viewports).toContain('desktop');
    expect(btn?.viewports).toContain('mobile');
  });
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run tests/unit/normalizeEvidence.test.ts
```

Expected: both new tests FAIL.

- [ ] **Step 3: Use `normalizeTypographyKey` in `normalizeEvidence.ts` for the typography dedup key**

Add import at the top of `src/evidence/normalizeEvidence.ts`:

```typescript
import { normalizeTypographyKey } from './normalizeValues.js';
```

Replace the manual key construction in the typography loop (lines ~99–106):

```typescript
    // Before:
    const key = [
      sample.role,
      cleanFamily,
      sample.fontSize,
      sample.fontWeight,
      sample.lineHeight,
      sample.letterSpacing,
    ].join('|');

    // After:
    const key = normalizeTypographyKey({
      role: sample.role,
      fontFamily: cleanFamily,
      fontSize: sample.fontSize,
      fontWeight: sample.fontWeight,
      lineHeight: sample.lineHeight,
      letterSpacing: sample.letterSpacing,
    });
```

- [ ] **Step 4: Add `viewports: Set<string>` tracking to the component map in `normalizeEvidence.ts`**

Update the `componentMap` value type (the inline type inside the Map generic) to add `viewports: Set<string>`:

When creating a new entry:
```typescript
      componentMap.set(key, {
        name: componentName(component.kind),
        kind: component.kind,
        role: `${componentName(component.kind)} component`,
        textSample: component.textSample,
        viewport: page.viewport,
        viewports: new Set([page.viewport]),  // new
        selector: component.selector,
        count: 1,
        styles: component.styles,
        bounds: component.bounds,
        signalScore,
      });
```

When updating an existing entry:
```typescript
      if (existing) {
        existing.count += 1;
        existing.viewports.add(page.viewport);  // new
        // ... rest unchanged ...
      }
```

In the final `.map()` that builds the output components, spread `viewports`:

```typescript
    .map((component) => ({
      ...component,
      viewports: [...component.viewports],  // new: Set → Array
      confidence: confidenceFromFrequency(component.count),
    }));
```

- [ ] **Step 5: Add optional `viewports` field to `EvidenceSchema` in `src/evidence/evidenceSchema.ts`**

In the `components` array schema, after `viewport: z.string()`, add:

```typescript
      viewport: z.string(),
      viewports: z.array(z.string()).optional(),  // new
```

- [ ] **Step 6: Run tests — pass**

```bash
npm test
```

Expected: all pass including the two new tests.

- [ ] **Step 7: Commit**

```bash
git add src/evidence/normalizeValues.ts src/evidence/normalizeEvidence.ts src/evidence/evidenceSchema.ts tests/unit/normalizeEvidence.test.ts
git commit -m "feat(evidence): normalize typography dedup key by rounded px; track component viewports[]"
```

---

### Phase 3 Checkpoint

- [ ] **Re-extract and verify**

```bash
npm run build && npm test
node dist/cli.js extract https://monarque.framer.website/ --out out/verify-p3 --viewports desktop,mobile
```

Check `out/verify-p3/evidence.json`:
- No duplicate typography rows that differ only by sub-pixel scaling.
- Components in the JSON have a `viewports` array listing observed viewports.

---

## Phase 4 — Layout Extraction

---

### Task 7 — G: Container widths, section rhythm, density derivation

**Files:**
- (Browser collection already added in Task 4, Step 4)
- Modify: `src/evidence/normalizeEvidence.ts` (aggregate layout fields)
- Modify: `tests/unit/normalizeEvidence.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/unit/normalizeEvidence.test.ts`:

```typescript
  it('populates layout containerWidths and derives density from section gaps', () => {
    const evidence = normalizeEvidence({
      primaryUrl: 'https://example.com',
      pages: [{ url: 'https://example.com', status: 'success' as const }],
      capturedAt: '2026-05-28T10:00:00.000Z',
      viewports: [{ name: 'desktop', width: 1440, height: 1000 }],
      screenshots: [],
      rawPages: [
        {
          viewport: 'desktop',
          colors: [],
          typography: [],
          components: [],
          containerWidths: [1120, 1120, 1120, 768],
          sectionGaps: [80, 80, 64, 80],
        },
      ],
    });

    expect(evidence.layout.containerWidths).toContain(1120);
    expect(evidence.layout.density).toBe('spacious'); // median gap 80 > 64
  });
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run tests/unit/normalizeEvidence.test.ts
```

Expected: FAIL — `layout.containerWidths` undefined, density still `'comfortable'`.

- [ ] **Step 3: Aggregate layout signals in `normalizeEvidence.ts`**

Before building the `evidence` object, add:

```typescript
  // Aggregate layout signals from all raw pages.
  const allContainerWidths = input.rawPages.flatMap((p) => p.containerWidths ?? []);
  const allSectionGaps = input.rawPages.flatMap((p) => p.sectionGaps ?? []);

  function topNValues<T extends string | number>(values: T[], n: number): T[] {
    const counts = new Map<string, number>();
    for (const v of values) counts.set(String(v), (counts.get(String(v)) ?? 0) + 1);
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
    medianGap === undefined ? 'comfortable'
      : medianGap < 24 ? 'compact'
      : medianGap > 64 ? 'spacious'
      : 'comfortable';

  const sectionGapTokens = topNValues(
    allSectionGaps.map((g) => `${g}px`),
    4,
  );
```

Then update the `layout` field in the `evidence` object:

```typescript
    layout: {
      density,
      containerWidths: containerWidths.length > 0 ? containerWidths : undefined,
      sectionGaps: sectionGapTokens.length > 0 ? sectionGapTokens : undefined,
    },
```

- [ ] **Step 4: Run tests — pass**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/evidence/normalizeEvidence.ts tests/unit/normalizeEvidence.test.ts
git commit -m "feat(evidence): layout extraction — container widths, section gaps, derived density"
```

---

### Phase 4 Checkpoint

- [ ] **Re-extract and verify**

```bash
npm run build && npm test
node dist/cli.js extract https://monarque.framer.website/ --out out/verify-p4
```

Check `out/verify-p4/DESIGN.md` section 7 (Layout & Spacing):
- `containerWidths` should list detected px widths (e.g. `1200px`)
- `sectionGaps` should list detected vertical rhythm values
- `density` should reflect the actual layout (not always `comfortable`)

---

## Phase 2 — Exports + Bundle

---

### Task 8 — D1: Port 4 generators to `src/generate/`

**Files:**
- Read: `src/gui/appHtml.ts` (extract existing in-browser export functions to port)
- Create: `src/generate/generateTailwind.ts`
- Create: `src/generate/generateTokensJson.ts`
- Create: `src/generate/generateAiPrompt.ts`
- Create: `tests/unit/generateTailwind.test.ts`
- Create: `tests/unit/generateTokensJson.test.ts`
- Create: `tests/unit/generateAiPrompt.test.ts`

> **Before coding:** Read `src/gui/appHtml.ts` and search for the 4 export generator functions (CSS vars is already `generateStyleCss.ts` — look for Tailwind, JSON, and AI prompt sections). Port their logic, using the typed `Evidence` object instead of building from DOM strings.

- [ ] **Step 1: Read the existing in-browser generators**

```bash
grep -n "function generate\|tailwind\|tokens\|ai.prompt\|Download" src/gui/appHtml.ts | head -40
```

Identify the 3 generator functions (Tailwind theme, JSON tokens, AI prompt) and note their line numbers.

- [ ] **Step 2: Create `src/generate/generateTailwind.ts`**

This generates a `tailwind.config.js` theme block from the evidence:

```typescript
import type { Evidence } from '../types/evidence.js';
import { cssVariable } from './generateStyleCss.js';

function fontScale(typography: Evidence['tokens']['typography']): string {
  return typography
    .map((t, i) => {
      const name = t.role.replace(/\s+/g, '-') + (i > 0 ? `-${i}` : '');
      return `        '${name}': ['${t.fontSize}', { lineHeight: '${t.lineHeight}', letterSpacing: '${t.letterSpacing}', fontWeight: '${t.fontWeight}' }],`;
    })
    .join('\n');
}

function colorScale(colors: Evidence['tokens']['colors']): string {
  return colors
    .map((c) => {
      const key = (c.cssVariable ?? cssVariable('color', c.name))
        .replace(/^--color-/, '');
      return `        '${key}': '${c.value}',`;
    })
    .join('\n');
}

function spacingScale(spacing: Evidence['tokens']['spacing']): string {
  return spacing
    .map((s, i) => `        '${i + 1}': '${s.value}',`)
    .join('\n');
}

function borderRadiusScale(radii: Evidence['tokens']['radii']): string {
  return radii
    .map((r, i) => `        '${i + 1}': '${r.value}',`)
    .join('\n');
}

export function generateTailwind(evidence: Evidence): string {
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
${colorScale(evidence.tokens.colors)}
      },
      fontSize: {
${fontScale(evidence.tokens.typography)}
      },
      spacing: {
${spacingScale(evidence.tokens.spacing)}
      },
      borderRadius: {
${borderRadiusScale(evidence.tokens.radii)}
      },
    },
  },
};
`;
}
```

- [ ] **Step 3: Create `tests/unit/generateTailwind.test.ts`**

```typescript
import { describe, expect, it } from 'vitest';
import { generateTailwind } from '../../src/generate/generateTailwind.js';
import type { Evidence } from '../../src/types/evidence.js';

const evidence: Evidence = {
  version: '0.1.0',
  source: {
    primaryUrl: 'https://example.com',
    pages: [{ url: 'https://example.com', status: 'success' }],
    capturedAt: '2026-01-01T00:00:00.000Z',
  },
  viewports: [{ name: 'desktop', width: 1440, height: 900 }],
  screenshots: [],
  tokens: {
    colors: [{ name: 'Canvas White', value: '#ffffff', cssVariable: '--color-canvas-white', role: 'background', properties: [], frequency: 5, sampleSelectors: [], confidence: 'high' }],
    typography: [{ role: 'heading', fontFamily: 'Inter', fontSize: '32px', fontWeight: '700', lineHeight: '40px', letterSpacing: '0px', sampleSelectors: [], confidence: 'high' }],
    spacing: [{ name: 'Space 1', value: '16px', confidence: 'high' }],
    radii: [{ name: 'Radius 1', value: '8px', confidence: 'high' }],
    shadows: [],
  },
  surfaces: [],
  components: [],
  layout: { density: 'comfortable' },
  imagery: { strategy: 'unknown', notes: [] },
  responsive: { notes: [] },
  warnings: [],
};

describe('generateTailwind', () => {
  it('produces valid tailwind.config.js theme shape', () => {
    const config = generateTailwind(evidence);
    expect(config).toContain("module.exports = {");
    expect(config).toContain("theme:");
    expect(config).toContain("colors:");
    expect(config).toContain("'canvas-white': '#ffffff'");
    expect(config).toContain("fontSize:");
    expect(config).toContain("'heading':");
    expect(config).toContain("'32px'");
  });
});
```

- [ ] **Step 4: Run to confirm test passes**

```bash
npx vitest run tests/unit/generateTailwind.test.ts
```

- [ ] **Step 5: Create `src/generate/generateTokensJson.ts`**

Produces W3C Design Tokens Community Group format:

```typescript
import type { Evidence } from '../types/evidence.js';

type TokenValue =
  | { $value: string; $type: string; $description?: string }

type TokenGroup = Record<string, TokenValue | TokenGroup>;

export function generateTokensJson(evidence: Evidence): string {
  const tokens: TokenGroup = {
    color: Object.fromEntries(
      evidence.tokens.colors.map((c) => [
        c.name.toLowerCase().replace(/\s+/g, '-'),
        { $value: c.value, $type: 'color', $description: c.role },
      ]),
    ),
    typography: Object.fromEntries(
      evidence.tokens.typography.map((t, i) => {
        const key = `${t.role}${i > 0 ? `-${i}` : ''}`;
        return [
          key,
          {
            'font-family': { $value: t.fontFamily, $type: 'fontFamily' },
            'font-size': { $value: t.fontSize, $type: 'dimension' },
            'font-weight': { $value: t.fontWeight, $type: 'fontWeight' },
            'line-height': { $value: t.lineHeight, $type: 'dimension' },
            'letter-spacing': { $value: t.letterSpacing, $type: 'dimension' },
          } as TokenGroup,
        ];
      }),
    ),
    spacing: Object.fromEntries(
      evidence.tokens.spacing.map((s, i) => [
        `space-${i + 1}`,
        { $value: s.value, $type: 'dimension' },
      ]),
    ),
    'border-radius': Object.fromEntries(
      evidence.tokens.radii.map((r, i) => [
        `radius-${i + 1}`,
        { $value: r.value, $type: 'dimension' },
      ]),
    ),
  };

  return `${JSON.stringify(tokens, null, 2)}\n`;
}
```

- [ ] **Step 6: Create `tests/unit/generateTokensJson.test.ts`**

```typescript
import { describe, expect, it } from 'vitest';
import { generateTokensJson } from '../../src/generate/generateTokensJson.js';
import type { Evidence } from '../../src/types/evidence.js';

const evidence: Evidence = {
  version: '0.1.0',
  source: { primaryUrl: 'https://example.com', pages: [{ url: 'https://example.com', status: 'success' }], capturedAt: '2026-01-01T00:00:00.000Z' },
  viewports: [{ name: 'desktop', width: 1440, height: 900 }],
  screenshots: [],
  tokens: {
    colors: [{ name: 'Canvas White', value: '#ffffff', cssVariable: '--color-canvas-white', role: 'background', properties: [], frequency: 5, sampleSelectors: [], confidence: 'high' }],
    typography: [],
    spacing: [{ name: 'Space 1', value: '16px', confidence: 'high' }],
    radii: [],
    shadows: [],
  },
  surfaces: [],
  components: [],
  layout: { density: 'comfortable' },
  imagery: { strategy: 'unknown', notes: [] },
  responsive: { notes: [] },
  warnings: [],
};

describe('generateTokensJson', () => {
  it('produces valid JSON with $type annotations', () => {
    const json = generateTokensJson(evidence);
    const parsed = JSON.parse(json);
    expect(parsed.color?.['canvas-white']?.['$value']).toBe('#ffffff');
    expect(parsed.color?.['canvas-white']?.['$type']).toBe('color');
    expect(parsed.spacing?.['space-1']?.['$value']).toBe('16px');
  });
});
```

- [ ] **Step 7: Run to confirm test passes**

```bash
npx vitest run tests/unit/generateTokensJson.test.ts
```

- [ ] **Step 8: Create `src/generate/generateAiPrompt.ts`**

Produces a condensed text prompt for AI rebuilds:

```typescript
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
  const topColors = evidence.tokens.colors.slice(0, 6).map((c) => `${c.value} (${c.name})`).join(', ');
  const topFonts = [...new Set(evidence.tokens.typography.map((t) => t.fontFamily))].slice(0, 3).join(', ');
  const topSpacing = evidence.tokens.spacing.slice(0, 4).map((s) => s.value).join(', ');
  const topRadii = evidence.tokens.radii.slice(0, 3).map((r) => r.value).join(', ');
  const topShadows = evidence.tokens.shadows.slice(0, 2).map((s) => s.value).join('; ');
  const componentNames = evidence.components.slice(0, 8).map((c) => `${c.name} (${c.kind})`).join(', ');

  const lines = [
    `# Rebuild prompt: ${name}`,
    '',
    `Canvas: ${canvas}`,
    `Layout density: ${evidence.layout.density}`,
    evidence.layout.containerWidths?.length
      ? `Container widths: ${evidence.layout.containerWidths.join(', ')}px`
      : null,
    '',
    `## Colors`,
    topColors,
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
    evidence.surfaces
      .map((s) => `Level ${s.level} (${s.name}): ${s.value}`)
      .join('\n') || 'No surfaces detected',
    '',
    `Captured: ${evidence.source.capturedAt}`,
  ];

  return lines.filter((l) => l !== null).join('\n');
}
```

- [ ] **Step 9: Create `tests/unit/generateAiPrompt.test.ts`**

```typescript
import { describe, expect, it } from 'vitest';
import { generateAiPrompt } from '../../src/generate/generateAiPrompt.js';
import type { Evidence } from '../../src/types/evidence.js';

const evidence: Evidence = {
  version: '0.1.0',
  source: { primaryUrl: 'https://example.com', pages: [{ url: 'https://example.com', status: 'success' }], capturedAt: '2026-01-01T00:00:00.000Z' },
  viewports: [{ name: 'desktop', width: 1440, height: 900 }],
  screenshots: [],
  tokens: {
    colors: [{ name: 'Canvas White', value: '#ffffff', cssVariable: '--color-canvas-white', role: 'background', properties: [], frequency: 5, sampleSelectors: [], confidence: 'high' }],
    typography: [{ role: 'heading', fontFamily: 'Inter', fontSize: '32px', fontWeight: '700', lineHeight: '40px', letterSpacing: '0px', sampleSelectors: [], confidence: 'high' }],
    spacing: [],
    radii: [],
    shadows: [],
  },
  surfaces: [{ level: 0, name: 'Base Surface', value: '#ffffff', purpose: 'background', sampleSelectors: [], confidence: 'high' }],
  components: [],
  layout: { density: 'comfortable' },
  imagery: { strategy: 'unknown', notes: [] },
  responsive: { notes: [] },
  warnings: [],
};

describe('generateAiPrompt', () => {
  it('contains site name, canvas, typography, and surfaces', () => {
    const prompt = generateAiPrompt(evidence);
    expect(prompt).toContain('example.com');
    expect(prompt).toContain('#ffffff');
    expect(prompt).toContain('Inter');
    expect(prompt).toContain('Level 0');
  });
});
```

- [ ] **Step 10: Run all new generator tests**

```bash
npx vitest run tests/unit/generateTailwind.test.ts tests/unit/generateTokensJson.test.ts tests/unit/generateAiPrompt.test.ts
```

Expected: all pass.

- [ ] **Step 11: Full suite**

```bash
npm test
```

- [ ] **Step 12: Commit**

```bash
git add src/generate/generateTailwind.ts src/generate/generateTokensJson.ts src/generate/generateAiPrompt.ts tests/unit/generateTailwind.test.ts tests/unit/generateTokensJson.test.ts tests/unit/generateAiPrompt.test.ts
git commit -m "feat(generate): Tailwind config, W3C JSON tokens, and AI prompt generators"
```

---

### Task 9 — D2: Write all artifacts to disk every run

**Files:**
- Modify: `src/io/writeArtifacts.ts`
- Modify: `src/crawl/runExtraction.ts`
- Modify: `tests/unit/writeArtifacts.test.ts`

- [ ] **Step 1: Update `writeArtifacts.ts` to write all 6 artifact files**

Replace `src/io/writeArtifacts.ts`:

```typescript
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generateAiPrompt } from '../generate/generateAiPrompt.js';
import { generateStyleCss } from '../generate/generateStyleCss.js';
import { generateTailwind } from '../generate/generateTailwind.js';
import { generateTokensJson } from '../generate/generateTokensJson.js';
import type { Evidence } from '../types/evidence.js';
import { resolveOutputPath } from './safePaths.js';

export async function writeArtifacts(input: {
  outDir: string;
  evidence: Evidence;
  designMd: string;
  previewHtml?: string;
}): Promise<void> {
  const outDir = resolveOutputPath(input.outDir);
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(join(outDir, 'evidence.json'), `${JSON.stringify(input.evidence, null, 2)}\n`, 'utf8'),
    writeFile(join(outDir, 'DESIGN.md'), input.designMd, 'utf8'),
    writeFile(join(outDir, 'tokens.css'), generateStyleCss(input.evidence), 'utf8'),
    writeFile(join(outDir, 'tailwind-theme.js'), generateTailwind(input.evidence), 'utf8'),
    writeFile(join(outDir, 'design-tokens.json'), generateTokensJson(input.evidence), 'utf8'),
    writeFile(join(outDir, 'ai-prompt.txt'), generateAiPrompt(input.evidence), 'utf8'),
    ...(input.previewHtml
      ? [writeFile(join(outDir, 'preview.html'), input.previewHtml, 'utf8')]
      : []),
  ]);
}
```

- [ ] **Step 2: Update `tests/unit/writeArtifacts.test.ts` to assert all files are written**

Read the current test first:

```bash
cat tests/unit/writeArtifacts.test.ts
```

Then add assertions for the 3 new files. The test should check that `tailwind-theme.js`, `design-tokens.json`, and `ai-prompt.txt` exist in the output dir after a call to `writeArtifacts`. Add after the existing file existence checks:

```typescript
    expect(await access(join(tmpDir, 'tailwind-theme.js')).then(() => true).catch(() => false)).toBe(true);
    expect(await access(join(tmpDir, 'design-tokens.json')).then(() => true).catch(() => false)).toBe(true);
    expect(await access(join(tmpDir, 'ai-prompt.txt')).then(() => true).catch(() => false)).toBe(true);
```

> If the existing test doesn't use `access`, pattern-match how it checks file existence and follow that pattern.

- [ ] **Step 3: Run writeArtifacts tests**

```bash
npx vitest run tests/unit/writeArtifacts.test.ts
```

Expected: PASS.

- [ ] **Step 4: Full suite**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/io/writeArtifacts.ts src/crawl/runExtraction.ts tests/unit/writeArtifacts.test.ts
git commit -m "feat(io): write full artifact set (tailwind, tokens.json, ai-prompt) on every run"
```

---

### Task 10 — D3: Pure-Node zip utility + GUI bundle endpoint

**Files:**
- Create: `src/io/zip.ts`
- Create: `tests/unit/zip.test.ts`
- Modify: `src/gui/server.ts`

> **Before coding:** Search `src/gui/appHtml.ts` for the in-browser zip/crc32 implementation:
> ```bash
> grep -n "crc32\|zip\|deflate\|PK\x03\x04" src/gui/appHtml.ts | head -20
> ```
> Port the CRC-32 and local-file-header logic to Node, replacing `Uint8Array` operations with `Buffer`. No new npm dependencies — use only `node:zlib`, `node:fs/promises`, `node:path`.

- [ ] **Step 1: Write the failing zip round-trip test**

Create `tests/unit/zip.test.ts`:

```typescript
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it, afterEach } from 'vitest';
import { createZipBuffer, writeZip } from '../../src/io/zip.js';

let tmpDir: string;

afterEach(async () => {
  if (tmpDir) await rm(tmpDir, { recursive: true, force: true });
});

describe('createZipBuffer', () => {
  it('produces a ZIP buffer containing the given files', async () => {
    const buffer = await createZipBuffer([
      { name: 'hello.txt', content: Buffer.from('Hello, World!') },
      { name: 'dir/nested.txt', content: Buffer.from('Nested file') },
    ]);

    // ZIP magic bytes: PK\x03\x04 at offset 0
    expect(buffer[0]).toBe(0x50); // 'P'
    expect(buffer[1]).toBe(0x4b); // 'K'
    expect(buffer[2]).toBe(0x03);
    expect(buffer[3]).toBe(0x04);

    // End of central directory record: PK\x05\x06
    const eocd = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    expect(eocd).toBeGreaterThan(0);
  });
});

describe('writeZip', () => {
  it('zips a directory tree into an output file', async () => {
    tmpDir = join(tmpdir(), `zip-test-${process.pid}`);
    await mkdir(tmpDir, { recursive: true });
    await writeFile(join(tmpDir, 'a.txt'), 'file a');
    await writeFile(join(tmpDir, 'b.txt'), 'file b');
    await mkdir(join(tmpDir, 'sub'));
    await writeFile(join(tmpDir, 'sub', 'c.txt'), 'file c');

    const outPath = join(tmpDir, 'out.zip');
    await writeZip(tmpDir, outPath);

    const bytes = await readFile(outPath);
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes.length).toBeGreaterThan(100);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run tests/unit/zip.test.ts
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Create `src/io/zip.ts`**

Implement a minimal ZIP writer using Node.js `zlib` (deflate) and the ZIP specification. No third-party dependencies:

```typescript
import { createDeflateRaw } from 'node:zlib';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

function crc32(buf: Buffer): number {
  const table = crc32Table();
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ (table[(crc ^ buf[i]!) & 0xff] ?? 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

let _crc32Table: Uint32Array | undefined;
function crc32Table(): Uint32Array {
  if (_crc32Table) return _crc32Table;
  _crc32Table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    _crc32Table[i] = c;
  }
  return _crc32Table;
}

function deflate(input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const d = createDeflateRaw({ level: 6 });
    d.on('data', (c: Buffer) => chunks.push(c));
    d.on('end', () => resolve(Buffer.concat(chunks)));
    d.on('error', reject);
    d.end(input);
  });
}

function uint16LE(n: number): Buffer {
  const b = Buffer.allocUnsafe(2);
  b.writeUInt16LE(n, 0);
  return b;
}

function uint32LE(n: number): Buffer {
  const b = Buffer.allocUnsafe(4);
  b.writeUInt32LE(n >>> 0, 0);
  return b;
}

export type ZipEntry = { name: string; content: Buffer };

export async function createZipBuffer(entries: ZipEntry[]): Promise<Buffer> {
  const localHeaders: Buffer[] = [];
  const centralHeaders: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const crc = crc32(entry.content);
    const compressed = await deflate(entry.content);
    const useDeflate =
      compressed.length < entry.content.length ? 8 : 0;
    const compressedData =
      useDeflate === 8 ? compressed : entry.content;

    // Local file header
    const local = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x03, 0x04]),  // signature
      uint16LE(20),                             // version needed
      uint16LE(0),                              // flags
      uint16LE(useDeflate),                     // compression method
      uint16LE(0),                              // mod time
      uint16LE(0),                              // mod date
      uint32LE(crc),
      uint32LE(compressedData.length),          // compressed size
      uint32LE(entry.content.length),           // uncompressed size
      uint16LE(nameBuf.length),
      uint16LE(0),                              // extra field length
      nameBuf,
      compressedData,
    ]);

    // Central directory header
    centralHeaders.push(
      Buffer.concat([
        Buffer.from([0x50, 0x4b, 0x01, 0x02]),  // signature
        uint16LE(20),                             // version made by
        uint16LE(20),                             // version needed
        uint16LE(0),
        uint16LE(useDeflate),
        uint16LE(0),
        uint16LE(0),
        uint32LE(crc),
        uint32LE(compressedData.length),
        uint32LE(entry.content.length),
        uint16LE(nameBuf.length),
        uint16LE(0),
        uint16LE(0),
        uint16LE(0),
        uint16LE(0),
        uint32LE(0),
        uint32LE(offset),
        nameBuf,
      ]),
    );

    localHeaders.push(local);
    offset += local.length;
  }

  const central = Buffer.concat(centralHeaders);
  const eocd = Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x05, 0x06]),  // signature
    uint16LE(0),
    uint16LE(0),
    uint16LE(entries.length),
    uint16LE(entries.length),
    uint32LE(central.length),
    uint32LE(offset),
    uint16LE(0),
  ]);

  return Buffer.concat([...localHeaders, central, eocd]);
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await listFiles(full)));
    } else {
      results.push(full);
    }
  }
  return results;
}

export async function writeZip(srcDir: string, outPath: string): Promise<void> {
  const files = await listFiles(srcDir);
  const entries: ZipEntry[] = await Promise.all(
    files
      .filter((f) => f !== outPath)
      .map(async (f) => ({
        name: relative(srcDir, f).replace(/\\/g, '/'),
        content: await readFile(f),
      })),
  );
  const buf = await createZipBuffer(entries);
  await writeFile(outPath, buf);
}
```

- [ ] **Step 4: Run zip tests**

```bash
npx vitest run tests/unit/zip.test.ts
```

Expected: both tests pass.

- [ ] **Step 5: Add `GET /runs/:id/bundle.zip` to `src/gui/server.ts`**

First locate the runs static-serve handler in `server.ts` (search for `/runs/`), then add a route just before it:

```typescript
// Bundle ZIP download — must come before the generic /runs/ static handler
if (req.method === 'GET' && urlObj.pathname.match(/^\/runs\/[a-zA-Z0-9._-]+\/bundle\.zip$/)) {
  const runId = urlObj.pathname.split('/')[2];
  if (!runId) { respond(res, 400, 'Bad runId'); return; }
  const runDir = resolve(runsDir, runId);
  const zipPath = resolve(runDir, 'bundle.zip');
  try {
    await writeZip(runDir, zipPath);
    const zipData = await readFile(zipPath);
    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${runId}.zip"`,
      'Content-Length': String(zipData.length),
    });
    res.end(zipData);
  } catch {
    respond(res, 404, 'Run not found');
  }
  return;
}
```

Add the necessary imports at the top of `server.ts`:

```typescript
import { writeZip } from '../io/zip.js';
import { readFile } from 'node:fs/promises';
```

(Check if `readFile` is already imported — add only if missing.)

- [ ] **Step 6: Full suite**

```bash
npm run build && npm test
```

Expected: all pass.

- [ ] **Step 7: Manual smoke test — start GUI and trigger a bundle download**

```bash
npm run gui
```

Open `http://127.0.0.1:4317`, run an extraction, then navigate to `http://127.0.0.1:4317/runs/<runId>/bundle.zip`. Confirm the browser downloads a valid ZIP containing screenshots and all 6 artifact files.

- [ ] **Step 8: Commit**

```bash
git add src/io/zip.ts tests/unit/zip.test.ts src/gui/server.ts src/io/writeArtifacts.ts
git commit -m "feat(io): pure-Node zip utility and GUI bundle.zip download endpoint"
```

---

### Phase 2 Checkpoint

- [ ] **Full build + test + CLI extraction**

```bash
npm run build && npm test
node dist/cli.js extract https://monarque.framer.website/ --out out/verify-final
ls out/verify-final/
```

Expected files: `evidence.json`, `DESIGN.md`, `tokens.css`, `tailwind-theme.js`, `design-tokens.json`, `ai-prompt.txt`, `preview.html`, `screenshots/*.png`.

- [ ] **Regression: dark site still detects dark**

```bash
node dist/cli.js extract https://linear.app --out out/verify-dark
```

Check `out/verify-dark/DESIGN.md` — `surfaces[0]` should be a dark color.

- [ ] **Final commit**

```bash
git commit --allow-empty -m "chore: all 4 phases complete — canvas fix, value norm, exports, layout"
```

---

## Self-review Checklist

- [x] **Canvas**: `surfaces[0]` driven by `pageBackgroundCount → aboveFoldArea → backgroundCount → frequency` (Task 4)
- [x] **Backward-compat**: `rootBackground`/`area`/`aboveFold` optional; legacy tests fall through to old sort (Task 4)
- [x] **Value noise**: `roundPxValue` applied in `styleTokensFromComponents` (Task 3)
- [x] **Ambiguity**: `AMBIGUOUS_CANVAS` warning + confidence cap when top-2 page backgrounds are close (Task 5)
- [x] **Token collisions**: typography CSS vars deduplicated by appending index (Task 2)
- [x] **Color naming**: HSL-based names in `tokenNameFromColor` (Task 1)
- [x] **Type dedup**: `normalizeTypographyKey` rounds px so viewport-scaled duplicates collapse (Task 6)
- [x] **Component viewports**: `viewports[]` tracked and emitted (Task 6)
- [x] **Layout**: container widths + section gaps + density derived from data (Task 7)
- [x] **Exports**: 3 new generators created; all 6 artifacts written per run (Tasks 8–9)
- [x] **Bundle**: `GET /runs/:id/bundle.zip` streams a ZIP of the full run dir (Task 10)
- [x] **No new runtime deps**: zip is pure-Node using `node:zlib` (Task 10)
- [x] **Browser serializable**: `collectPageEvidence` changes use only DOM APIs (Tasks 4, 7)
