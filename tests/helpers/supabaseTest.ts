// Helpers for integration tests against the LOCAL Supabase (Section 12.4).
// Each test makes its own throw-away accounts (it-...@example.co.za) and removes them afterwards.
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { clientOptions } from '../../src/lib/supabase';

export const url = process.env.VITE_SUPABASE_URL ?? '';
export const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
export const testPassword = process.env.TEST_USER_PASSWORD ?? '';

if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url)) {
  throw new Error('Integration tests run only against the local Supabase (VITE_SUPABASE_URL in .env).');
}

const noStorage = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };

/** A client like the app's (same options, see src/lib/supabase.ts): publishable key, no saved session. */
export function anonClient(options: { fetch?: typeof fetch } = {}): SupabaseClient {
  return createClient(url, publishableKey, {
    ...clientOptions,
    auth: noStorage,
    global: options.fetch ? { fetch: options.fetch } : {},
  });
}

/** Service-key client for setting up and checking data. Test helpers only, never the app. */
export const admin = createClient(url, serviceKey, { auth: noStorage });

const created = new Set<string>();

export function uniqueEmail(tag: string): string {
  return `it-${tag}-${randomUUID().slice(0, 8)}@example.co.za`.toLowerCase();
}

export const consent = { age_confirmed: 'true', privacy_agreed: 'true', privacy_notice_version: 'v0.4' };

/** Creates a confirmed account with the test password. */
export async function createUser(tag: string, options: { confirmed?: boolean } = {}) {
  const email = uniqueEmail(tag);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: testPassword,
    email_confirm: options.confirmed ?? true,
    user_metadata: consent,
  });
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
  created.add(email);
  return { id: data.user.id, email, password: testPassword };
}

/** Remembers an account made another way (for example by a real sign-up) so it is cleaned up. */
export function track(email: string) {
  created.add(email.toLowerCase());
}

export async function signedInClient(email: string, password = testPassword): Promise<SupabaseClient> {
  const client = anonClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in failed: ${error.message}`);
  return client;
}

export async function findAuthUser(email: string) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  return data.users.find((user) => user.email === email.toLowerCase()) ?? null;
}

/** Deletes every account this test file created, and their failed log-in rows. */
export async function removeCreatedUsers() {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  for (const user of data.users) {
    if (user.email && created.has(user.email)) await admin.auth.admin.deleteUser(user.id);
  }
  if (created.size > 0) await admin.from('login_attempts').delete().in('email', [...created]);
  created.clear();
}

// ---------------------------------------------------------------- local email catcher (Mailpit)
function mailpitUrl(): string {
  const config = readFileSync('supabase/config.toml', 'utf8');
  const section = config.slice(config.indexOf('[local_smtp]'));
  const port = /^port = (\d+)/m.exec(section)?.[1] ?? '54324';
  return `http://127.0.0.1:${port}`;
}

type MailSummary = { ID: string; Subject: string; Created: string };
export type Mail = { Subject: string; Text: string; HTML: string };

async function searchMail(to: string): Promise<MailSummary[]> {
  const response = await fetch(`${mailpitUrl()}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
  const body = (await response.json()) as { messages: MailSummary[] };
  return body.messages ?? [];
}

/** Waits until `count` emails have reached `to`, then returns the newest one. */
export async function waitForEmail(to: string, count = 1, timeoutMs = 10_000): Promise<Mail> {
  const started = Date.now();
  for (;;) {
    const messages = await searchMail(to);
    if (messages.length >= count) {
      const newest = [...messages].sort((a, b) => b.Created.localeCompare(a.Created))[0] as MailSummary;
      const response = await fetch(`${mailpitUrl()}/api/v1/message/${newest.ID}`);
      return (await response.json()) as Mail;
    }
    if (Date.now() - started > timeoutMs) throw new Error(`no email number ${count} for ${to}`);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

export async function countEmails(to: string): Promise<number> {
  return (await searchMail(to)).length;
}

/** The link behind the button in an email. */
export function linkIn(mail: Mail): string {
  const href = /href="([^"]+)"/.exec(mail.HTML)?.[1];
  if (!href) throw new Error('no link in the email');
  return href.replace(/&amp;/g, '&');
}

/** Opens an email link like a browser would, and returns where Supabase sends the person. */
export async function followLink(link: string): Promise<URL> {
  const response = await fetch(link, { redirect: 'manual' });
  const location = response.headers.get('location');
  if (!location) throw new Error(`the link did not redirect (status ${response.status})`);
  return new URL(location);
}

/** A fetch that behaves like a phone with no internet. */
export const offlineFetch: typeof fetch = () => Promise.reject(new TypeError('Failed to fetch'));

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
