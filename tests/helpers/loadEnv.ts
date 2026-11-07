// Loads the local .env file into process.env for integration tests (no extra library needed).
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (match && match[1] && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2];
    }
  }
}
