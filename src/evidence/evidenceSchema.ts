import { z } from 'zod';

export const ConfidenceSchema = z.enum(['high', 'medium', 'low']);

export const EvidenceSchema = z.object({
  version: z.string(),
  source: z.object({
    primaryUrl: z.string().url(),
    pages: z.array(
      z.object({
        url: z.string().url(),
        status: z.enum(['success', 'failed']),
        error: z.string().optional(),
      }),
    ),
    capturedAt: z.string(),
  }),
  viewports: z.array(
    z.object({
      name: z.string(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    }),
  ),
  screenshots: z.array(
    z.object({
      viewport: z.string(),
      url: z.string().url(),
      path: z.string(),
    }),
  ),
  tokens: z.object({
    colors: z.array(
      z.object({
        name: z.string(),
        value: z.string(),
        cssVariable: z.string().optional(),
        role: z.string(),
        properties: z.array(z.string()),
        frequency: z.number().int().nonnegative(),
        sampleSelectors: z.array(z.string()),
        confidence: ConfidenceSchema,
      }),
    ),
    typography: z.array(
      z.object({
        role: z.string(),
        fontFamily: z.string(),
        fallback: z.string().optional(),
        fontSize: z.string(),
        fontWeight: z.string(),
        lineHeight: z.string(),
        letterSpacing: z.string(),
        sampleSelectors: z.array(z.string()),
        confidence: ConfidenceSchema,
      }),
    ),
    spacing: z.array(
      z.object({
        name: z.string(),
        value: z.string(),
        confidence: ConfidenceSchema,
      }),
    ),
    radii: z.array(
      z.object({
        name: z.string(),
        value: z.string(),
        confidence: ConfidenceSchema,
      }),
    ),
    shadows: z.array(
      z.object({
        name: z.string(),
        value: z.string(),
        confidence: ConfidenceSchema,
      }),
    ),
    gradients: z
      .array(
        z.object({
          name: z.string(),
          value: z.string(),
          confidence: ConfidenceSchema,
        }),
      )
      .optional(),
  }),
  surfaces: z.array(
    z.object({
      level: z.number().int().nonnegative(),
      name: z.string(),
      value: z.string(),
      purpose: z.string(),
      sampleSelectors: z.array(z.string()),
      confidence: ConfidenceSchema,
    }),
  ),
  components: z.array(
    z.object({
      name: z.string(),
      kind: z.string(),
      role: z.string(),
      textSample: z.string().optional(),
      viewport: z.string(),
      viewports: z.array(z.string()).optional(),
      selector: z.string(),
      count: z.number().int().positive(),
      styles: z.record(z.string(), z.string()),
      bounds: z.object({
        width: z.number().nonnegative(),
        height: z.number().nonnegative(),
      }),
      confidence: ConfidenceSchema,
    }),
  ),
  fontFaces: z
    .array(
      z.object({
        family: z.string(),
        weight: z.string(),
        style: z.string(),
        src: z.string(),
      }),
    )
    .optional(),
  layout: z.object({
    density: z.string(),
    containerWidths: z.array(z.number()).optional(),
    sectionGaps: z.array(z.string()).optional(),
  }),
  imagery: z.object({
    strategy: z.string(),
    notes: z.array(z.string()).optional(),
  }),
  responsive: z.object({
    notes: z.array(z.string()),
  }),
  warnings: z.array(
    z.object({
      code: z.string(),
      message: z.string(),
      severity: z.enum(['info', 'warning', 'error']),
    }),
  ),
});
