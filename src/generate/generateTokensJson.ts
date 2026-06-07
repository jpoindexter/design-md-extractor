import type { Evidence } from '../types/evidence.js';

type TokenEntry = { $value: string; $type: string; $description?: string };
interface TokenGroup {
  [key: string]: TokenEntry | TokenGroup;
}

export function generateTokensJson(evidence: Evidence): string {
  const tokens: TokenGroup = {
    color: Object.fromEntries(
      evidence.tokens.colors.map((c) => [
        c.name.toLowerCase().replace(/\s+/g, '-'),
        {
          $value: c.value,
          $type: 'color',
          $description: c.role,
        } satisfies TokenEntry,
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
        { $value: s.value, $type: 'dimension' } satisfies TokenEntry,
      ]),
    ),
    'border-radius': Object.fromEntries(
      evidence.tokens.radii.map((r, i) => [
        `radius-${i + 1}`,
        { $value: r.value, $type: 'dimension' } satisfies TokenEntry,
      ]),
    ),
  };

  return `${JSON.stringify(tokens, null, 2)}\n`;
}
