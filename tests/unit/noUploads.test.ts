import { describe, expect, it } from 'vitest';
import { appSources } from '../helpers/sourceFiles';

describe('T-NFR-9: no file uploads (PRD 12.1, 12.4)', () => {
  it('T-NFR-9: no file input, FormData, file reader or storage upload in the app', () => {
    const pattern = /type=["']file["']|new FormData|FileReader|\.storage\b|\.upload\(|showOpenFilePicker|capture=/;
    expect(appSources().filter(({ text }) => pattern.test(text)).map(({ path }) => path)).toEqual([]);
  });
});
