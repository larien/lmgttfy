'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ERROR_LINES, sameLangError } from '@/lib/snarkLines';
import { langName } from '@/lib/languages';
import type { ValidationError } from '@/lib/validation';

interface Props {
  error: ValidationError;
  // Best-effort context for nicer messages. The raw segments from the URL,
  // pre-validation. May be unsafe strings (we don't echo them anywhere
  // beyond the same-lang case which already validated `src === tgt`).
  rawSrc?: string;
  rawTgt?: string;
}

export function messageFor(props: Props): string {
  switch (props.error) {
    case 'invalid_src':
    case 'invalid_tgt':
      return ERROR_LINES.invalidLang;
    case 'empty_text':
      return ERROR_LINES.emptyText;
    case 'text_too_long':
      return ERROR_LINES.textTooLong;
    case 'same_lang': {
      // Both segments are valid LangCodes here (validation reached `same_lang`
      // only after both passed). Format with the human-readable name.
      const name = props.rawSrc ? langName(props.rawSrc as never) : 'that language';
      return sameLangError(name);
    }
  }
}

// Renders the same browser chrome as the success path, but with the error
// message in the source panel and no animation. Reuses every wk-* style.
export function ErrorWalkthrough(props: Props) {
  useEffect(() => {
    document.body.classList.add('walkthrough');
    return () => {
      document.body.classList.remove('walkthrough');
    };
  }, []);

  const message = messageFor(props);

  return (
    <div className="wk-root">
      <div className="wk-browser">
        <div className="wk-chrome">
          <div className="wk-dots">
            <span />
            <span />
            <span />
          </div>
          <div className="wk-urlbar">translate.lmgttfy.com</div>
        </div>
        <div className="wk-site">
          <div className="wk-site-header">
            <div className="wk-wordmark">
              lmgttfy<span className="wk-dot">.</span>translate
            </div>
          </div>
          <div className="wk-panels">
            <div className="wk-panel">
              <div className="wk-error-message">{message}</div>
              <div className="wk-error-actions">
                <Link href="/">&larr; start over on lmgttfy.com</Link>
              </div>
            </div>
            <div className="wk-panel wk-translated">
              <div className="wk-panel-text wk-panel-placeholder">
                nothing to translate
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
