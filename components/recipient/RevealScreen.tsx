'use client';

import { useEffect, useState } from 'react';
import { pickRandom, REVEAL_LINES } from '@/lib/snarkLines';
import { THEMES, THEME_LABELS, type Theme } from '@/lib/themes';

interface Props {
  visible: boolean;
  googleUrl: string;
  reportMailto: string;
  theme: Theme;
  onThemeChange: (next: Theme) => void;
}

export function RevealScreen({
  visible,
  googleUrl,
  reportMailto,
  theme,
  onThemeChange,
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
        <a
          className="wk-reveal-btn"
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Google Translate
        </a>
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
