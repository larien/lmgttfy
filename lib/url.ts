import { isLangCode, isSrcLangCode, type LangCode, type SrcLangCode } from './languages';
import { DEFAULT_THEME, parseTheme, type Theme } from './themes';
import { MAX_TEXT_LEN, type ValidationError } from './validation';

export const SITE_BASE = 'https://lmgttfy.com';

export interface RecipientUrlParts {
  src: SrcLangCode;
  tgt: LangCode;
  text: string;
  theme: Theme;
}

export interface BuildOpts {
  base?: string;
}

// Builds the recipient URL. Only appends ?theme= when non-default.
// If text is empty, returns the bare /{src}/{tgt}/ form so the share input
// always shows a valid-looking URL while the user is still typing.
export function buildRecipientUrl(parts: RecipientUrlParts, opts?: BuildOpts): string {
  const base = (opts?.base ?? SITE_BASE).replace(/\/+$/, '');
  const { src, tgt, text, theme } = parts;
  const trimmed = text.trim();
  if (!trimmed) return `${base}/${src}/${tgt}/`;
  const path = `${base}/${src}/${tgt}/${encodeURIComponent(trimmed)}`;
  return theme === DEFAULT_THEME ? path : `${path}?theme=${theme}`;
}

// Builds a Google Translate URL pre-filled with the same params,
// for the reveal-screen "Open Google Translate" button.
export function buildGoogleTranslateUrl(parts: Pick<RecipientUrlParts, 'src' | 'tgt' | 'text'>): string {
  const sl = parts.src === 'auto' ? 'auto' : parts.src;
  const tl = parts.tgt;
  const text = encodeURIComponent(parts.text.trim());
  return `https://translate.google.com/?sl=${sl}&tl=${tl}&text=${text}&op=translate`;
}

export type ParseResult =
  | { ok: true; parts: RecipientUrlParts }
  | { ok: false; error: ValidationError };

// Parses a recipient URL from its pathname segments and search params.
// Pathname is expected as `/{src}/{tgt}/{encodedText}` (leading slash required).
// Anything else returns ok:false with a typed error.
export function parseRecipientUrl(pathname: string, search = ''): ParseResult {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 3) return { ok: false, error: 'empty_text' };

  const [src, tgt, ...rest] = segments;
  if (!isSrcLangCode(src)) return { ok: false, error: 'invalid_src' };
  if (!isLangCode(tgt)) return { ok: false, error: 'invalid_tgt' };
  if (src !== 'auto' && src === tgt) return { ok: false, error: 'same_lang' };

  const rawText = rest.join('/');
  let text: string;
  try {
    text = decodeURIComponent(rawText);
  } catch {
    return { ok: false, error: 'empty_text' };
  }
  text = text.trim();
  if (!text) return { ok: false, error: 'empty_text' };
  if (text.length > MAX_TEXT_LEN) return { ok: false, error: 'text_too_long' };

  const params = new URLSearchParams(search);
  const theme = parseTheme(params.get('theme'));

  return { ok: true, parts: { src, tgt, text, theme } };
}
