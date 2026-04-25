# lmgttfy

> Let Me Google Translate That For You — for when they could've just used Google Translate.

A parody site that mocks people who ask for translations they could've done themselves.
Sender enters text + language pair + theme, gets a shareable URL. Recipient watches a fake
cursor "show them" how to use Google Translate, then lands on the real Google Translate.

## Status

**PR 1 (this commit):** scaffold, lib helpers with table-driven tests, sender homepage
end-to-end (form, themed live preview, share/copy/QR, recent links via `localStorage`,
example chips, snark shuffle, ⌘/Ctrl+Enter shortcut), and the static `/about`, `/terms`,
`/privacy`, and 404 pages.

Not yet built (planned PR 2 / PR 3):

- The recipient walkthrough at `/[src]/[tgt]/[text]` (the cursor animation, themes on
  `<body>`, reveal screen, skip button, error states).
- Dynamic OG image generation. We currently rely on the static `og:title` /
  `og:description` set in `app/layout.tsx`. Add `/og-default.png` (or `.svg`) to `public/`
  for richer link previews; switch to a Cloudflare Worker for per-URL images later.
- Cloudflare Web Analytics snippet.
- Abuse mitigation banner and `mailto:abuse@lmgttfy.com` link in the walkthrough footer.
- `_headers` (CSP, `X-Frame-Options`, `Referrer-Policy`) and `_redirects` files for
  Cloudflare Pages.

## Architecture decisions

- **Static export** (`output: 'export'`). Build outputs to `out/`, deployable to
  Cloudflare Pages with no functions or edge runtime. Trade-off: no Next.js route
  handlers and therefore no built-in dynamic OG image route. Worth it for v1.
- **Magenta is the brand colour.** The palette switcher from the prototype was a
  one-time exploration tool; it isn't shipped. If we ever want to A/B test palettes,
  reintroduce it in a single component, don't sprinkle `body.palette-*` classes
  throughout the CSS again.
- **Theming via CSS variables**, not Tailwind classes. `app/globals.css` defines the
  brand tokens at `:root`. The recipient pages (PR 2) will toggle `body.theme-*`
  classes that override the relevant variables. Tailwind v4 is present for layout
  primitives but the bulk of the design is hand-rolled to mirror the prototypes
  exactly.
- **Components are consolidated, not atomized.** `Composer.tsx` owns the entire
  sender form; `RecentLinks.tsx` and `QRModal.tsx` are split because each has its
  own lifecycle (storage, modal/keyboard).
- **Pure libs in `lib/*` are unit-tested** with Vitest table-driven tests. No tests
  for React components yet — the form is shallow enough that runtime smoke testing
  in the dev server catches everything that matters at v1.

### The recipient route caveat (read before starting PR 2)

`app/[src]/[tgt]/[text]/page.tsx` cannot be pre-rendered at build time with
`output: 'export'` because the text param is unbounded. Two options:

1. **`_redirects` SPA fallback.** Add `out/walkthrough.html` (the catch-all client
   shell), then in `public/_redirects`:
   ```
   /:src/:tgt/:text /walkthrough.html 200
   ```
   The shell reads `window.location.pathname` on the client. Works on Cloudflare
   Pages out of the box.
2. **Move to a query-param URL** like `/w?src=...&tgt=...&text=...`. Loses the
   pretty path but renders as a single static page with no rewrite rules.

Either is fine; (1) preserves the URLs in the spec, (2) is one line of code and zero
infra. Decide before writing the walkthrough.

## Project layout

```
app/
  layout.tsx               root metadata
  page.tsx                 sender homepage (server component, mounts <Composer/>)
  about/, terms/, privacy/ static prose pages
  not-found.tsx            mocky 404
  globals.css              brand tokens, all sender styles, themed preview frame
components/
  shared/                  Wordmark, Footer
  sender/                  Composer, QRModal, RecentLinks (with useRecent hook)
lib/
  languages.ts             ISO 639-1 whitelist + display names
  themes.ts                theme parsing/validation
  snarkLines.ts            all copy (reveal lines, taunts, skip lines, errors, examples)
  url.ts                   build/parse recipient + Google Translate URLs
  validation.ts            text + language validators
  *.test.ts                vitest table-driven tests
docs/prototypes/           original HTML design source-of-truth (sender + recipient)
```

## Local development

```bash
make install      # npm install
make dev          # http://localhost:3000
make test         # run unit tests once
make test-watch   # tdd loop
make build        # produces out/ for static deploy
make serve        # build then serve out/ on http://localhost:5000 (smoke test)
make typecheck    # tsc --noEmit
make lint         # next lint
make check        # typecheck + lint + test (run before pushing)
make clean        # rm -rf .next out
```

`make help` lists all targets. The `Makefile` is a thin wrapper over the npm
scripts in `package.json` — use whichever you prefer; both work.

VS Code / Cursor debug configs live in `.vscode/launch.json`:

- **Next.js: dev server** — runs `npm run dev` in an integrated terminal.
- **Next.js: full stack** — launches Next under `--inspect` and auto-attaches
  Chrome/Edge to the served URL so server and client breakpoints both hit.
- **Vitest: current file** — debug the currently focused test file.
- **Vitest: all** — debug the entire test suite.

## Deploying to Cloudflare Workers

Build artefact is `out/` (`npm run build`). We deploy it as an **assets-only
Cloudflare Worker** using Workers Static Assets — no server code, no
`@opennextjs/cloudflare`, no Pages.

> ℹ️ **Why Workers and not Pages?** As of 2026, Cloudflare Pages is in
> maintenance mode and Cloudflare officially recommends Workers Static Assets
> for new projects. Workers has feature parity for our use case (static HTML,
> `_redirects`, `_headers`, custom domains) and gets all new features first.

The deploy config lives in [`wrangler.jsonc`](./wrangler.jsonc):

```jsonc
{
  "name": "lmgttfy",
  "compatibility_date": "2026-04-01",
  "assets": {
    "directory": "./out/",
    "not_found_handling": "404-page"
  }
}
```

The `public/_redirects` file is honoured automatically — that's how the recipient
SPA-fallback rewrite (`/:src/:tgt[/...] -> /walkthrough/`) works in production.

Two automation paths — pick one, don't run both.

### 1. Git integration via Workers Builds (recommended)

One-time setup in the Cloudflare dashboard under **Workers & Pages → Create →
Import a repository**. After that: every push to `main` triggers a production
deploy, every other branch / PR gets a per-version preview URL.

- **Repo:** connect this GitHub repo
- **Production branch:** `main`
- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler deploy`
- **Root directory:** `/`

> ⚠️ **Do _not_ accept the wizard's "Next.js" framework integration.** It
> auto-injects `npx opennextjs-cloudflare build` to convert Next.js into a
> Worker bundle, which expects an SSR build and crashes our static export
> with:
>
> ```
> ENOENT ... .next/standalone/.next/server/pages-manifest.json
> ```
>
> We're on `output: 'export'`. Set the build command explicitly to
> `npm run build` and let `wrangler.jsonc` handle the rest. If your dashboard
> already has the OpenNext wrapper, edit the build configuration and replace
> the build command with `npm run build`.

No GitHub secrets, no workflow file. Cloudflare runs the build on its own
infra. Gates (`make check`) are not enforced on Cloudflare's build — add the
GitHub Actions path below if you want them to be.

### 2. GitHub Actions (when you want CI gates before deploy)

Use this when a failing test/lint should block the deploy. Disable Workers
Builds in the Cloudflare dashboard first (or it will race the workflow).

Required GitHub repo secrets:

- `CLOUDFLARE_API_TOKEN` — scoped to **Account → Workers Scripts → Edit**
- `CLOUDFLARE_ACCOUNT_ID`

Workflow:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
  pull_request:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
      - run: npm ci
      - run: make check
      - run: npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
```

For PR previews on Workers, swap `command: deploy` with
`command: versions upload` — that uploads a non-prod Worker version with its
own URL, leaving production untouched until you promote it.

### Manual escape hatch

```bash
npm run build
npx wrangler deploy
```

For pushing a hotfix without going through CI. Requires a Cloudflare API token
either via `wrangler login` or `CLOUDFLARE_API_TOKEN` env var.

### Headers (deferred)

`public/_headers` is not yet committed. Minimum to add when you do:

```
/*
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  X-Content-Type-Options: nosniff
  Permissions-Policy: interest-cohort=()
```

CSP is intentionally loose right now (QR is an inline data URI, cursor SVG is
inline). Tighten when the asset surface is locked down.

## Not-doing list (kept here so future-us doesn't re-litigate)

- No translation API. Ever. The whole joke is that Google Translate is one click
  away.
- No accounts, comments, social features.
- No sender-customised snark lines (moderation is not worth it).
- No tracking beyond Cloudflare Web Analytics.
- No Google branding (logo, colours, fonts) — the wordmark is `lmgttfy.translate`
  and that's the deliberate, distinct knock-off look.
