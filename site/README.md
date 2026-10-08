# Madar marketing site (get.madar-pos.cloud)

Astro, prerendered to static HTML, in English (`/en/…`) and Arabic (`/ar/…`, RTL).
**No React:** every component is an Astro component and every behaviour a plain
script (GSAP, Lenis, three.js), so no page ships a framework runtime. Keep it that
way: no `client:` islands, no `@astrojs/react`.
It replaced the old React landing module (`src/features/landing`, `get.html`,
`vite.get.config.ts`) in October 2026. Decisions and their reasons are in
`~/Desktop/Madar/LANDING_DECISIONS.md`.

## Run it

```bash
cd site
npm ci
npm run dev        # http://localhost:5184/en/
npm run build      # → site/dist
npm run preview    # the build at http://localhost:5194/en/, service worker and all
npm run verify     # every page × EN/AR × 4 widths in Chrome, plus the flows (see below)
```

From the repo root, `npm run dev:get` and `npm run build:get` do the same. Node 22.12 or
newer. The dev server never registers the service worker (see "The archive"); the
preview does, which is why it has a port of its own: a worker installed on a port keeps
answering there, and would hide `npm run dev` behind the last build if they shared one. `verify` and `og` need Chrome: they use your installed Chrome, or set
`CHROME_PATH=/path/to/chrome`.

## Deploy

Same as the dashboard: push a `v*.*.*` tag. `.github/workflows/deploy.yml` builds the
site on Node 22 and rsyncs `site/dist/` to `/var/www/madar-get` with `--delete`, so
files the site no longer builds are removed. Hashed files in `assets/` are protected
from the delete: Cloudflare keeps the HTML for up to 5 minutes, and those cached pages
still point at the previous build's assets. Prune old assets by age now and then.

### How the server answers (the get vhost, `deploy/nginx/get.madar-pos.cloud`)

- Folder addresses serve their page: `/en/pricing/` is `/en/pricing/index.html`.
  `/en/pricing` and `/en/pricing/index.html` 301 to `/en/pricing/`.
- `/` serves `get.html` (the build writes the root page under that name too), which
  sends the browser on to `/en/` or `/ar/` by its language.
- Unknown paths get a real 404 with `/404.html`.
- With `Accept: text/markdown`, a folder address serves its `index.md` (and `/` serves
  `/index.md`). Cloudflare bypasses its cache for those requests (a Cache Rule), so a
  Markdown response is never stored and served to a browser.
- `/assets/…` is served with a one-year immutable cache, so `astro.config.mjs` puts
  every hashed file (JS, CSS, images, fonts, the Lottie files) in `assets/`.
- Every text file over 1 KB also ships precompressed beside itself, `.br` (brotli 11)
  and `.gz` (gzip 9), for nginx's `brotli_static` and `gzip_static`.
- HTML is `no-cache` from nginx and cached at Cloudflare for 5 minutes (a Cache Rule).
- Security headers on every response; the CSP is `script-src 'self'`
  (plus Cloudflare's analytics beacon), so the site has **no inline scripts**: the
  scripts that must run before paint are classic files in `src/scripts/classic/`,
  imported with `?url&no-inline` so they are emitted as hashed files. JSON-LD blocks
  stay inline (they aren't executed). If Umami is turned on, its script origin has to
  be added to the CSP in the vhost.

## Files for agents and search

Written at build time, all from the built pages (`scripts/agent-files.mjs`, the sitemap
integration in `astro.config.mjs`):

| File | What |
|---|---|
| `/<lang>/<page>/index.md` | each page's `<main>` as Markdown, with front matter (title, description, url, language, translation) and the contact line. Elements marked `data-md-skip` (phone-only duplicates, the story rail) and anything `aria-hidden` are left out |
| `/index.md` | a bilingual summary linking `/en/` and `/ar/` |
| `/llms.txt`, `/llms-full.txt` | the page list with descriptions; every page in full, English then Arabic |
| `/sitemap.xml` (and `sitemap-index.xml`, `sitemap-0.xml`) | the language pages with `lastmod` (the last commit to `src/` or `public/`) and en, ar and x-default alternates |
| `/robots.txt` | `public/robots.txt`, with Content Signals |

JSON-LD comes from `src/lib/schema.ts`: Organization on every page; WebSite and
SoftwareApplication on the home pages; SoftwareApplication on Pricing; FAQPage on
the FAQ; BreadcrumbList on every page but home; Organization and WebSite on `/`.

## The archive: the whole site, offline

Once a visitor's first page has loaded, a service worker (`sw/sw.ts`, built into
`/sw.js`) fetches every file a visit needs as **one file**, `assets/pack.<hash>.tar`
(about 3.2 MB with brotli, both languages), unpacks it into the browser's cache and
from then on answers the site's requests from it: pages, scripts, styles, fonts,
screenshots, the 3D and the cappuccino's animations, online or offline (owner).

- **In it** (`integrations/pack.mjs`, after the build): every page in both languages,
  every script, style, woff2 font, Lottie file and the animation runtime, the icons,
  and each screenshot once: the smallest width at or above 720 px for phones and
  1280 px for wide screens; the worker answers a request for any width with it. Not
  the share images, the sitemaps, `robots.txt` or `get.html`. The build fails if a page
  names an asset the archive lacks.
- **Pages come from it too**, online as well: instant, at the cost that the first page
  after a release is still the previous version; the rest of that visit is new.
- **Before it lands**, a file that's in it waits up to 3 s for it (`WAIT`), then comes on
  its own, so a slow connection never leaves a screenshot empty (owner).
- **Releases:** the archive's name is its content hash, and `/sw.js` names it. On a later
  page the browser finds the new worker, which downloads the new archive whole while
  the old one keeps serving, checks its hash, then takes over and drops the old one. A
  page never mixes two releases.
- **No service worker** (Instagram's and Facebook's in-app browsers on iPhone, some
  private windows): the site loads exactly as before, lazily, file by file.
- **The server:** nginx sends `pack.<hash>.tar.br` as it is to browsers that accept
  brotli (`brotli_static`), and the browser undoes the compression itself. After a
  deploy, `curl -sI -H 'Accept-Encoding: br' https://get.madar-pos.cloud/assets/pack.<hash>.tar`
  should show `content-encoding: br` (without it the 5.7 MB tar goes out as it is,
  which still works). `/sw.js` must stay uncached; it is, like everything outside
  `/assets/`. Old archives stay on the server like every old file (about 13 MB each
  with their `.br` and `.gz`), so clear old `pack.*` files now and then.
- `npm run verify` checks it: a first visit unpacks it; after that, pages ask the server
  for nothing but the browser's own update check; with the server gone, every page
  opens whole and an unknown address gets the 404 page. `npm run check` type-checks the
  worker (`sw/tsconfig.json`: it runs in a worker, not a page).

## Change things

| What | Where |
|---|---|
| Words (EN and AR) | `src/i18n/en.ts`, `src/i18n/ar.ts` (Arabic is typed against English, so a missing key fails the build) |
| Prices | `pricing.plans` in both copy files |
| Phone, email, socials, dashboard link, App Store link | `src/lib/site.ts` |
| Structured data (JSON-LD) | `src/lib/schema.ts` |
| Home page order | `src/pages/[lang]/index.astro` |
| Screenshots | see below |
| The scroll story | `src/scripts/story.ts` (GSAP: ScrollTrigger, SplitText, DrawSVG; Lenis on mouse/trackpad) |
| The family (3D) | `src/components/home/FamilyShowcase.astro` and `src/scripts/family.ts`; the 3D itself is the engine shared with the dashboard's sign-in, `../shared/showcase` (plain three.js) |
| The hero chip's figures, the "one ledger" beams | `src/components/kit/CountUp.astro` (counted by `story.ts`), `src/components/kit/LedgerBeams.astro` + `src/scripts/beams.ts` |
| An area's screens | `media` and `stepMap` on each `AreaSection` in `src/pages/[lang]/index.astro`: the screens play in the order the steps first need them (step 0 is the intro, then one per point). On the features page, `shots` on each `FeatureArea` (`src/pages/[lang]/features.astro`): two or more wide screens make a strip, two or more phones a fan |
| The cappuccino steps | `src/scripts/barista.ts`, files in `src/assets/lottie/` (Madar's own prep-step animations) |
| The roadmap | `features.roadmap` in both copy files (`state`: `shipped` or `dev`), drawn by `src/components/features/Roadmap.astro` and `roadmap()` in `story.ts` |
| Colours, type, buttons | `src/styles/global.css`: the brand kit's palette, and the design system's type (MadarDashboard `DESIGN.md`): IBM Plex Sans Arabic leads in both languages, IBM Plex Sans behind it, IBM Plex Mono for figures |

Buttons are **Ink & Paper**: one solid button per spot, `btn-ink` on light ground and
`btn-paper` on Ink, flat, a trailing arrow that turns with the language; a second
action is an underlined `link-cta`, not another button. Teal stays in small marks
(kickers, ticks, the logo's satellite, focus rings), never a button.

Motion rules:
- Content is in the HTML and fully readable without JavaScript; `prefers-reduced-motion`
  gets no animation at all: a still frame for the barista.
- **Screens are all on show, the current one in the middle** (`MediaStack.astro`,
  `src/scripts/carousel.ts`). Wide screens (browser, iPad) make a **strip**: the
  current one full size in the middle, its neighbours peeking in from the sides,
  smaller and dimmed; a change slides the strip one place. Phones make a **fan**: every
  phone on show, the current one lifted in the middle, the others either side in their
  order; a change swaps the next phone into the middle (only those two move, the
  incoming one passing in front). At rest no two cards overlap, so nothing shows
  through anything. Mirrored in Arabic.
- On the home page an area with screens is a **scene**: the page pauses on it while
  scrolling turns the screens (about two-thirds of a screen of scrolling each), then
  carries on. The words swap one after the other, never overlapping. A progress line
  under the screens fills with the scroll and a small arrow bobs until the last screen,
  so the pause never reads as stuck. On phones the WhatsApp bar steps aside while a
  scene holds the page. Short laptop screens get tighter type so a scene fits under the
  header. On the features page the same sets turn as they scroll past (`passes` in
  `story.ts`), with nothing pinned.
- **Every change plays**, however fast the page moves, flicks included (owner): when
  scrolling runs ahead, the running change and the ones after it speed up with the
  backlog (about 2x to 4.5x), and the last one lands at normal speed (`sequencer` in
  `story.ts`). Only a jump that carries a scene out of sight (a `#` link, the rail)
  settles it at once, since nobody would see it.
- The **family** (home page, after the pillars) is a scene too: Madar's products as 3D
  objects, one per third of a screen of scrolling (`SPAN`). Scrolling picks the object and turns it;
  GSAP tweens pop objects in and out (`family.ts` drives the shared engine's `stage`).
  The 3D (three.js, ~123 KB brotli) is fetched only when the section is a screen and a
  half away and the page has loaded, draws only while the section is on screen, and
  fades in over the 2D orbit. No WebGL or data saving on: no pin, the orbit and the
  whole list instead. Reduced motion or no JavaScript: the same, with the orbit still.
- The cappuccino pins on desktop only; on phones its steps play while it is on screen.
- Entrances that come up while the page moves fast just finish
  (`flicking` in `story.ts`), so nothing fades in behind a fling.
- A click from another page of the site is a **soft** entry: the page transition
  brings the page in and nothing on screen replays its entrance. Arriving from
  outside (or a reload) plays the hero's entrance.
- Split text by **words only** (letters would break how Arabic joins). Each word rises
  inside a mask that is padded past descenders and Arabic tails and marks
  (`.split-word-mask`); the split stays after the words land, since undoing it can
  re-wrap a heading that fits its line to the pixel. `npm run verify` fails if any
  word's ink would reach outside its mask.
- **Jumps** (a `#` link on the page, a `#` address from elsewhere) never wait on what
  they pass: anything a jump carries the page past finishes at once (`whenSeen`), only
  what is on screen plays.
  Same-page `#` links glide (Lenis, or the browser's smooth scroll on touch); a `#`
  address lands again once the pins have added their length (`landOnHash`).
- Pins are created in page order. ScrollTriggers whose range contains a pin use
  `refreshPriority: -1`, or they end a pin-length too early.

## Screenshots

Masters live in `src/assets/shots/{en,ar}/<id>.webp` (Arabic falls back to English).
Astro makes the responsive WebP sizes at build time. To refresh them after a new
capture, point `scripts/shots.config.json` at the new run and:

```bash
npm run shots -- ~/Desktop/Madar
```

## Share cards

`public/og/{en,ar}-{page}.jpg` (1200×630), committed. The cards show each page's
heading and lead (not its `<title>`), so rerun after changing those:

```bash
npm run og              # every page
npm run og -- contact   # only the pages named
```

A page without its own card uses the home page's.

## Analytics

Umami, cookieless. Off until the build has `PUBLIC_UMAMI_WEBSITE_ID` (and optionally
`PUBLIC_UMAMI_SRC` for a self-hosted script). Buttons carry `data-umami-event`
(`whatsapp`, `call`, `email`, `free-month`, `lang-switch`, …).

## Versions worth knowing

- Vite is pinned to 7 (`@tailwindcss/vite` and Astro 6 need it).
- `../shared` (code shared with the dashboard) is reached through the `@shared` alias;
  Vite resolves its `three` from this package (`resolve.dedupe`), and `astro check`
  type-checks it from the repository's own install.
- TypeScript stays on 6 for `@astrojs/check`.
