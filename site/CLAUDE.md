# The marketing site (`site/`): how to work on it

Astro, prerendered, English (`/en/…`) and Arabic (`/ar/…`, RTL); the Free page is `/free/<lang>/`.
`README.md` covers running, deploying, the archive and the agent files; this file is the rules.
Every page is built from one system: the page registry, tokens, one motion engine, the kit.
Never re-implement any of it in a page. Node 22.18 or newer (scripts import `.ts` directly).

## File map

| Where | What |
|---|---|
| `src/lib/pages.ts` | **The page registry**: every page, its path, languages, nav/footer. Routing (`pageHref`), header, footer, hreflang, sitemap, breadcrumbs, agent files, the offline archive and `verify` all read it |
| `src/styles/tokens.css` | **Every** colour, curve, duration, stagger, distance, rhythm, radius and shadow. Change values here only |
| `src/styles/type.css` | type scale (`text-display/h2/h3/lead`, `kicker`), `container-site`, base element styles, Arabic overrides, `.ltr` |
| `src/styles/motion.css` | the first screen's entrance and a `#` address's arrival (CSS), page transitions, the interface's keyframes |
| `src/styles/components.css` | buttons, links, chips, cards, header, dialogs, sticky bar, device frames, `.press`/`.lift`, `.hit` |
| `src/styles/kit.css` | the kit's styles: Section rhythm, plan table, band, check list, data table, steps, the progress line |
| `src/styles/sections/*.css` | one feature each: `menu`, `screens` (MediaStack scenes), `family`, `story`, `roadmap`, `pricing`, `free`, `foodics` (the Foodics walkthrough), `crew` (the characters, their idle keyframes) |
| `src/components/kit/` | the shared page pieces (below) |
| `src/components/crew/` | the crew's figures (owner's artwork) |
| `src/scripts/load-motion.ts` | every page's motion door: imports the engine only when the page has something to move and motion is allowed |
| `src/scripts/motion.ts` | **the one motion engine** (GSAP, Lenis, the vocabulary, set pieces, matchMedia) |
| `src/scripts/story.ts` | the scenes: pins, screens (`carousel.ts`), family (`family.ts`), cappuccino (`barista.ts`), rail, roadmap |
| `src/scripts/foodics.ts` | the Foodics walkthrough (`home/Foodics.astro`, `media/FoodicsStage.astro`): pinned and scrubbed on desktop, played once elsewhere (and on the Free page); its last frame is the page as rendered |
| `src/scripts/crew.ts` | the crew's set pieces and idle life (blink, eyes, wave, hop, lanyard physics) |
| `src/lib/motion.ts` | the motion tokens for scripts, read from the CSS at runtime |
| `src/i18n/{en,ar}.ts` | the hand-built pages' words; Arabic is typed against English (same shape or the build fails) |
| `src/i18n/pages/<key>.ts` | a data page's words, both languages, typed by `src/types/page.ts` |

## Add a page

```bash
npm run new:page -- partners          # registry entry + src/i18n/pages/partners.ts + src/pages/[lang]/partners.astro
npm run new:page -- partners --remove # takes all three out again
```
1. Run the generator. The page is live at `/en/partners/` and `/ar/partners/`, in the footer
   (set `nav: true` in `src/lib/pages.ts` for the header), the sitemap with both
   alternates, hreflang, breadcrumbs, `llms.txt`, its own `index.md`, the archive and `verify`.
2. Write the copy in `src/i18n/pages/<key>.ts`, both languages, replacing every `TODO`. A
   page is its sections: `text`, `grid` (FeatureGrid), `steps` (StepList), `checks`
   (CheckList), `faq` (FaqList + FAQPage JSON-LD), `table` (DataTable), `band` (CtaBand with
   the crew). Links are `{ page }`, `{ to: "whatsapp" | "signup" | "phone" | "email" }` or `{ url }`.
3. A page that needs more (scenes, a price list) is a hand-built file in `src/pages/[lang]/`
   from the kit, its `meta.<key>` in `en.ts`/`ar.ts`, and its registry entry by hand.
4. Optional: its share card (`pages` in `scripts/og.mjs`, then `npm run og -- <key>`; it shows
   the home card until then), a short address in `deploy/nginx/get.madar-pos.cloud`.
5. `npm run build && npm run check && npm run verify`, then look at it in both languages at 390 and 1440.

The build fails, saying what is missing and where, if a registered page has no file or no
copy in one of its languages, or a page file is not registered.

## Tokens

Use the variables, never their values: `--ease-out-expo` (arrivals), `--ease-in-out-quart`
(leaving), `--ease-pop`, `--ease-spring`, `--ease-draw`, `--ease-hop`; `--dur-quick|pop|reveal|intro|draw|wave|hop`;
`--stagger`, `--stagger-word`, `--reveal-y` (and the phone scale: `--reveal-y-phone`,
`--stagger-phone`, `--parallax-phone`); `--gutter`, `--section-y(-tight|-loose)`;
`--radius-card|btn`; `--color-hairline`; `--shadow-float|lift|device`; `--sticker` (the hard
Ink shadow's offset) with `--flip` (-1 in Arabic). Tailwind gets them too (`rounded-card`,
`shadow-float`, `ease-pop`, `border-hairline`). Scripts import `DUR`, `STAGGER`, `REVEAL_Y`,
`EASE`, … from `@/lib/motion`; add one there by reading its CSS variable, never a number.

## Motion: one engine, one vocabulary

`scripts/motion.ts` is the only motion engine and the only importer of GSAP. Mark things up;
never write a page's own reveal keyframes, observers or `requestAnimationFrame` loops
(`npm run check` fails on them).

| Attribute | Does |
|---|---|
| `data-reveal` | rises and fades in as it scrolls in |
| `data-reveal-group` | on a list: its `data-reveal` items rise one after another |
| `data-split` | a heading's words rise from their masks (Section headings do it already) |
| `data-pop` | springs in from scale 0 (ticks, badges, icon roundels); `--delay` waits first |
| `data-draw` | an `<svg>`'s strokes draw (`<Icon draw>`); any other element (a rule) draws along its longer side |
| `data-count` | a figure counts up to the value in the HTML (`CountUp.astro`; Plex Mono, `.ltr`) |
| `data-parallax="0.06"` | drifts that share of its height as its section scrolls; less on phones. Only where it helps |
| `data-light` (`="glow"`) | hero art or a big card: a pre-rendered soft shadow under it (and a glow behind it) that moves with the scroll; only the layers' opacity and transform change |
| `data-sequence="name"` | a set piece: the timeline `defineSequence("name", build)` makes, played as it comes in, paused off screen, resumed when back. `{ scrub: true }`: the scroll drives it instead (its start state must be the page as rendered). Built in: `step`, `band`, `hero` (scrubbed: a first section scrolling away at three depths, the orbit, `[data-hero-copy]`, `[data-hero-media]`; kit intros get it unless `sticky`); crew.ts: `figure`, `receipt` |
| `data-intro` + `style="--i:n"` | the first screen's entrance, CSS, with the first paint (Section/Hero `intro` does it) |

- One `gsap.matchMedia()`: motion allowed arms `.crew-armed` and the vocabulary, with the
  phone-scaled feel below 768 px (phones keep every moment); reduced motion gets nothing
  and reverts what played.
- The engine is lazy: `load-motion.ts` imports it only when the page has motion markup and
  motion is allowed. Reduced motion, no JavaScript, or a page with nothing to move: no GSAP,
  and every page complete and still. What is on screen when the engine starts is settled
  (left as it is); only what scrolls in later plays. The crew's figures always play.
- Timing hooks read from the CSS: `--delay` and `--stagger` on an element or a parent.
- Scenes (pins) live in `story.ts` (the Foodics walkthrough in `foodics.ts`, set up right after
  them) and are set up before the vocabulary; they use the
  engine's `gsap`, `ScrollTrigger`, `whenSeen`, `jump` and tokens. One ticker: Lenis runs on
  it, crew physics too (`gsap.ticker.add`). Only the shared 3D engine (`../shared/showcase`,
  also the dashboard's) keeps its own frame loop, on screen only.
- Animate `transform`, `opacity`, `scale` only. Nothing may shift layout (verify with a
  PerformanceObserver: zero `layout-shift` entries).
- Hover and press: `.press` (dips, springs back), `.lift` (lifts on a real pointer, dips on
  press, and the engine tips it toward the pointer); buttons press by themselves, and the
  engine pulls `.btn-lg` and a band's button toward a nearing pointer. Never hand-write
  hover transforms. The header condenses (CSS, `data-solid`) and carries the progress line.
- Load: nothing is painted and then hidden. The first screen's entrance fades from 0; the
  crew's figures, badges and receipt wait behind `.crew-wait` (set by `classic/boot.js`
  before the first paint, lifted by the engine once their entrances are built).

## The kit (`src/components/kit/`)

- **`Section`**: every section. `id`, `tone` (`paper|surface|ink`), `kicker`, `title`,
  `titleId` (default `${id}-title`, for `aria-labelledby`), `lead`, `intro`, `size`
  (`display|h2|h3`), `split` (`4|5|6` head columns from lg), `sticky`, `center`, `pad`
  (`standard|tight|loose|none`), `rule`, `orbit` (classes placing the orbit motif), `label`
  (no title), `headClass`. Slots: default (content), `head` (under the lead), `mark` (over the kicker).
  `SectionHead` is its head alone, for a scene that can't be a Section.
- **`Hero`**: a page's first section (`Section intro`): `title`, `kicker`, `lead`, `tone`,
  `orbit`, `split`, `sticky`, `size`; slot `actions` (one button, a link), default (beside or under).
- **`FeatureGrid`**: `items: {title, body}[]`, `columns` (2|3|4), `numbered`, `variant` (`rule|card`), `tone`, `size`, `as`.
- **`StepList`**: `items: {title, body}[]`, `columns` (3|4); slots `step-0`, `step-1`, … under a step.
- **`PlanTable`**: two plans, the second a superset. `id`, `columns: [a, b]`, `plans?`
  (`{name, size?, price}`), `groups: {title?, icon?, rows}[]`, `adds`, `copy: {inFirst, adds, tag}`,
  `more?`; slot `peek`. Free/Paid on the Free page, Essential/Advanced on pricing.
- **`CtaBand`**: `title`, `kicker?`, `body?`, `price?` (`{amount, per}`), `cta`, `more?`; slot `crew`.
- **`CheckList`**: `items`, `ruled?`. **`FaqList`**: `items: {q, a}[]` (pair it with `faqPage()`).
  **`DataTable`**: wrap a `<table>`; `label`. **`CrewMoment`**: `pose`, `class`, `host?`.
- **`Page`**: renders a data page from its copy. **`Words`**, **`CountUp`**, **`LedgerBeams`**.

## The crew

Place a character by name: `<CrewMoment pose="wave|joy|count|cup|pot|slice|slice-joy" class="…" />`
(`cup` needs a light ground, `pot` an Ink one). Sizes and places live in `sections/crew.css`.
The figures are the owner's Illustrator exports: never redraw, never mirror in Arabic. A
new pose keeps the rig: one `<svg data-crew data-sequence="figure" aria-hidden="true">`;
groups `.crew-shadow`, `.crew-hop` (with its `transform-origin` at the feet), `.crew-body`,
`.crew-blink` (each eye, origin at its centre) holding `.crew-pupil`, `.crew-mouth`, and the
arms as `.crew-wave` / `.crew-arm-rest` / `.crew-flap(-end)` with `.crew-motion` lines;
`.crew-steam` / `.crew-sip` loop only while on screen (`data-live`); `data-joy` jumps on
arrival; شريحة's slice is a `.crew-sweep` mask with `.crew-limb` parts. Add it to `CrewMoment`.

## Rules in force

- No React, no `client:` islands. CSP is `script-src 'self'`: no inline `<script>` (JSON-LD
  aside), no `on*=` attributes; scripts are modules or `scripts/classic/*?url&no-inline`.
- Reduced motion and no JavaScript show everything, complete and still (`REDUCED=1 npm run verify`).
- Arabic is first class: logical properties (`start`/`end`, `inset-inline`, `ms-`/`me-`),
  `--flip` for anything that leans with the reading direction; characters are never mirrored.
  In Arabic prose say صفر / ولا, never a bare 0; figures and prices sit in Plex Mono in `.ltr`.
- Claims match the product (`MadarRust/authz/spec/plans.toml`): Free is one branch, one till,
  POS, reports and the floor; it has no inventory or recipes, online ordering, loyalty,
  bookings, kitchen screens, waiter handhelds, Dawam, branding or Basira.
- No layout shift: fonts preloaded (BaseLayout), sizes reserved, motion on transform/opacity.
- Tap targets 44 px (`.hit` gives a small link an invisible 44 px area); no horizontal
  overflow at 360 px.
- `downloads/` is a separate site: never import from `site/` there.

## Verify

```bash
npm run build && npm run check && CHROME_PATH=… npm run verify && CHROME_PATH=… REDUCED=1 npm run verify
```
`check` type-checks and runs `scripts/lint-motion.mjs` (keyframes, GSAP imports, rAF loops,
set pieces, tokens). `verify` loads every registered page × language × width in Chrome
(overflow, console errors, one `<h1>`, meta and hreflang, cut-off split words), the flows,
and the offline archive. Look at the screenshots in `node_modules/.verify/`.
