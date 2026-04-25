import { describe, expect, it } from 'vitest';
import { isTheme, parseTheme } from './themes';

describe('themes', () => {
  describe('isTheme', () => {
    const cases: [string, boolean][] = [
      ['warm', true],
      ['dark', true],
      ['y2k', true],
      ['terminal', true],
      ['Warm', false],
      ['neon', false],
      ['', false],
    ];
    it.each(cases)('isTheme(%j) -> %j', (input, expected) => {
      expect(isTheme(input)).toBe(expected);
    });
  });

  describe('parseTheme', () => {
    const cases: [string | null | undefined, string][] = [
      ['warm', 'warm'],
      ['dark', 'dark'],
      ['y2k', 'y2k'],
      ['terminal', 'terminal'],
      [null, 'warm'],
      [undefined, 'warm'],
      ['', 'warm'],
      ['neon', 'warm'],
      ['DARK', 'warm'],
    ];
    it.each(cases)('parseTheme(%j) -> %j', (input, expected) => {
      expect(parseTheme(input)).toBe(expected);
    });
  });
});
