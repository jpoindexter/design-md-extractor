# Evidence Schema

## Purpose

`evidence.json` is the factual source of truth for a run. It stores what the browser observed and what the normalizer inferred, with confidence attached to major claims.

## Top-Level Shape

```json
{
  "version": "0.1.0",
  "source": {
    "primaryUrl": "https://example.com",
    "pages": [],
    "capturedAt": "2026-05-28T10:00:00.000Z"
  },
  "viewports": [],
  "screenshots": [],
  "tokens": {
    "colors": [],
    "typography": [],
    "spacing": [],
    "radii": [],
    "shadows": []
  },
  "surfaces": [],
  "components": [],
  "layout": {},
  "imagery": {},
  "responsive": {},
  "warnings": []
}
```

## Source

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `primaryUrl` | string | yes | Initial URL requested by the user. |
| `pages` | array | yes | Pages inspected during the run. |
| `capturedAt` | ISO string | yes | Capture timestamp. |

## Viewport

```json
{
  "name": "desktop",
  "width": 1440,
  "height": 1000
}
```

## Color Token

```json
{
  "name": "Action Orange",
  "value": "#ff5900",
  "cssVariable": "--color-action-orange",
  "role": "Primary CTA and active state accent",
  "properties": ["background-color"],
  "frequency": 14,
  "sampleSelectors": ["header a.cta", "main button.primary"],
  "confidence": "high"
}
```

## Typography Token

```json
{
  "role": "display",
  "fontFamily": "Inter",
  "fallback": "system-ui",
  "fontSize": "48px",
  "fontWeight": "600",
  "lineHeight": "1.1",
  "letterSpacing": "-0.04em",
  "sampleSelectors": ["h1", ".hero-title"],
  "confidence": "high"
}
```

## Component Sample

```json
{
  "name": "Primary Button",
  "kind": "button",
  "role": "Primary call to action",
  "textSample": "Get started",
  "viewport": "desktop",
  "selector": "header a[href='/signup']",
  "count": 6,
  "styles": {
    "color": "#ffffff",
    "backgroundColor": "#000000",
    "fontFamily": "Inter",
    "fontSize": "14px",
    "fontWeight": "500",
    "borderRadius": "9999px",
    "padding": "10px 16px",
    "boxShadow": "none",
    "border": "0px none rgba(0, 0, 0, 0)"
  },
  "bounds": {
    "width": 128,
    "height": 40
  },
  "confidence": "high"
}
```

## Surface

```json
{
  "level": 0,
  "name": "Canvas",
  "value": "#ffffff",
  "purpose": "Page background",
  "sampleSelectors": ["body", "main"],
  "confidence": "high"
}
```

## Warning

```json
{
  "code": "limited-pages",
  "message": "Only the homepage was inspected, so site-wide component coverage is limited.",
  "severity": "info"
}
```

## Confidence Values

Valid values:

- `high`
- `medium`
- `low`

## Schema Rules

- All color values should be hex when conversion is possible.
- Raw CSS strings may be preserved when conversion is unsafe.
- Samples must avoid long text extraction. Keep snippets short.
- Every token with an inferred role must include `confidence`.
