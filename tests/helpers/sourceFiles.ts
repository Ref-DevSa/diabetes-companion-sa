// Reads the project's own files for the static checks (no network, no build needed).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

export function filesUnder(dir: string, extensions: string[]): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...filesUnder(path, extensions));
    else if (extensions.includes(extname(name).toLowerCase())) out.push(path);
  }
  return out;
}

/** Files with their text. */
export function withText(paths: string[]): Array<{ path: string; text: string }> {
  return paths.map((path) => ({ path, text: readFileSync(path, 'utf8') }));
}

/** Every app source file (src/) with its text. */
export function appSources(): Array<{ path: string; text: string }> {
  return withText(filesUnder('src', ['.ts', '.tsx']));
}
