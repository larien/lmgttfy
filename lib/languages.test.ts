import { describe, expect, it } from 'vitest';
import { isLangCode, isSrcLangCode, langName } from './languages';

describe('languages', () => {
  describe('isLangCode', () => {
    const cases: [string, boolean][] = [
      ['en', true],
      ['pt', true],
      ['ar', true],
      ['auto', false],
      ['xx', false],
      ['', false],
      ['EN', false],
    ];
    it.each(cases)('isLangCode(%j) -> %j', (input, expected) => {
      expect(isLangCode(input)).toBe(expected);
    });
  });

  describe('isSrcLangCode', () => {
    const cases: [string, boolean][] = [
      ['en', true],
      ['auto', true],
      ['xx', false],
      ['', false],
    ];
    it.each(cases)('isSrcLangCode(%j) -> %j', (input, expected) => {
      expect(isSrcLangCode(input)).toBe(expected);
    });
  });

  describe('langName', () => {
    const cases: [Parameters<typeof langName>[0], string][] = [
      ['en', 'English'],
      ['pt', 'Portuguese'],
      ['auto', 'Detect language'],
    ];
    it.each(cases)('langName(%j) -> %j', (input, expected) => {
      expect(langName(input)).toBe(expected);
    });
  });
});
