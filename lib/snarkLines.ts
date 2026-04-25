import type { LangCode, SrcLangCode } from './languages';

export const REVEAL_LINES: readonly string[] = [
  "You're welcome.",
  'There. Was that so hard?',
  'Next time, try this yourself.',
  'Imagine having access to the entire internet.',
  'We believe in you. Eventually.',
  'Hope this helps! 🙂',
  'You watched this whole thing instead of just translating it.',
  'Bookmark it. Please.',
  "Glad we could help. We shouldn't have had to.",
  'This took longer to make than for you to do it yourself.',
  'Mission accomplished. Sort of.',
  'Crisis averted. Effort: minimal.',
  'There you go, champ.',
  "And that's how the internet works.",
];

export const TAGLINE_TAUNTS: readonly string[] = [
  'Mock with care.',
  'Send wisely.',
  'Use your powers responsibly.',
  'They probably deserve it.',
  "Some friendships survive this. Some don't.",
  'Pettiness, but make it shareable.',
];

export const SKIP_LINES: readonly string[] = [
  'Skip — I understand how websites work',
  "Skip — I'll pretend I learned something",
  "Skip to the part where you're welcome",
  'Skip — my time is valuable, unlike my effort',
  "Skip — yes, I get it, I'm capable",
];

export const ERROR_LINES = {
  notFound: 'This page is more lost than you are.',
  invalidLang: "That's not a language. Try one that exists.",
  emptyText: 'You forgot the part where you write the thing. Classic.',
  textTooLong: 'That text is too long. The point is brevity.',
  copyEmptyText: 'You forgot the text. Classic.',
  emptyTextHint: 'Add some text to mock someone',
  defaultShareHint: 'Your shareable link updates as you type · ⌘+Enter to copy',
} as const;

export function sameLangError(lang: string): string {
  return `${lang} to ${lang}. You don't need a translator, you need a mirror.`;
}

export interface ExampleChip {
  text: string;
  src: SrcLangCode;
  tgt: LangCode;
}

export const EXAMPLE_CHIPS: readonly ExampleChip[] = [
  { text: 'What time is it in Tokyo?', src: 'en', tgt: 'ja' },
  { text: 'How do I say hello?', src: 'en', tgt: 'fr' },
  { text: '¿Dónde está la biblioteca?', src: 'es', tgt: 'en' },
];

export const SHARE_TITLE = 'Let Me Google Translate That For You';
export const SHARE_TEXT = 'I made you something:';

// Picks an item, optionally avoiding `exclude`. RNG is injectable for tests.
export function pickRandom<T>(
  arr: readonly T[],
  opts?: { exclude?: T; rng?: () => number },
): T {
  if (arr.length === 0) {
    throw new Error('pickRandom: empty array');
  }
  const rng = opts?.rng ?? Math.random;
  const pool =
    opts?.exclude !== undefined && arr.length > 1
      ? arr.filter((v) => v !== opts.exclude)
      : arr;
  const idx = Math.floor(rng() * pool.length);
  return pool[idx];
}
