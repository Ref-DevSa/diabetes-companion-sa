// Creates the three test accounts and their sample data (IMPLEMENTATION_PLAN.md Section 8.7, PRD 8.4).
// LOCAL ONLY: refuses to run unless VITE_SUPABASE_URL points at localhost or 127.0.0.1.
// Uses the LOCAL secret key (SUPABASE_SERVICE_ROLE_KEY in .env) and TEST_USER_PASSWORD. Prints no secrets.
import { existsSync, readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

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

function hostOf(address) {
  try {
    return new URL(address).hostname;
  } catch {
    return '';
  }
}

function fail(message) {
  console.error(`seed-users: ${message}`);
  process.exit(1);
}

const env = readEnv();
const url = env.VITE_SUPABASE_URL ?? '';
const host = hostOf(url);
if (host !== 'localhost' && host !== '127.0.0.1') {
  fail('refusing to run. VITE_SUPABASE_URL must point at the local Supabase (localhost or 127.0.0.1).');
}
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const password = env.TEST_USER_PASSWORD ?? '';
if (!serviceKey || serviceKey.startsWith('paste-')) fail('set SUPABASE_SERVICE_ROLE_KEY in .env (the local secret key from `npx supabase status`).');
if (!password || password.startsWith('paste-')) fail('set TEST_USER_PASSWORD in .env (the test-only password from the PRD, 10.4).');

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

// PRD 8.4 test accounts. Consent metadata is required by the sign-up trigger (BR18).
const accounts = [
  { email: 'thabo.test@example.co.za', language: 'tn' },
  { email: 'nomsa.test@example.co.za', language: 'zu' },
  { email: 'sipho.test@example.co.za', language: 'en' },
];
const consent = { age_confirmed: 'true', privacy_agreed: 'true', privacy_notice_version: 'v0.4' };

// Today's date in SAST (UTC+2, no daylight saving) as YYYY-MM-DD, shifted by `daysAgo`.
function sastDate(daysAgo) {
  const sastNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
  sastNow.setUTCDate(sastNow.getUTCDate() - daysAgo);
  return sastNow.toISOString().slice(0, 10);
}

// A PRD sample time on a day relative to today. If it is still later today, use one minute ago
// instead, so the "not in the future" rule (BR2) is never broken.
function sastTime(daysAgo, hhmm) {
  const time = new Date(`${sastDate(daysAgo)}T${hhmm}:00+02:00`);
  const latest = new Date(Date.now() - 60 * 1000);
  return (time > latest ? latest : time).toISOString();
}

async function check(promise, what) {
  const { data, error } = await promise;
  if (error) fail(`${what} failed: ${error.message}`);
  return data;
}

// 1. Remove earlier copies of the test accounts (cascades remove their data).
const existing = await check(admin.auth.admin.listUsers({ perPage: 1000 }), 'listing users');
for (const user of existing.users) {
  if (accounts.some((a) => a.email === user.email)) {
    await check(admin.auth.admin.deleteUser(user.id), `removing old ${user.email}`);
  }
}

// 2. Create the accounts, confirmed, and set their language.
const ids = {};
for (const account of accounts) {
  const created = await check(
    admin.auth.admin.createUser({ email: account.email, password, email_confirm: true, user_metadata: consent }),
    `creating ${account.email}`,
  );
  ids[account.email] = created.user.id;
  await check(admin.from('users').update({ language: account.language }).eq('id', created.user.id), `setting language for ${account.email}`);
}

// 3. Thabo's five Readings (PRD 8.4), dated 0, 1, 1, 1 and 2 days ago at the PRD times.
const thabo = ids['thabo.test@example.co.za'];
await check(
  admin.from('readings').insert([
    { user_id: thabo, value: 6.8, reading_when: 'fasting', taken_at: sastTime(0, '07:10'), note: null },
    { user_id: thabo, value: 3.6, reading_when: 'bedtime', taken_at: sastTime(1, '21:30'), note: 'Skipped supper' },
    { user_id: thabo, value: 9.4, reading_when: 'after_meal', taken_at: sastTime(1, '19:45'), note: null },
    { user_id: thabo, value: 14.6, reading_when: 'fasting', taken_at: sastTime(1, '07:20'), note: 'Felt very thirsty' },
    { user_id: thabo, value: 7.2, reading_when: 'before_meal', taken_at: sastTime(2, '12:40'), note: null },
  ]),
  "adding Thabo's Readings",
);

// 4. Thabo's Checklist today: Custom Item "Evening walk"; medication and water ticked.
await check(admin.from('checklist_items').insert({ user_id: thabo, name: 'Evening walk' }), "adding Thabo's Custom Item");
const standard = await check(
  admin.from('checklist_items').select('id, standard_key').in('standard_key', ['medication', 'water']),
  'reading the Standard Items',
);
await check(
  admin.from('checklist_ticks').insert(standard.map((item) => ({ user_id: thabo, item_id: item.id }))),
  "adding Thabo's ticks",
);

console.log('seed-users: created thabo.test (Setswana, 5 Readings, Checklist), nomsa.test (isiZulu), sipho.test (English).');
