'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  isLangCode,
  isSrcLangCode,
  langName,
  LANG_CODES,
  type LangCode,
  type SrcLangCode,
} from '@/lib/languages';
import {
  EXAMPLE_CHIPS,
  ERROR_LINES,
  pickRandom,
  REVEAL_LINES,
  SHARE_TEXT,
  SHARE_TITLE,
  TAGLINE_TAUNTS,
} from '@/lib/snarkLines';
import { THEMES, THEME_LABELS, type Theme } from '@/lib/themes';
import { buildRecipientUrl } from '@/lib/url';
import { MAX_TEXT_LEN } from '@/lib/validation';
import { QRModal } from './QRModal';
import { RecentLinks, useRecent, type RecentEntry } from './RecentLinks';

const SWATCH_CLASS: Record<Theme, string> = {
  warm: 'swatch-warm',
  dark: 'swatch-dark',
  y2k: 'swatch-y2k',
  terminal: 'swatch-terminal',
};

// Sender starts with the dark theme picked, matching the prototype.
const INITIAL_THEME: Theme = 'dark';
const INITIAL_TAUNT = TAGLINE_TAUNTS[0];
const INITIAL_SNARK = REVEAL_LINES[0];

export function Composer() {
  const [text, setText] = useState('');
  const [src, setSrc] = useState<SrcLangCode>('en');
  const [tgt, setTgt] = useState<LangCode>('pt');
  const [theme, setTheme] = useState<Theme>(INITIAL_THEME);

  const [taunt, setTaunt] = useState(INITIAL_TAUNT);
  const [snark, setSnark] = useState(INITIAL_SNARK);

  const [shareHint, setShareHint] = useState<string>(ERROR_LINES.defaultShareHint);
  const [shareHintAlert, setShareHintAlert] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [canShare, setCanShare] = useState(false);

  const { recents, add: addRecent } = useRecent();

  // Randomise the surface text (taunt + snark) on mount only — never during
  // SSR/build, otherwise hydration mismatches would log warnings.
  useEffect(() => {
    setTaunt(pickRandom(TAGLINE_TAUNTS));
    setSnark(pickRandom(REVEAL_LINES));
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  // Live URL — derived state, no useEffect needed.
  const shareUrl = useMemo(
    () => buildRecipientUrl({ src, tgt, text, theme }),
    [src, tgt, text, theme],
  );

  // Update the share hint when text presence changes (cheap effect, no flicker).
  useEffect(() => {
    if (shareHintAlert) return; // Don't overwrite a temporary mocky message
    setShareHint(text.trim() ? ERROR_LINES.defaultShareHint : ERROR_LINES.emptyTextHint);
  }, [text, shareHintAlert]);

  // === Animated preview text =================================================
  // Append-only typing animation for the preview pane. Snaps for delete/paste
  // (any non-append change). Implemented via refs so chained setTimeouts read
  // the latest target without forcing useEffect to re-fire per char.
  const targetRef = useRef('');
  const displayedRef = useRef('');
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [displayedText, setDisplayedText] = useState('');

  const writeDisplayed = useCallback((s: string) => {
    displayedRef.current = s;
    setDisplayedText(s);
  }, []);

  const tickAnimation = useCallback(() => {
    const target = targetRef.current;
    const current = displayedRef.current;
    if (current === target) {
      animTimerRef.current = null;
      return;
    }
    if (target.startsWith(current) && target.length > current.length) {
      writeDisplayed(target.slice(0, current.length + 1));
      animTimerRef.current = setTimeout(tickAnimation, 30);
    } else {
      writeDisplayed(target);
      animTimerRef.current = null;
    }
  }, [writeDisplayed]);

  useEffect(() => {
    targetRef.current = text.trim();
    if (animTimerRef.current) {
      clearTimeout(animTimerRef.current);
      animTimerRef.current = null;
    }
    tickAnimation();
  }, [text, tickAnimation]);

  useEffect(
    () => () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    },
    [],
  );

  // === Copy ==================================================================
  const flashHint = useCallback((message: string) => {
    setShareHint(message);
    setShareHintAlert(true);
    setTimeout(() => {
      setShareHintAlert(false);
    }, 2000);
  }, []);

  const recordRecent = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const entry: RecentEntry = { url: shareUrl, text: trimmed, src, tgt, theme };
    addRecent(entry);
  }, [addRecent, shareUrl, src, tgt, text, theme]);

  const doCopy = useCallback(async () => {
    if (!text.trim()) {
      flashHint(ERROR_LINES.copyEmptyText);
      return false;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      recordRecent();
      return true;
    } catch {
      flashHint('Browser blocked clipboard access. Select the URL manually.');
      return false;
    }
  }, [flashHint, recordRecent, shareUrl, text]);

  // === Cmd/Ctrl+Enter shortcut ===============================================
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        void doCopy();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doCopy]);

  // === Native Share API ======================================================
  const doShare = useCallback(async () => {
    if (!text.trim()) {
      flashHint(ERROR_LINES.copyEmptyText);
      return;
    }
    try {
      await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: shareUrl });
      recordRecent();
    } catch {
      // User cancelled or share failed silently — match prototype behaviour.
    }
  }, [flashHint, recordRecent, shareUrl, text]);

  // === QR ====================================================================
  const openQr = useCallback(() => {
    if (!text.trim()) {
      flashHint(ERROR_LINES.copyEmptyText);
      return;
    }
    setShowQr(true);
  }, [flashHint, text]);

  // === Misc handlers =========================================================
  const swapLanguages = () => {
    if (src === 'auto') return;
    const prevSrc = src;
    setSrc(tgt);
    setTgt(prevSrc as LangCode);
  };

  const shuffleSnark = () => setSnark((prev) => pickRandom(REVEAL_LINES, { exclude: prev }));

  const loadFromRecent = (entry: RecentEntry) => {
    setText(entry.text);
    setSrc(entry.src);
    setTgt(entry.tgt);
    setTheme(entry.theme);
  };

  const applyExample = (chip: (typeof EXAMPLE_CHIPS)[number]) => {
    setText(chip.text);
    setSrc(chip.src);
    setTgt(chip.tgt);
  };

  const charCount = text.length;
  const charWarning = charCount > 180;

  return (
    <>
      <header className="page-header">
        <div className="header-row">
          <div>
            <a href="/" className="wordmark">
              lmgttfy<span className="dot">.</span>com
            </a>
            <p className="tagline">
              Let Me Google Translate That For You.{' '}
              <span className="tagline-taunt">{taunt}</span>
            </p>
          </div>
        </div>
      </header>

      <main className="composer">
        <div className="composer-grid">
          <div className="composer-form">
            <label className="field">
              <span className="field-label">What should they have translated?</span>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the text they were too lazy to translate themselves"
                maxLength={MAX_TEXT_LEN}
                rows={3}
              />
              <div className="field-meta">
                <div className="examples">
                  <span className="examples-label">Try:</span>
                  {EXAMPLE_CHIPS.map((chip) => (
                    <button
                      key={chip.text}
                      type="button"
                      className="example-chip"
                      onClick={() => applyExample(chip)}
                    >
                      &ldquo;
                      {chip.text.length > 24 ? `${chip.text.slice(0, 24)}…` : chip.text}
                      &rdquo;
                    </button>
                  ))}
                </div>
                <span className={`field-hint ${charWarning ? 'warning' : ''}`}>
                  {charCount} / {MAX_TEXT_LEN}
                </span>
              </div>
            </label>

            <div className="lang-fields">
              <label className="field">
                <span className="field-label">From</span>
                <select
                  className="lang-input"
                  value={src}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (isSrcLangCode(v)) setSrc(v);
                  }}
                >
                  <option value="auto">Detect language</option>
                  {LANG_CODES.map((code) => (
                    <option key={code} value={code}>
                      {langName(code)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="swap-btn"
                onClick={swapLanguages}
                disabled={src === 'auto'}
                title={src === 'auto' ? 'Pick a source language to swap' : 'Swap languages'}
                aria-label="Swap source and target languages"
              >
                ⇄
              </button>
              <label className="field">
                <span className="field-label">To</span>
                <select
                  className="lang-input"
                  value={tgt}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (isLangCode(v)) setTgt(v);
                  }}
                >
                  {LANG_CODES.map((code) => (
                    <option key={code} value={code}>
                      {langName(code)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="field">
              <span className="field-label">Theme</span>
              <div className="theme-picker" role="radiogroup" aria-label="Theme">
                {THEMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={theme === t}
                    className={`theme-card ${theme === t ? 'active' : ''}`}
                    onClick={() => setTheme(t)}
                  >
                    <span className={`theme-card-swatch ${SWATCH_CLASS[t]}`} />
                    <span className="theme-card-name">{THEME_LABELS[t]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="snark-preview">
              <div className="snark-preview-label">They&apos;ll see something like:</div>
              <div className="snark-preview-row">
                <span className="snark-preview-line">&ldquo;{snark}&rdquo;</span>
                <button
                  type="button"
                  className="snark-shuffle"
                  onClick={shuffleSnark}
                  aria-label="Shuffle snark line"
                >
                  ↻
                </button>
              </div>
            </div>
          </div>

          <div className="composer-preview">
            <div className="preview-label">What they&apos;ll see</div>
            <div className={`preview-frame theme-${theme}`}>
              <div className="preview-chrome">
                <div className="preview-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="preview-urlbar">translate.lmgttfy.com</div>
              </div>
              <div className="preview-site">
                <div className="preview-wordmark">
                  lmgttfy<span className="preview-dot">.</span>translate
                </div>
                <div className="preview-langs">
                  <div className="preview-lang">{langName(src)}</div>
                  <div className="preview-swap">⇄</div>
                  <div className="preview-lang">{langName(tgt)}</div>
                </div>
                <div className="preview-panels">
                  <div className="preview-panel">
                    {displayedText ? (
                      displayedText
                    ) : (
                      <span className="preview-placeholder">Your text appears here</span>
                    )}
                  </div>
                  <div className="preview-panel translated">
                    <span className="preview-placeholder">…</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="share-section" aria-label="Share">
          <div className="share-row">
            <input
              type="text"
              className="share-url"
              value={shareUrl}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Shareable URL"
            />
            <div className="share-actions">
              <button
                type="button"
                className="action-btn"
                title="Show QR code"
                aria-label="Show QR code"
                onClick={openQr}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <line x1="14" y1="14" x2="14" y2="17" />
                  <line x1="14" y1="20" x2="14" y2="21" />
                  <line x1="17" y1="14" x2="21" y2="14" />
                  <line x1="17" y1="17" x2="17" y2="21" />
                  <line x1="20" y1="17" x2="21" y2="17" />
                  <line x1="20" y1="20" x2="21" y2="20" />
                </svg>
              </button>
              {canShare && (
                <button
                  type="button"
                  className="action-btn"
                  title="Share"
                  aria-label="Share"
                  onClick={doShare}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                className={`copy-btn ${copied ? 'copied' : ''}`}
                onClick={() => {
                  void doCopy();
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <div className={`share-hint ${shareHintAlert ? 'alert' : ''}`}>{shareHint}</div>
          <RecentLinks recents={recents} onSelect={loadFromRecent} />
        </section>
      </main>

      {showQr && <QRModal url={shareUrl} onClose={() => setShowQr(false)} />}
    </>
  );
}
