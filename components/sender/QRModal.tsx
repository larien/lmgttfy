'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface Props {
  url: string;
  onClose: () => void;
}

// Renders a tinted QR code in a modal. Reads --accent from computed style at
// open time so the swatch matches the active brand colour without prop wiring.
export function QRModal({ url, onClose }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const accent =
      getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#1a1a1a';

    QRCode.toDataURL(url, {
      width: 240,
      margin: 1,
      color: { dark: accent, light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then((d) => {
        if (!cancelled) setDataUrl(d);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="qr-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Scan QR code"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="qr-modal-content">
        <div className="qr-modal-header">
          <span>Scan to open</span>
          <button type="button" className="qr-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="qr-canvas">
          {dataUrl ? (
            // Client-generated data URL; next/image can't optimize it and we
            // export statically anyway. Plain <img> is correct here.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt="QR code for the share link" width={240} height={240} />
          ) : error ? (
            <span style={{ color: '#a8a49e', fontSize: 12 }}>QR rendering failed.</span>
          ) : (
            <span style={{ color: '#a8a49e', fontSize: 12 }}>Generating…</span>
          )}
        </div>
        <div className="qr-caption">{url}</div>
      </div>
    </div>
  );
}
