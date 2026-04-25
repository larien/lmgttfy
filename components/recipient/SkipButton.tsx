'use client';

import { useEffect, useState } from 'react';
import { pickRandom, SKIP_LINES } from '@/lib/snarkLines';

interface Props {
  onClick: () => void;
  hidden?: boolean;
}

export function SkipButton({ onClick, hidden = false }: Props) {
  // Pick the skip line on mount only — picking during render would change
  // it on every parent re-render and look glitchy.
  const [label, setLabel] = useState<string>(SKIP_LINES[0]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLabel(pickRandom(SKIP_LINES));
  }, []);

  if (hidden) return null;

  return (
    <button type="button" className="wk-skip" onClick={onClick}>
      {label}
    </button>
  );
}
