export function roundPxValue(value: string): string {
  return value.replace(
    /(\d+(?:\.\d+)?)px/g,
    (_, n) => `${Math.round(parseFloat(n))}px`,
  );
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
