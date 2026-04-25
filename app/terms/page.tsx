import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/shared/Footer';
import { Wordmark } from '@/components/shared/Wordmark';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of service for lmgttfy.com.',
};

export default function TermsPage() {
  return (
    <div className="app-shell">
      <header className="page-header">
        <Wordmark />
      </header>

      <main className="prose-page">
        <h1>Terms of Service</h1>
        <p className="meta">Last updated: April 2026</p>

        <p>
          By using lmgttfy.com (&ldquo;the Site&rdquo;) you agree to these Terms. If you do not
          agree, please do not use the Site.
        </p>

        <h2>1. The Site is parody</h2>
        <p>
          lmgttfy.com is a parody website. We are not affiliated with, endorsed by, or sponsored
          by Google LLC. &ldquo;Google&rdquo; and &ldquo;Google Translate&rdquo; are trademarks of
          Google LLC and are referenced for descriptive purposes only.
        </p>

        <h2>2. Acceptable use</h2>
        <p>You agree that you will not use the Site to:</p>
        <ul>
          <li>Harass, threaten, stalk, defame, or intimidate any person.</li>
          <li>
            Encode text that contains personal information, credentials, or content unlawful under
            applicable law (including hate speech, threats, or content that sexualises minors).
          </li>
          <li>
            Distribute generated URLs in a manner intended to mislead a recipient about a serious
            matter (e.g. phishing, fraud).
          </li>
        </ul>
        <p>
          The Site is intended for harmless ribbing between consenting friends, colleagues, and
          family members. Anything else is misuse.
        </p>

        <h2>3. Reporting and content removal</h2>
        <p>
          The Site does not store the text encoded in URLs on its servers; the text is part of the
          URL itself. If you receive a URL whose contents violate these Terms, you may report it to{' '}
          <a href="mailto:abuse@lmgttfy.com">abuse@lmgttfy.com</a>. We reserve the right to add
          server-side rules that refuse to render specific URLs whose decoded text we have
          validated as abusive.
        </p>

        <h2>4. No warranty</h2>
        <p>
          The Site is provided &ldquo;as is&rdquo; without warranties of any kind, express or
          implied. We do not warrant that the Site will be available, error-free, or fit for any
          particular purpose. Use is at your own risk.
        </p>

        <h2>5. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, the operators of the Site shall not be liable
          for any indirect, incidental, special, consequential, or punitive damages arising out
          of or related to your use of the Site.
        </p>

        <h2>6. Governing law</h2>
        <p>
          These Terms are governed by the laws of the Federative Republic of Brazil. Any dispute
          arising from these Terms is subject to the exclusive jurisdiction of the courts of São
          Paulo, SP, Brazil.
        </p>

        <h2>7. Cooperation with law enforcement</h2>
        <p>
          We will cooperate with valid legal process from competent authorities. Because we do not
          store the encoded text, the data we can produce is limited to standard web request logs
          (IP address, user agent, timestamp) collected by our hosting provider, where retained.
        </p>

        <h2>8. Changes</h2>
        <p>
          We may update these Terms from time to time. Continued use of the Site after changes
          constitutes acceptance of the updated Terms.
        </p>

        <p>
          <Link href="/">← Back to the generator</Link>
        </p>
      </main>

      <Footer />
    </div>
  );
}
