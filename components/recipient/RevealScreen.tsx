'use client';

import { useEffect, useState } from 'react';
import type { LangCode, SrcLangCode } from '@/lib/languages';
import { pickRandom, REVEAL_LINES } from '@/lib/snarkLines';
import { THEMES, THEME_LABELS, type Theme } from '@/lib/themes';

interface Props {
  visible: boolean;
  googleUrl: string;
  reportMailto: string;
  theme: Theme;
  src: SrcLangCode;
  tgt: LangCode;
  onThemeChange: (next: Theme) => void;
  onReplay: () => void;
}

export function RevealScreen({
  visible,
  googleUrl,
  reportMailto,
  theme,
  src,
  tgt,
  onThemeChange,
  onReplay,
}: Props) {
  const [line, setLine] = useState<string>(REVEAL_LINES[0]);

  // Pick the initial line on mount (avoids SSR/hydration mismatch from
  // randomness, even though this whole component is client-only).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLine(pickRandom(REVEAL_LINES));
  }, []);

  const shuffle = () => {
    setLine((prev) => pickRandom(REVEAL_LINES, { exclude: prev }));
  };

  // Pre-fill the homepage with the same language pair so the recipient can
  // turn the joke around in one click. Text and theme stay opt-in.
  const senderHref = `/?src=${encodeURIComponent(src)}&tgt=${encodeURIComponent(tgt)}`;

  return (
    <div
      className={`wk-reveal ${visible ? 'wk-visible' : ''}`}
      role="dialog"
      aria-hidden={!visible}
      aria-label="Translation reveal"
    >
      <div className="wk-reveal-card">
        <button
          type="button"
          className="wk-reveal-line"
          onClick={shuffle}
          title="Shuffle"
        >
          {line}
        </button>
        <div className="wk-reveal-hint">tap line to shuffle</div>
        <div className="wk-reveal-actions">
          <a
            className="wk-reveal-btn"
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Google Translate
          </a>
          <a className="wk-reveal-btn wk-reveal-btn-secondary" href={senderHref}>
            Try it on someone
          </a>
        </div>
        <button
          type="button"
          className="wk-reveal-replay"
          onClick={onReplay}
        >
          ↻ play again
        </button>
        <div className="wk-theme-row">
          <span className="wk-theme-row-label">theme</span>
          <div className="wk-theme-swatches">
            {THEMES.map((t) => (
              <button
                key={t}
                type="button"
                className={`wk-swatch wk-swatch-${t} ${
                  t === theme ? 'wk-active' : ''
                }`}
                title={THEME_LABELS[t]}
                aria-label={`Switch to ${THEME_LABELS[t]} theme`}
                onClick={() => onThemeChange(t)}
              />
            ))}
          </div>
        </div>
        <div className="wk-reveal-disclaimer">
          Not affiliated with Google. We just think you should&rsquo;ve used it.
        </div>
        <div className="wk-reveal-footer">
          <a href={reportMailto}>Report this URL</a>
        </div>
      </div>
    </div>
  );
}
