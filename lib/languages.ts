export type LangCode =
  | 'en'
  | 'es'
  | 'pt'
  | 'fr'
  | 'de'
  | 'it'
  | 'ja'
  | 'ko'
  | 'zh'
  | 'ru'
  | 'ar';

export type SrcLangCode = LangCode | 'auto';

export const LANGUAGES: Record<LangCode, string> = {
  en: 'English',
  es: 'Spanish',
  pt: 'Portuguese',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  ru: 'Russian',
  ar: 'Arabic',
};

export const LANG_CODES = Object.keys(LANGUAGES) as LangCode[];

export const SRC_AUTO_LABEL = 'Detect language';

export function langName(code: SrcLangCode): string {
  if (code === 'auto') return SRC_AUTO_LABEL;
  return LANGUAGES[code] ?? code;
}

export function isLangCode(s: string): s is LangCode {
  return Object.prototype.hasOwnProperty.call(LANGUAGES, s);
}

export function isSrcLangCode(s: string): s is SrcLangCode {
  return s === 'auto' || isLangCode(s);
}
