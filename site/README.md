# Madar marketing site (get.madar-pos.cloud)

Astro, prerendered to static HTML, in English (`/en/…`) and Arabic (`/ar/…`, RTL).
It replaced the old React landing module (`src/features/landing`, `get.html`,
`vite.get.config.ts`) in October 2026. Decisions and their reasons are in
`~/Desktop/Madar/LANDING_DECISIONS.md`.

## Run it

```bash
cd site
npm ci
npm run dev        # http://localhost:5184/en/
npm run build      # → site/dist
npm run preview
npm run verify     # every page × EN/AR × 4 widths in Chrome, plus the flows (see below)
```

From the repo root, `npm run dev:get` and `npm run build:get` do the same. Node 22.12 or
newer. `verify` and `og` need Chrome: they use your installed Chrome, or set
`CHROME_PATH=/path/to/chrome`.

## Deploy

Same as the dashboard: push a `v*.*.*` tag. `.github/workflows/deploy.yml` builds the
site on Node 22 and copies `site/dist/*` to `/var/www/madar-get`. Old files on the
server are left in place (no delete step), so a deploy never takes the site down, and
the old landing's leftovers (`/screenshots/`, old `/assets/get-*.js`) stay harmless.

### How the server answers today (checked 2026-10-07)

- `/assets/…` is served with a one-year immutable cache, so `astro.config.mjs` puts
  every hashed file (JS, CSS, images, fonts, the Lottie files) in `assets/`.
- Every text file over 1 KB also ships precompressed beside itself, `.br` (brotli 11)
  and `.gz` (gzip 9), as the old landing's build did, for nginx's `brotli_static` and
  `gzip_static`. About 2.9 MB of HTML, JS, CSS, JSON and WASM goes down to 0.7 MB.
- Everything else is `no-store`, and any path that isn't a file gets `/get.html`
  (`try_files $uri /get.html`, no folder lookup). So `/en/pricing/` can't open
  `/en/pricing/index.html` by itself. The build ships the root page as `get.html`
  too, and that page forwards a folder address to its file before anything paints;
  the page then puts the clean address back and links straight to files. It works,
  with one extra hop on the first page of a visit.

**Owner action (optional, removes the hop):** in the get vhost,

```nginx
index index.html;
location / { try_files $uri $uri/ /get.html; }
```

Nothing in the site needs to change after that: the root page notices which file the
server gave it and stops forwarding.

The HTML is meant to be cached at Cloudflare for 5 minutes (a Cache Rule on
`get.madar-pos.cloud`, Edge TTL 5 min, respect origin off for HTML). No purge needed.

## Change things

| What | Where |
|---|---|
| Words (EN and AR) | `src/i18n/en.ts`, `src/i18n/ar.ts` (Arabic is typed against English, so a missing key fails the build) |
| Prices | `pricing.plans` in both copy files |
| Phone, email, socials, dashboard link | `src/lib/site.ts` |
| Home page order | `src/pages/[lang]/index.astro` |
| Screenshots | see below |
| The scroll story | `src/scripts/story.ts` (GSAP: ScrollTrigger, SplitText, DrawSVG; Lenis on mouse/trackpad) |
| An area's screens | `media` and `stepMap` on each `AreaSection` in `src/pages/[lang]/index.astro`: `stepMap` says which screen each step brings up (step 0 is the intro, then one per point) |
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
- An area with several screens is a **scroll-told carousel**: one screen at a time in one
  spot, with a counter, dots and a caption. Nothing pins: the carousel stays in view
  (sticky) while the area's points scroll past, and the point crossing the reading line
  brings up its screen (`areaScene` in `story.ts`). On phones the carousel holds under
  the header and the points scroll beneath it. A fast scroll never cuts a change off
  (`sequencer`); a flick or a jump lands on the right screen at once. The cappuccino
  pins on desktop only; on phones its steps play while it is on screen.
- **Flicks**: entrances that come up while the page moves fast just finish
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
- The pin is created first. ScrollTriggers whose range contains it use
  `refreshPriority: -1`, or they end a pin-length too early.

## Screenshots

Masters live in `src/assets/shots/{en,ar}/<id>.webp` (Arabic falls back to English).
Astro makes the responsive WebP sizes at build time. To refresh them after a new
capture, point `scripts/shots.config.json` at the new run and:

```bash
npm run shots -- ~/Desktop/Madar
```

## Share cards

`public/og/{en,ar}-{page}.jpg` (1200×630), committed. After changing a page title:

```bash
npm run og
```

## Analytics

Umami, cookieless. Off until the build has `PUBLIC_UMAMI_WEBSITE_ID` (and optionally
`PUBLIC_UMAMI_SRC` for a self-hosted script). Buttons carry `data-umami-event`
(`whatsapp`, `call`, `email`, `free-month`, `lang-switch`, …).

## Versions worth knowing

- Vite is pinned to 7 (`@tailwindcss/vite` and Astro 6 need it; `@astrojs/react` 7
  pulls Vite 8, so it stays on 5).
- TypeScript stays on 6 for `@astrojs/check`.
