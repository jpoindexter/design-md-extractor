import { resolve } from 'node:path';

export function resolveOutputPath(outDir: string): string {
  return resolve(outDir);
}
