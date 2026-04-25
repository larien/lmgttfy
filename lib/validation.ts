import { isLangCode, isSrcLangCode } from './languages';

export const MAX_TEXT_LEN = 200;

export type ValidationError =
  | 'invalid_src'
  | 'invalid_tgt'
  | 'empty_text'
  | 'text_too_long'
  | 'same_lang';

export function validateText(text: string): ValidationError | null {
  const trimmed = text.trim();
  if (!trimmed) return 'empty_text';
  if (trimmed.length > MAX_TEXT_LEN) return 'text_too_long';
  return null;
}

export function validateLangs(src: string, tgt: string): ValidationError | null {
  if (!isSrcLangCode(src)) return 'invalid_src';
  if (!isLangCode(tgt)) return 'invalid_tgt';
  if (src !== 'auto' && src === tgt) return 'same_lang';
  return null;
}
