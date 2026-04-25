import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/shared/Footer';
import { Wordmark } from '@/components/shared/Wordmark';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'Privacy policy for lmgttfy.com — what we collect, what we don’t, and why.',
};

export default function PrivacyPage() {
  return (
    <div className="app-shell">
      <header className="page-header">
        <Wordmark />
      </header>

      <main className="prose-page">
        <h1>Privacy</h1>
        <p className="meta">Last updated: April 2026</p>

        <p>
          We try to collect as close to nothing as possible. Here is what that means in practice.
        </p>

        <h2>Analytics</h2>
        <p>
          We use{' '}
          <a
            href="https://www.cloudflare.com/web-analytics/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Cloudflare Web Analytics
          </a>
          , which is cookieless and does not fingerprint visitors. It records aggregate data such
          as page views, referrers, and rough geographic region. It does not identify individuals.
          Because there are no cookies and no personal data, no consent banner is required under
          the EU GDPR, the UK&rsquo;s ICO, or Brazil&rsquo;s LGPD.
        </p>

        <h2>What is in a URL</h2>
        <p>
          The text you encode is part of the URL itself (e.g.{' '}
          <code>/t/en/pt/your%20text%20here</code>). When a recipient opens the link, the URL is
          sent to our hosting provider as part of the standard web request. Our hosting provider
          (Cloudflare) may retain short-term request logs (IP address, user agent, timestamp,
          requested URL) for security and abuse prevention purposes; we do not separately log,
          store, or analyse the encoded text.
        </p>

        <p>
          If your text is sensitive, do not put it in a URL — for any service, not just this one.
        </p>

        <h2>localStorage</h2>
        <p>
          We use your browser&rsquo;s <code>localStorage</code> to remember up to your last 5
          generated links so you can find them on the homepage. This data stays in your browser.
          We never read it, sync it, or send it anywhere. Clearing your browser storage removes
          it.
        </p>

        <h2>What we do not do</h2>
        <ul>
          <li>We do not require an account.</li>
          <li>We do not place advertising or tracking cookies.</li>
          <li>We do not sell or share data with advertisers.</li>
          <li>We do not run third-party tag managers, fingerprinters, or session recorders.</li>
        </ul>

        <h2>Contact</h2>
        <p>
          Questions, concerns, or takedown requests:{' '}
          <a href="mailto:abuse@lmgttfy.com">abuse@lmgttfy.com</a>.
        </p>

        <p>
          <Link href="/">← Back to the generator</Link>
        </p>
      </main>

      <Footer />
    </div>
  );
}
