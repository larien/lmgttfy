import type { Metadata } from 'next';
import { Walkthrough } from '@/components/recipient/Walkthrough';
import '../recipient.css';

export const metadata: Metadata = {
  title: 'Translating…',
  // Recipient pages should not be indexed: each one is a unique snark URL.
  robots: { index: false, follow: false },
};

// Static page. The real path-based routing (/:src/:tgt/:text) is handled by a
// Cloudflare Pages _redirects rule that rewrites every 3+-segment path to
// /walkthrough/. The client component reads window.location.pathname to
// reconstruct the parts.
export default function WalkthroughPage() {
  return <Walkthrough />;
}
