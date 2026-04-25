import Link from 'next/link';

export function Footer() {
  return (
    <footer className="page-footer">
      <div className="footer-text">
        Not affiliated with Google. We just think you should&apos;ve used it.
      </div>
      <nav className="footer-links" aria-label="Footer">
        <Link href="/about" className="footer-link">
          About
        </Link>
        <span className="footer-sep" aria-hidden>
          ·
        </span>
        <Link href="/terms" className="footer-link">
          Terms
        </Link>
        <span className="footer-sep" aria-hidden>
          ·
        </span>
        <Link href="/privacy" className="footer-link">
          Privacy
        </Link>
      </nav>
      <div className="footer-credit">
        Joke gone too far by Lauren ·{' '}
        <a
          href="https://larien.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          larien.dev
        </a>
      </div>
    </footer>
  );
}
