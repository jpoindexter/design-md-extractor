import { describe, expect, it } from 'vitest';
import { friendlyExtractionError } from '../../src/gui/server.js';

describe('friendlyExtractionError', () => {
  it('explains an unresolved domain and names the failing host', () => {
    const raw =
      'page.goto: net::ERR_NAME_NOT_RESOLVED at https://www.young.studio/\nCall log:\n  - navigating to "https://www.young.studio/"';
    const message = friendlyExtractionError(raw);
    expect(message).toContain('Could not resolve www.young.studio');
    expect(message).not.toContain('Call log');
    expect(message).not.toContain('page.goto');
  });

  it('explains a refused connection', () => {
    const message = friendlyExtractionError(
      'page.goto: net::ERR_CONNECTION_REFUSED at https://example.com/',
    );
    expect(message).toContain('Could not connect to example.com');
  });

  it('strips the verbose call log from unrecognized errors', () => {
    const message = friendlyExtractionError(
      'Something unexpected happened\nCall log:\n  - lots of noise',
    );
    expect(message).toBe('Something unexpected happened');
  });
});
