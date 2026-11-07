// Creates the three test accounts and their sample data (IMPLEMENTATION_PLAN.md Section 8.7).
// LOCAL ONLY: refuses to run unless VITE_SUPABASE_URL points at localhost or 127.0.0.1.
//
// Phase 1: only the safety check exists, because the tables arrive in Phase 2.
// Phase 2 adds the accounts (thabo, nomsa, sipho) and Thabo's Readings and ticks.
import { existsSync, readFileSync } from 'node:fs';

function readEnv() {
  const env = { ...process.env };
  if (existsSync('.env')) {
    for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (match && env[match[1]] === undefined) env[match[1]] = match[2];
    }
  }
  return env;
}

const env = readEnv();
const url = env.VITE_SUPABASE_URL ?? '';
function hostOf(address) {
  try {
    return new URL(address).hostname;
  } catch {
    return '';
  }
}
const host = hostOf(url);

if (host !== 'localhost' && host !== '127.0.0.1') {
  console.error('seed-users: refusing to run. VITE_SUPABASE_URL must point at the local Supabase (localhost or 127.0.0.1).');
  process.exit(1);
}

console.log('seed-users: local Supabase confirmed. No test accounts to create yet (they are added in Phase 2).');
