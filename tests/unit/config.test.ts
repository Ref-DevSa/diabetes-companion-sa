import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const config = readFileSync('supabase/config.toml', 'utf8');

/** The lines of one [section] of config.toml (up to the next section header). */
function section(name: string): string {
  const start = config.indexOf(`[${name}]`);
  expect(start, `[${name}] in config.toml`).toBeGreaterThanOrEqual(0);
  const rest = config.slice(start + name.length + 2);
  const next = rest.search(/^\[/m);
  return next === -1 ? rest : rest.slice(0, next);
}

const confirmBody =
  "Hi! Tap the button to confirm your email and finish signing up. The link works for 1 hour. If you didn't sign up, you can ignore this email.";
const resetBody =
  "Tap the button to choose a new password. The link works for 1 hour. If you didn't ask for this, you can ignore this email.";

describe('T-AUTH-4: Auth configuration (PRD Section 5 and 4.5)', () => {
  it('T-AUTH-4: email confirmation is required and links last 1 hour', () => {
    const email = section('auth.email');
    expect(email).toMatch(/^enable_confirmations = true$/m);
    expect(email).toMatch(/^otp_expiry = 3600$/m);
  });

  it('T-AUTH-4: passwords need at least 8 characters on the server; email and password only', () => {
    const auth = section('auth');
    expect(auth).toMatch(/^minimum_password_length = 8$/m);
    expect(auth).toMatch(/^enable_signup = true$/m);
    expect(auth).toMatch(/^enable_anonymous_sign_ins = false$/m);
    expect(section('auth.sms')).toMatch(/^enabled = false$/m);
    for (const provider of [...config.matchAll(/^\[auth\.external\.([a-z_]+)\]/gm)].map((m) => m[1] ?? '')) {
      expect(section(`auth.external.${provider}`), provider).toMatch(/^enabled = false$/m);
    }
  });

  it('T-AUTH-4: the confirmation email has the exact PRD 4.5 subject and body', () => {
    const template = section('auth.email.template.confirmation');
    expect(template).toContain('subject = "Confirm your email for Diabetes Companion SA"');
    expect(template).toContain('content_path = "./supabase/templates/confirm.html"');
    expect(readFileSync('supabase/templates/confirm.html', 'utf8')).toContain(confirmBody);
  });

  it('T-AUTH-4: the reset email has the exact PRD 4.5 subject and body', () => {
    const template = section('auth.email.template.recovery');
    expect(template).toContain('subject = "Reset your Diabetes Companion SA password"');
    expect(template).toContain('content_path = "./supabase/templates/recover.html"');
    expect(readFileSync('supabase/templates/recover.html', 'utf8')).toContain(resetBody);
  });

  it('T-AUTH-4: links in emails come back to the app', () => {
    const auth = section('auth');
    expect(auth).toMatch(/^site_url = "http:\/\/localhost:5173"$/m);
    expect(auth).toContain('http://localhost:5173/**');
  });
});
