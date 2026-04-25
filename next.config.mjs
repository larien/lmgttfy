/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,

  // Local dev parity with the Cloudflare Pages _redirects file.
  //
  // In production Cloudflare rewrites /:src/:tgt[/...] -> /walkthrough/ before
  // the request hits any static asset, so the recipient URL parser (which
  // reads window.location.pathname) sees the real shared URL while serving
  // the walkthrough shell.
  //
  // `next dev` doesn't run Cloudflare. These rewrites give us the same shape
  // when running locally so a copied share URL actually works end-to-end.
  //
  // Important: rewrites are documented as unsupported with `output: 'export'`.
  // They are honored by `next dev` (which runs the full dev server) but
  // ignored by `next build` for the static export — that's exactly what we
  // want: prod routing is owned by Cloudflare _redirects, dev routing is
  // owned by these rules. The build emits a warning to that effect; it is
  // benign and intentional.
  async rewrites() {
    return [
      // Match anything with at least two leading single-segment params.
      // afterFiles ordering (the default) means real pages like /about,
      // /walkthrough, /_next/* still win. This only catches genuinely
      // unmatched paths shaped like a recipient URL.
      { source: '/:src/:tgt', destination: '/walkthrough' },
      { source: '/:src/:tgt/:rest*', destination: '/walkthrough' },
    ];
  },
};

export default nextConfig;
