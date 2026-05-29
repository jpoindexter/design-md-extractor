import { describe, expect, it } from 'vitest';
import { detectClis } from '../../src/gui/detectClis.js';

describe('detectClis', () => {
  it('returns an array of well-formed {id, label} entries', async () => {
    const clis = await detectClis();
    expect(Array.isArray(clis)).toBe(true);
    const ids = new Set<string>();
    for (const cli of clis) {
      expect(typeof cli.id).toBe('string');
      expect(typeof cli.label).toBe('string');
      expect(cli.id).toMatch(/^[a-z0-9-]+$/);
      expect(ids.has(cli.id)).toBe(false); // no duplicates
      ids.add(cli.id);
    }
  });
});
