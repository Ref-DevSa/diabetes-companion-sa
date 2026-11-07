import { describe, expect, it } from 'vitest';

function add(a: number, b: number) {
  return a + b;
}

describe('T-SETUP-4: Vitest runs', () => {
  it('T-SETUP-4: a trivial function returns the right answer', () => {
    expect(add(2, 3)).toBe(5);
  });
});
