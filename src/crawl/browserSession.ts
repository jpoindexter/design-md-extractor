import { chromium, type BrowserContext } from 'playwright';
import type { SessionConfig } from '../config/sessionConfig.js';
import { parseCookieFile } from './cookies.js';

// Yields a BrowserContext configured for the chosen session strategy:
//   persistent — real Chrome with an on-disk profile, headed, so a human can
//                clear a Cloudflare/Turnstile challenge once; the session persists.
//   cookies    — ephemeral Chromium with the user's exported cookies + UA injected.
//   none       — ephemeral Chromium, no session (default; CI/tests).
export async function withBrowserSession<T>(
  session: SessionConfig,
  callback: (context: BrowserContext) => Promise<T>,
): Promise<T> {
  if (session.mode === 'persistent') {
    let context: BrowserContext;
    try {
      context = await chromium.launchPersistentContext(session.profileDir, {
        channel: 'chrome',
        headless: false,
        viewport: null,
      });
    } catch {
      // Real Chrome not installed — fall back to bundled Chromium (still headed).
      context = await chromium.launchPersistentContext(session.profileDir, {
        headless: false,
        viewport: null,
      });
    }
    try {
      return await callback(context);
    } finally {
      await context.close();
    }
  }

  const browser = await chromium.launch();
  try {
    const context =
      session.mode === 'cookies' && session.userAgent
        ? await browser.newContext({ userAgent: session.userAgent })
        : await browser.newContext();
    if (session.mode === 'cookies') {
      const cookies = await parseCookieFile(session.cookiesPath);
      // Playwright requires a non-empty domain when no url is given.
      await context.addCookies(cookies.filter((cookie) => cookie.domain));
    }
    return await callback(context);
  } finally {
    await browser.close();
  }
}
