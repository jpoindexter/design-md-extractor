import { readFile } from 'node:fs/promises';
import { z } from 'zod';

const ParsedCookieSchema = z.object({
  name: z.string(),
  value: z.string(),
  domain: z.string(),
  path: z.string(),
  expires: z.number().optional(),
  httpOnly: z.boolean().optional(),
  secure: z.boolean().optional(),
  sameSite: z.enum(['Strict', 'Lax', 'None']).optional(),
});

export type ParsedCookie = z.infer<typeof ParsedCookieSchema>;

const JsonCookieSchema = z.object({
  name: z.string(),
  value: z.string(),
  domain: z.string().optional(),
  path: z.string().optional(),
  expires: z.number().optional(),
  expirationDate: z.number().optional(), // some exporters (EditThisCookie) use this
  httpOnly: z.boolean().optional(),
  secure: z.boolean().optional(),
  sameSite: z.string().optional(),
});

function normalizeSameSite(
  value: string | undefined,
): 'Strict' | 'Lax' | 'None' | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase();
  if (v === 'strict') return 'Strict';
  if (v === 'lax') return 'Lax';
  if (v === 'none' || v === 'no_restriction') return 'None';
  return undefined;
}

function fromJson(raw: unknown): ParsedCookie[] {
  // Accept either a bare array or { cookies: [...] }
  const arr = Array.isArray(raw)
    ? raw
    : raw &&
        typeof raw === 'object' &&
        Array.isArray((raw as { cookies?: unknown }).cookies)
      ? (raw as { cookies: unknown[] }).cookies
      : null;
  if (!arr)
    throw new Error('Cookie JSON must be an array or { cookies: [...] }.');

  return arr.map((entry) => {
    const c = JsonCookieSchema.parse(entry);
    const expires = c.expires ?? c.expirationDate;
    return {
      name: c.name,
      value: c.value,
      domain: c.domain ?? '',
      path: c.path ?? '/',
      ...(expires !== undefined ? { expires } : {}),
      ...(c.httpOnly !== undefined ? { httpOnly: c.httpOnly } : {}),
      ...(c.secure !== undefined ? { secure: c.secure } : {}),
      ...(normalizeSameSite(c.sameSite)
        ? { sameSite: normalizeSameSite(c.sameSite) }
        : {}),
    } satisfies ParsedCookie;
  });
}

function fromNetscape(text: string): ParsedCookie[] {
  const cookies: ParsedCookie[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith('#')) continue;
    // domain  includeSubdomains  path  secure  expires  name  value
    const parts = line.split('\t');
    if (parts.length < 7) continue;
    const [domain, , path, secure, expires, name, value] = parts;
    cookies.push(
      ParsedCookieSchema.parse({
        name: name ?? '',
        value: value ?? '',
        domain: domain ?? '',
        path: path || '/',
        ...(expires && Number(expires) > 0 ? { expires: Number(expires) } : {}),
        secure: (secure ?? '').toUpperCase() === 'TRUE',
      }),
    );
  }
  return cookies;
}

export async function parseCookieFile(path: string): Promise<ParsedCookie[]> {
  const text = await readFile(path, 'utf8');
  const trimmed = text.trimStart();
  const cookies =
    trimmed.startsWith('[') || trimmed.startsWith('{')
      ? fromJson(JSON.parse(text))
      : fromNetscape(text);

  if (cookies.length === 0) {
    throw new Error(
      `No cookies parsed from ${path}. Expected a Playwright/EditThisCookie JSON array or a Netscape cookies.txt.`,
    );
  }
  return cookies;
}
