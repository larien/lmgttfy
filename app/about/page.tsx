import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/shared/Footer';
import { Wordmark } from '@/components/shared/Wordmark';

export const metadata: Metadata = {
  title: 'About',
  description: 'About lmgttfy.com — a parody for people who could have used Google Translate.',
};

export default function AboutPage() {
  return (
    <div className="app-shell">
      <header className="page-header">
        <Wordmark />
      </header>

      <main className="prose-page">
        <h1>About</h1>
        <p className="meta">A parody · made with mild contempt</p>

        <p>
          lmgttfy.com is the obvious follow-up to{' '}
          <a href="https://letmegooglethat.com" target="_blank" rel="noopener noreferrer">
            letmegooglethat.com
          </a>
          : the kind of person who refuses to type a phrase into Google Translate also exists, and
          they keep asking you to do it.
        </p>

        <h2>How it works</h2>
        <ul>
          <li>You enter the text they should have translated themselves.</li>
          <li>You pick a source and target language and a theme.</li>
          <li>You get a shareable link.</li>
          <li>
            They click it, watch a fake cursor laboriously translate the text, then land on Google
            Translate with the same text already filled in.
          </li>
        </ul>

        <h2>Why</h2>
        <p>
          Mostly to teach a lesson, gently. A little to amuse you. None of it leaves your browser
          beyond the URL itself — see the <Link href="/privacy">privacy page</Link> for details.
        </p>

        <h2>Not affiliated with Google</h2>
        <p>
          We are not Google. This is a parody site. Google Translate is a real, free, public tool
          that does the actual work. We just point at it.
        </p>

        <p>
          <Link href="/">← Back to the generator</Link>
        </p>
      </main>

      <Footer />
    </div>
  );
}
