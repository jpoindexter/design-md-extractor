import type { z } from 'zod';
import type { EvidenceSchema } from '../evidence/evidenceSchema.js';

export type Evidence = z.infer<typeof EvidenceSchema>;
export type Confidence = 'high' | 'medium' | 'low';
export type ViewportName = 'desktop' | 'tablet' | 'mobile' | string;
