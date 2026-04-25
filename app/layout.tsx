import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Let Me Google Translate That For You',
    template: '%s · lmgttfy',
  },
  description: "For when they could've just used Google Translate.",
  applicationName: 'lmgttfy',
  authors: [{ name: 'lmgttfy' }],
  metadataBase: new URL('https://lmgttfy.com'),
  openGraph: {
    title: 'Let Me Google Translate That For You',
    description: "For when they could've just used Google Translate.",
    type: 'website',
    url: 'https://lmgttfy.com',
    siteName: 'lmgttfy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Let Me Google Translate That For You',
    description: "For when they could've just used Google Translate.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
