export type Theme = 'warm' | 'dark' | 'y2k' | 'terminal';

export const THEMES: readonly Theme[] = ['warm', 'dark', 'y2k', 'terminal'] as const;

export const DEFAULT_THEME: Theme = 'warm';

export const THEME_LABELS: Record<Theme, string> = {
  warm: 'Warm',
  dark: 'Dark',
  y2k: 'Y2K',
  terminal: 'Terminal',
};

export function isTheme(s: string): s is Theme {
  return (THEMES as readonly string[]).includes(s);
}

// Invalid themes silently fall back to the default per spec.
export function parseTheme(s: string | null | undefined): Theme {
  if (!s) return DEFAULT_THEME;
  return isTheme(s) ? s : DEFAULT_THEME;
}
