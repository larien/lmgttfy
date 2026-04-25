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

## Deploying to Cloudflare Pages (PR 3)

After `npm run build`, the deployable artefact is `out/`. In the Cloudflare Pages
dashboard:

- **Build command:** `npm run build`
- **Build output directory:** `out`
- **Environment variables:** none

Add a `public/_headers` file (in PR 3) with at least:

```
/*
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  X-Content-Type-Options: nosniff
  Permissions-Policy: interest-cohort=()
```

CSP is intentionally loose for now (the QR uses an inline data URI; the cursor SVG
will too in PR 2). Tighten when the walkthrough is finished and the asset surface
is known.

## Not-doing list (kept here so future-us doesn't re-litigate)

- No translation API. Ever. The whole joke is that Google Translate is one click
  away.
- No accounts, comments, social features.
- No sender-customised snark lines (moderation is not worth it).
- No tracking beyond Cloudflare Web Analytics.
- No Google branding (logo, colours, fonts) — the wordmark is `lmgttfy.translate`
  and that's the deliberate, distinct knock-off look.
