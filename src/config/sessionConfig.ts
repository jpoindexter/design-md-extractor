import { z } from 'zod';

export const SessionConfigSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('none') }),
  z.object({
    mode: z.literal('cookies'),
    cookiesPath: z.string().min(1),
    userAgent: z.string().optional(),
  }),
  z.object({
    mode: z.literal('persistent'),
    profileDir: z.string().min(1),
    headed: z.literal(true),
  }),
]);

export type SessionConfig = z.infer<typeof SessionConfigSchema>;

export const NO_SESSION: SessionConfig = { mode: 'none' };

export type RawSessionOptions = {
  profile?: string;
  cookies?: string;
  userAgent?: string;
};

/**
 * Resolve CLI/GUI session options into a validated SessionConfig.
 * Precedence: --profile (persistent, always headed) beats --cookies beats none.
 * Returns a SessionConfig plus any non-fatal warnings (e.g. cookies without UA).
 */
export function resolveSessionConfig(options: RawSessionOptions): {
  session: SessionConfig;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (options.profile && options.profile.trim()) {
    return {
      session: SessionConfigSchema.parse({
        mode: 'persistent',
        profileDir: options.profile.trim(),
        headed: true,
      }),
      warnings,
    };
  }

  if (options.cookies && options.cookies.trim()) {
    if (!options.userAgent || !options.userAgent.trim()) {
      warnings.push(
        "Cookies provided without --user-agent. Cloudflare binds cf_clearance to the User-Agent that solved the challenge; without a matching UA the cookies may be rejected. Copy your browser's navigator.userAgent.",
      );
    }
    return {
      session: SessionConfigSchema.parse({
        mode: 'cookies',
        cookiesPath: options.cookies.trim(),
        userAgent: options.userAgent?.trim() || undefined,
      }),
      warnings,
    };
  }

  return { session: NO_SESSION, warnings };
}
