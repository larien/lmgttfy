import { describe, expect, it } from 'vitest';
import {
  buildGoogleTranslateUrl,
  buildRecipientUrl,
  parseRecipientUrl,
  SITE_BASE,
} from './url';

describe('buildRecipientUrl', () => {
  it('builds the canonical URL with default theme (no query)', () => {
    expect(
      buildRecipientUrl({ src: 'en', tgt: 'pt', text: 'hello world', theme: 'warm' }),
    ).toBe(`${SITE_BASE}/t/en/pt/hello%20world`);
  });

  it('appends ?theme= for non-default themes', () => {
    expect(
      buildRecipientUrl({ src: 'en', tgt: 'pt', text: 'hi', theme: 'dark' }),
    ).toBe(`${SITE_BASE}/t/en/pt/hi?theme=dark`);
  });

  it('encodes special characters', () => {
    expect(
      buildRecipientUrl({ src: 'es', tgt: 'en', text: '¿Dónde está?', theme: 'warm' }),
    ).toBe(`${SITE_BASE}/t/es/en/%C2%BFD%C3%B3nde%20est%C3%A1%3F`);
  });

  it('returns bare /t/src/tgt/ when text is empty', () => {
    expect(
      buildRecipientUrl({ src: 'en', tgt: 'pt', text: '', theme: 'warm' }),
    ).toBe(`${SITE_BASE}/t/en/pt/`);
    expect(
      buildRecipientUrl({ src: 'en', tgt: 'pt', text: '   ', theme: 'dark' }),
    ).toBe(`${SITE_BASE}/t/en/pt/`);
  });

  it('honours explicit base override and strips trailing slash', () => {
    expect(
      buildRecipientUrl(
        { src: 'en', tgt: 'pt', text: 'hi', theme: 'warm' },
        { base: 'http://localhost:3000/' },
      ),
    ).toBe('http://localhost:3000/t/en/pt/hi');
  });

  it('supports auto source', () => {
    expect(
      buildRecipientUrl({ src: 'auto', tgt: 'en', text: 'hola', theme: 'y2k' }),
    ).toBe(`${SITE_BASE}/t/auto/en/hola?theme=y2k`);
  });
});

describe('buildGoogleTranslateUrl', () => {
  it('builds with explicit src/tgt', () => {
    expect(
      buildGoogleTranslateUrl({ src: 'en', tgt: 'pt', text: 'hello world' }),
    ).toBe('https://translate.google.com/?sl=en&tl=pt&text=hello%20world&op=translate');
  });

  it('passes through auto source', () => {
    expect(
      buildGoogleTranslateUrl({ src: 'auto', tgt: 'en', text: 'hola' }),
    ).toBe('https://translate.google.com/?sl=auto&tl=en&text=hola&op=translate');
  });
});

describe('parseRecipientUrl', () => {
  it('parses canonical paths', () => {
    const r = parseRecipientUrl('/t/en/pt/hello%20world');
    expect(r).toEqual({
      ok: true,
      parts: { src: 'en', tgt: 'pt', text: 'hello world', theme: 'warm' },
    });
  });

  it('reads theme from search params when valid', () => {
    const r = parseRecipientUrl('/t/en/pt/hi', '?theme=dark');
    expect(r.ok && r.parts.theme).toBe('dark');
  });

  it('falls back to default theme when ?theme= is invalid', () => {
    const r = parseRecipientUrl('/t/en/pt/hi', '?theme=neon');
    expect(r.ok && r.parts.theme).toBe('warm');
  });

  it('round-trips with buildRecipientUrl', () => {
    const original = { src: 'es', tgt: 'en', text: '¿Dónde está?', theme: 'y2k' } as const;
    const url = buildRecipientUrl(original);
    const parsed = new URL(url);
    const r = parseRecipientUrl(parsed.pathname, parsed.search);
    expect(r).toEqual({ ok: true, parts: original });
  });

  it('rejects same source and target', () => {
    expect(parseRecipientUrl('/t/en/en/hi')).toEqual({ ok: false, error: 'same_lang' });
  });

  it('allows auto -> en even though they differ', () => {
    const r = parseRecipientUrl('/t/auto/en/hi');
    expect(r.ok).toBe(true);
  });

  it('rejects bad codes', () => {
    expect(parseRecipientUrl('/t/xx/pt/hi')).toEqual({ ok: false, error: 'invalid_src' });
    expect(parseRecipientUrl('/t/en/xx/hi')).toEqual({ ok: false, error: 'invalid_tgt' });
    expect(parseRecipientUrl('/t/en/auto/hi')).toEqual({ ok: false, error: 'invalid_tgt' });
  });

  it('rejects missing or empty text', () => {
    expect(parseRecipientUrl('/t/en/pt/')).toEqual({ ok: false, error: 'empty_text' });
    expect(parseRecipientUrl('/t/en/pt')).toEqual({ ok: false, error: 'empty_text' });
    expect(parseRecipientUrl('/t/en/pt/%20')).toEqual({ ok: false, error: 'empty_text' });
  });

  it('rejects text over the length cap', () => {
    const longEncoded = encodeURIComponent('x'.repeat(201));
    expect(parseRecipientUrl(`/t/en/pt/${longEncoded}`)).toEqual({
      ok: false,
      error: 'text_too_long',
    });
  });

  it('rejects malformed percent-encoding', () => {
    expect(parseRecipientUrl('/t/en/pt/%E0%A4%A')).toEqual({ ok: false, error: 'empty_text' });
  });

  it('rejects paths missing the /t/ prefix', () => {
    // Pre-rollout URL shape, hand-crafted paths, and stale shares all fall here.
    expect(parseRecipientUrl('/en/pt/hi')).toEqual({ ok: false, error: 'empty_text' });
    expect(parseRecipientUrl('/about/')).toEqual({ ok: false, error: 'empty_text' });
  });
});
