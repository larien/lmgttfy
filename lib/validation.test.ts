import { describe, expect, it } from 'vitest';
import { validateLangs, validateText, MAX_TEXT_LEN, type ValidationError } from './validation';

describe('validateText', () => {
  const cases: [string, ValidationError | null][] = [
    ['hello', null],
    ['  hello  ', null],
    ['', 'empty_text'],
    ['   ', 'empty_text'],
    ['\n\t', 'empty_text'],
    ['x'.repeat(MAX_TEXT_LEN), null],
    ['x'.repeat(MAX_TEXT_LEN + 1), 'text_too_long'],
  ];
  it.each(cases)('validateText(%j) -> %j', (input, expected) => {
    expect(validateText(input)).toBe(expected);
  });
});

describe('validateLangs', () => {
  const cases: [string, string, ValidationError | null][] = [
    ['en', 'pt', null],
    ['auto', 'en', null],
    ['en', 'en', 'same_lang'],
    ['xx', 'pt', 'invalid_src'],
    ['en', 'xx', 'invalid_tgt'],
    ['en', 'auto', 'invalid_tgt'],
    ['auto', 'auto', 'invalid_tgt'],
  ];
  it.each(cases)('validateLangs(%j, %j) -> %j', (src, tgt, expected) => {
    expect(validateLangs(src, tgt)).toBe(expected);
  });
});
