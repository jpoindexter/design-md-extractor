import { describe, expect, it } from 'vitest';
import { rankStylePageCandidates } from '../../src/crawl/discoverPages.js';

describe('rankStylePageCandidates', () => {
  it('keeps same-origin style-rich pages and orders them by coverage value', () => {
    const pages = rankStylePageCandidates(
      'https://example.com/',
      [
        'https://example.com/pricing',
        'https://example.com/about',
        'https://example.com/login',
        'https://example.com/docs/components',
        'https://example.com/blog/post',
        'https://external.com/pricing',
        '/features',
        '#section',
        'mailto:hello@example.com',
      ],
      4,
    );

    expect(pages).toEqual([
      'https://example.com/docs/components',
      'https://example.com/pricing',
      'https://example.com/features',
      'https://example.com/about',
    ]);
  });

  it('does not discover extra pages for local file URLs', () => {
    const pages = rankStylePageCandidates('file:///tmp/sample-site.html', ['/pricing', 'file:///tmp/about.html'], 4);

    expect(pages).toEqual([]);
  });
});
