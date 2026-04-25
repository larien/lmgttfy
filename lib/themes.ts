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

const THEME_STORAGE_KEY = 'lmgttfy:theme';

// Read the persisted sender theme. Returns `null` when storage is empty,
// unavailable (private mode, SSR), or contains an unknown value — the
// caller decides what initial state to use in those cases.
export function loadStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return null;
    return isTheme(raw) ? raw : null;
  } catch {
    return null;
  }
}

// Persist the sender theme. Failures (quota, disabled storage) are
// swallowed — losing this preference is harmless.
export function saveStoredTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}
