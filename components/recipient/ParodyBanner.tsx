'use client';

import { useEffect, useState } from 'react';

const AUTO_HIDE_AFTER_MS = 4500;

// Sits at the top of the walkthrough for the first few seconds explaining
// that this is a parody. Auto-hides; also dismissible. Once dismissed it
// stays dismissed for the page's lifetime (no localStorage — recipients
// rarely revisit).
export function ParodyBanner() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), AUTO_HIDE_AFTER_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`wk-banner ${visible ? '' : 'wk-banner-hidden'}`}
      role="status"
      aria-live="polite"
    >
      <span>This is a parody — someone sent you this as a joke.</span>
      <button
        type="button"
        className="wk-banner-dismiss"
        onClick={() => setVisible(false)}
        aria-label="Dismiss banner"
      >
        dismiss
      </button>
    </div>
  );
}
