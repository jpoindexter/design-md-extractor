import type { Confidence } from '../types/evidence.js';

export function confidenceFromFrequency(frequency: number): Confidence {
  if (frequency >= 5) return 'high';
  if (frequency >= 2) return 'medium';
  return 'low';
}
