'use client';

import { useCallback, useEffect, useState } from 'react';
import type { LangCode, SrcLangCode } from '@/lib/languages';
import { langName } from '@/lib/languages';
import type { Theme } from '@/lib/themes';

const STORAGE_KEY = 'lmgttfy:recent';
const MAX_RECENT = 5;

export interface RecentEntry {
  url: string;
  text: string;
  src: SrcLangCode;
  tgt: LangCode;
  theme: Theme;
}

interface UseRecent {
  recents: RecentEntry[];
  add: (entry: RecentEntry) => void;
  ready: boolean;
}

// Single source of truth for the recent-links list. localStorage is read
// once after mount (avoids SSR/hydration mismatch) and written on every change.
export function useRecent(): UseRecent {
  const [recents, setRecents] = useState<RecentEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as RecentEntry[];
        if (Array.isArray(parsed)) {
          setRecents(parsed.filter(isValidEntry).slice(0, MAX_RECENT));
        }
      }
    } catch {
      // Corrupt storage — start fresh, don't crash the page.
    } finally {
      setReady(true);
    }
  }, []);

  const add = useCallback((entry: RecentEntry) => {
    setRecents((prev) => {
      const deduped = prev.filter((e) => e.url !== entry.url);
      const next = [entry, ...deduped].slice(0, MAX_RECENT);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Quota / disabled storage — degrade silently.
      }
      return next;
    });
  }, []);

  return { recents, add, ready };
}

function isValidEntry(e: unknown): e is RecentEntry {
  if (!e || typeof e !== 'object') return false;
  const r = e as Partial<RecentEntry>;
  return (
    typeof r.url === 'string' &&
    typeof r.text === 'string' &&
    typeof r.src === 'string' &&
    typeof r.tgt === 'string' &&
    typeof r.theme === 'string'
  );
}

interface Props {
  recents: RecentEntry[];
  onSelect: (entry: RecentEntry) => void;
}

export function RecentLinks({ recents, onSelect }: Props) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!copiedUrl) return;
    const t = setTimeout(() => setCopiedUrl(null), 1200);
    return () => clearTimeout(t);
  }, [copiedUrl]);

  if (recents.length === 0) return null;

  const handleCopy = (url: string) => {
    void navigator.clipboard.writeText(url).catch(() => {});
    setCopiedUrl(url);
  };

  return (
    <section className="recent-section" aria-label="Recent links">
      <div className="recent-label">Recent links</div>
      <ul className="recent-list">
        {recents.map((entry) => {
          const truncated = entry.text.length > 40 ? `${entry.text.slice(0, 40)}…` : entry.text;
          return (
            <li key={entry.url} className="recent-item">
              <button
                type="button"
                className="recent-text"
                onClick={() => onSelect(entry)}
                title="Load this back into the form"
              >
                &ldquo;{truncated}&rdquo; — {langName(entry.src)} → {langName(entry.tgt)}
              </button>
              <span className="recent-meta">{entry.theme}</span>
              <button
                type="button"
                className="recent-copy"
                onClick={() => handleCopy(entry.url)}
              >
                {copiedUrl === entry.url ? 'Copied!' : 'Copy'}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
