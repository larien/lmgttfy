import { describe, expect, it } from 'vitest';
import {
  EXAMPLE_CHIPS,
  pickRandom,
  REVEAL_LINES,
  sameLangError,
  SKIP_LINES,
  TAGLINE_TAUNTS,
} from './snarkLines';

describe('snarkLines static data', () => {
  it('has non-empty REVEAL_LINES', () => {
    expect(REVEAL_LINES.length).toBeGreaterThan(0);
  });
  it('has non-empty TAGLINE_TAUNTS', () => {
    expect(TAGLINE_TAUNTS.length).toBeGreaterThan(0);
  });
  it('has non-empty SKIP_LINES', () => {
    expect(SKIP_LINES.length).toBeGreaterThan(0);
  });
  it('ships exactly three example chips per spec', () => {
    expect(EXAMPLE_CHIPS).toHaveLength(3);
  });
});

describe('sameLangError', () => {
  it('formats both slots with the same label', () => {
    expect(sameLangError('English')).toBe(
      "English to English. You don't need a translator, you need a mirror.",
    );
  });
});

describe('pickRandom', () => {
  it('returns the deterministic pick when rng is provided', () => {
    const arr = ['a', 'b', 'c'];
    expect(pickRandom(arr, { rng: () => 0 })).toBe('a');
    expect(pickRandom(arr, { rng: () => 0.99 })).toBe('c');
    expect(pickRandom(arr, { rng: () => 0.5 })).toBe('b');
  });

  it('never returns the excluded value when alternatives exist', () => {
    const arr = ['a', 'b', 'c'];
    for (const r of [0, 0.33, 0.5, 0.66, 0.99]) {
      expect(pickRandom(arr, { exclude: 'b', rng: () => r })).not.toBe('b');
    }
  });

  it('returns the only option even when it equals exclude', () => {
    expect(pickRandom(['only'], { exclude: 'only', rng: () => 0 })).toBe('only');
  });

  it('throws on empty input', () => {
    expect(() => pickRandom([], { rng: () => 0 })).toThrow();
  });
});
