// Secret scan (IMPLEMENTATION_PLAN.md Sections 2 and 9.2).
// Usage:
//   node scripts/scan-secrets.mjs            scan every file Git tracks or would track (ignored files skipped)
//   node scripts/scan-secrets.mjs <file>...  scan only the given files
// Exits with 1 and prints where a possible secret was found, otherwise exits with 0.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';

const rules = [
  { name: 'Supabase secret key', pattern: /sb_secret_[A-Za-z0-9_-]{20,}/ },
  { name: 'JWT (for example a service role key)', pattern: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { name: 'Brevo SMTP or API key', pattern: /x(?:smtpsib|keysib)-[a-f0-9]{64}-[A-Za-z0-9]{16}/ },
  { name: 'Private key', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'AWS access key', pattern: /AKIA[0-9A-Z]{16}/ },
  { name: 'Service role key value', pattern: /SUPABASE_SERVICE_ROLE_KEY\s*[=:]\s*["']?(?!paste-)[A-Za-z0-9_.-]{20,}/ },
];

// The test-only password lives in .env (never committed). Any committed file containing it fails.
function readTestPassword() {
  const envPath = resolve('.env');
  if (!existsSync(envPath)) return null;
  const match = /^TEST_USER_PASSWORD=(.+)$/m.exec(readFileSync(envPath, 'utf8'));
  const value = match?.[1]?.trim();
  return value && value.length >= 6 && !value.startsWith('paste-') ? value : null;
}

const binaryExtensions = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.woff', '.woff2', '.ttf', '.otf', '.zip',
]);

function listRepositoryFiles() {
  const output = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
    encoding: 'utf8',
  });
  return output.split('\0').filter(Boolean);
}

const files = process.argv.length > 2 ? process.argv.slice(2) : listRepositoryFiles();
const testPassword = readTestPassword();
const findings = [];

for (const file of files) {
  if (binaryExtensions.has(extname(file).toLowerCase())) continue;
  if (!existsSync(file) || !statSync(file).isFile()) continue;
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const rule of rules) {
      if (rule.pattern.test(line)) findings.push(`${file}:${index + 1} (${rule.name})`);
    }
    if (testPassword && line.includes(testPassword)) {
      findings.push(`${file}:${index + 1} (test-only password)`);
    }
  });
}

if (findings.length > 0) {
  for (const finding of findings) console.error(`Possible secret in ${finding}`);
  console.error(`Secret scan failed: ${findings.length} finding(s). Remove the value and use .env instead.`);
  process.exit(1);
}
console.log(`Secret scan passed: ${files.length} file(s) checked, no secrets found.`);
