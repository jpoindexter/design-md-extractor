import { NO_SESSION, type SessionConfig } from '../config/sessionConfig.js';
import { withBrowserSession } from './browserSession.js';

const INCLUDE_SCORES: Array<[RegExp, number]> = [
  [/\/docs?(\/|$)|components?|guides?|reference|develop(er|ers)?/i, 100],
  [/pricing|plans|compare/i, 96],
  [/features?|product|platform|solutions?/i, 90],
  [
    /blocks?|templates?|showcase|examples?|gallery|customers?|case-studies?/i,
    84,
  ],
  [/about|company|team/i, 70],
  [/blog|resources?|learn|articles?/i, 58],
];

const EXCLUDE_PATTERNS = [
  /\/(login|signin|sign-in|signup|sign-up|account|dashboard|admin|auth)(\/|$)/i,
  /\/(privacy|terms|security|legal|cookies?)(\/|$)/i,
  /\.(pdf|zip|png|jpg|jpeg|webp|gif|svg|mp4|mov|mp3)$/i,
];

function candidateScore(url: URL): number {
  const target = `${url.pathname}${url.search}`;
  if (target === '/' || target === '') return 0;
  if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(target))) return -1;

  for (const [pattern, score] of INCLUDE_SCORES) {
    if (pattern.test(target)) return score;
  }

  const depth = url.pathname.split('/').filter(Boolean).length;
  return depth === 1 ? 30 : 16;
}

export function rankStylePageCandidates(
  primaryUrl: string,
  hrefs: string[],
  limit: number,
): string[] {
  const base = new URL(primaryUrl);
  if (base.protocol === 'file:') {
    return [];
  }

  const primary = new URL(primaryUrl);
  primary.hash = '';
  primary.search = '';

  const seen = new Map<string, { url: string; score: number; depth: number }>();

  for (const href of hrefs) {
    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')
    )
      continue;

    let parsed: URL;
    try {
      parsed = new URL(href, base);
    } catch {
      continue;
    }

    if (parsed.origin !== base.origin) continue;
    parsed.hash = '';
    parsed.search = '';
    if (parsed.href === primary.href) continue;

    const score = candidateScore(parsed);
    if (score < 0) continue;

    const depth = parsed.pathname.split('/').filter(Boolean).length;
    const existing = seen.get(parsed.href);
    if (!existing || score > existing.score) {
      seen.set(parsed.href, { url: parsed.href, score, depth });
    }
  }

  return Array.from(seen.values())
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.depth !== b.depth) return a.depth - b.depth;
      return a.url.localeCompare(b.url);
    })
    .slice(0, limit)
    .map((candidate) => candidate.url);
}

export async function discoverStylePages(input: {
  url: string;
  limit: number;
  timeoutMs: number;
  session?: SessionConfig;
}): Promise<string[]> {
  return withBrowserSession(input.session ?? NO_SESSION, async (context) => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(input.url, {
      waitUntil: 'domcontentloaded',
      timeout: input.timeoutMs,
    });
    const hrefs = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'))
        .map((anchor) => anchor.href)
        .filter(Boolean),
    );
    await page.close();
    return rankStylePageCandidates(input.url, hrefs, input.limit);
  });
}
