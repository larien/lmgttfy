import type { Metadata } from 'next';
import { Walkthrough } from '@/components/recipient/Walkthrough';
import '../recipient.css';

export const metadata: Metadata = {
  title: 'Translating…',
  // Recipient pages should not be indexed: each one is a unique snark URL.
  robots: { index: false, follow: false },
};

// Static page. The real path-based routing (/t/:src/:tgt/:text) is handled
// by a Cloudflare Workers _redirects rule that rewrites the /t/* tree to
// /walkthrough/. The client component reads window.location.pathname to
// reconstruct the parts. The /t/ prefix exists to keep recipient URLs from
// shadowing framework asset paths — see public/_redirects.
export default function WalkthroughPage() {
  return <Walkthrough />;
}
