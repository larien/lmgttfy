import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/shared/Footer';
import { Wordmark } from '@/components/shared/Wordmark';
import { ERROR_LINES } from '@/lib/snarkLines';

export const metadata: Metadata = {
  title: '404',
  description: ERROR_LINES.notFound,
};

export default function NotFound() {
  return (
    <div className="app-shell">
      <header className="page-header">
        <Wordmark />
      </header>

      <main className="prose-page">
        <h1>404</h1>
        <p>{ERROR_LINES.notFound}</p>
        <p>
          <Link href="/">← Take me home</Link>
        </p>
      </main>

      <Footer />
    </div>
  );
}
