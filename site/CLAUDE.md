# The marketing site (`site/`): how to work on it

Astro, prerendered, English (`/en/…`) and Arabic (`/ar/…`, RTL); the Free page is `/free/<lang>/`.
`README.md` covers running, deploying, the archive, the agent files and the motion story; this
file is the rules. Every page is built from one design system: tokens, one motion vocabulary,
the kit's components. Never re-implement any of it in a page.

## File map

| Where | What |
|---|---|
| `src/styles/tokens.css` | **Every** colour, curve, duration, stagger, distance, rhythm, radius and shadow. Change values here only |
| `src/styles/type.css` | type scale (`text-display/h2/h3/lead`, `kicker`), `container-site`, base element styles, Arabic overrides, `.ltr` |
| `src/styles/motion.css` | the reveal vocabulary, the first screen's entrance, page transitions, and every `@keyframes` (bar the crew's) |
| `src/styles/components.css` | buttons, links, chips, cards, header, dialogs, sticky bar, device frames, `.hit` |
| `src/styles/kit.css` | the kit's styles: Section rhythm, plan table, call-to-action band, check list, data table |
| `src/styles/sections/*.css` | one feature each: `menu` (phone menu), `screens` (MediaStack scenes), `family`, `story` (rail, barista), `roadmap`, `pricing` (price list), `free` (Free page), `crew` (the characters and their motion) |
| `src/components/kit/` | the shared page pieces (below) |
| `src/components/crew/` | the crew's figures (owner's artwork; never redraw, never mirror) |
| `src/components/{home,features,free,media,layout,ui}/` | pieces one page or the frame uses |
| `src/scripts/motion.ts` | the motion switch (`.crew-armed`) and the one `data-in` observer |
| `src/lib/motion.ts` | the motion tokens for scripts, read from the CSS at runtime |
| `src/scripts/story.ts` | GSAP: `data-reveal`, `data-split`, scenes, pins, counts |
| `src/scripts/crew.ts` | the crew's character motion only (blink, wave, hop, swing) |
| `src/i18n/{en,ar}.ts` | all words; Arabic is typed against English (same shape or the build fails) |
| `src/lib/site.ts`, `src/lib/schema.ts` | links, page paths, JSON-LD |

## Tokens

Use the variables, never their values: `--ease-out-expo` (arrivals), `--ease-in-out-quart`
(leaving), `--ease-pop`, `--ease-spring`, `--ease-draw`, `--ease-hop`; `--dur-quick|pop|reveal|intro|draw`;
`--stagger`, `--stagger-word`, `--reveal-y`; `--gutter`, `--section-y(-tight|-loose)`;
`--radius-card|btn`; `--color-hairline`; `--shadow-float|lift|device`; `--sticker` (the hard
Ink shadow's offset) with `--flip` (-1 in Arabic). Tailwind gets them too (`rounded-card`,
`shadow-float`, `ease-pop`, `border-hairline`). Scripts import `DUR`, `STAGGER`, `REVEAL_Y`,
`EASE` from `@/lib/motion`; add a token there by reading its CSS variable, never a number.

## Motion: one vocabulary

Mark it up; never write a page's own reveal keyframes or observers (`npm run check` fails).

| Attribute | Does | Use for |
|---|---|---|
| `data-reveal` | rises and fades in as it scrolls in (GSAP) | any line, card, block below the first screen |
| `data-reveal-group` | its `data-reveal` items rise one after another | lists, card grids |
| `data-split` | a heading's words rise from their masks | every h2/h3 a Section doesn't already split |
| `data-pop` | springs in from scale 0 | ticks, badges, icon roundels inside revealed rows |
| `data-draw` | an `<svg>`'s strokes draw (`<Icon draw>`); any other element draws across, or down with `="down"` | checks, rules, lines |
| `data-intro` + `style="--i:n"` | the first screen's entrance, in CSS with the first paint | only in an intro (Section `intro` does it) |

- Timing: `--delay` on the element or a parent waits; things that come in together are spaced
  by `--stagger` (set it on a parent for a slower beat, as the crew's duty list does).
- `.crew-armed` (set by `scripts/motion.ts` when motion is allowed) is the only gate: the CSS
  may hold something back only behind it. No JavaScript or reduced motion: every page is
  complete and still. What is on screen when the script starts is settled (`data-in="still"`),
  never hidden and replayed.
- Animate `transform` and `opacity` (and `scale`) only; loops run only on screen
  (`onScreen()`, `data-live`); rAF only while visible.
- Character motion (the crew) stays in `crew.ts` / `sections/crew.css`, timed by the tokens.

## The kit (`src/components/kit/`)

- **`Section`**: every section. Props: `id`, `tone` (`paper|surface|ink`), `kicker`, `title`,
  `titleId` (default `${id}-title`, used for `aria-labelledby`), `lead`, `intro` (the page's
  first section: `<h1>`, CSS entrance, clears the header), `size` (`display|h2|h3`), `split`
  (`4|5|6` columns for the head from lg), `sticky`, `center`, `pad` (`standard|tight|loose|none`),
  `rule`, `orbit` (classes placing the orbit motif), `label` (no title), `headClass`. Slots:
  default (content), `head` (under the lead), `mark` (over the kicker). `SectionHead` is its
  head alone, for a scene that can't be a Section.
- **`PlanTable`**: two plans, the second a superset. `id`, `columns: [a, b]`, `plans?` (cards:
  `{name, size?, price}`), `groups: {title?, icon?, rows}[]`, `adds`, `copy: {inFirst, adds, tag}`,
  `more?`; slot `peek` (a crew figure on the "In" card). Free/Paid on the Free page, Essential/
  Advanced on pricing. Phones: tiles + "In" card + "Adds" card; from md: cards + matrix.
- **`CtaBand`**: the dark strip with one button. `title`, `kicker?`, `body?`, `price?`
  (`{amount, per}`), `cta`, `more?`; slot `crew` (`.cta-band-shariha`, `.cta-band-nuqta`).
- **`CheckList`**: `items`, `ruled?`; ticks pop, checks draw.
- **`FaqList`**: `items: {q, a}[]`; pair it with `faqPage(lang, items)` in the JSON-LD.
- **`DataTable`**: wrap a `<table>`; `label`. Scrolls in its box, sticky first column, edge fade.
- **`Words`**, **`CountUp`**, **`LedgerBeams`**: the intro's split heading, a counting figure, the ledger diagram.

## Add a page

1. `src/lib/site.ts`: add the key to `PageKey` and `PAGE_PATH` (and `isEnglishOnly` if so).
2. `src/i18n/en.ts` and `ar.ts`: `meta.<key>` (title, description) and the page's copy, same shape.
3. `src/pages/[lang]/<key>.astro`: `getStaticPaths` over `LANGS`, `<BaseLayout page="<key>" jsonLd={[breadcrumbs(lang, "<key>"), …]}>`,
   then `<Section intro …>` and more `Section`s from the kit. No page `<style>` for anything the
   kit or tokens cover; no `<script>` beyond importing `@/scripts/crew` if it shows the crew.
4. `src/lib/schema.ts`: the page's name in `breadcrumbs`; more JSON-LD if it has FAQs or an offer.
5. Nav: `Header.astro` (and the phone menu), `Footer.astro`.
6. `scripts/agent-files.mjs` `ORDER` (its Markdown and `llms.txt` place); the sitemap takes
   `/en|ar/` pages by itself (other paths: `serialize` in `astro.config.mjs`).
7. `scripts/og.mjs` `pages`, then `npm run og -- <key>`; `scripts/verify.mjs` `pages`; a short
   address in `deploy/nginx/get.madar-pos.cloud` if it needs one.
8. Verify (below), both languages, 390 and 1440.

## Rules in force

- No React, no `client:` islands. CSP is `script-src 'self'`: no inline `<script>` (JSON-LD
  aside), no `on*=` attributes; scripts are modules or `scripts/classic/*?url&no-inline`.
- Reduced motion and no JavaScript show everything, complete and still.
- Arabic is first class: logical properties (`start`/`end`, `inset-inline`, `ms-`/`me-`),
  `--flip` for anything that leans with the reading direction; characters are never mirrored.
  In Arabic prose say صفر / ولا, never a bare 0; figures and prices sit in Plex Mono in `.ltr`
  (Plex Sans Arabic's 0 reads as ٥).
- Claims match the product (`MadarRust/authz/spec/plans.toml`): Free is one branch, one till,
  POS, reports and the floor; it has no inventory or recipes, online ordering, loyalty,
  bookings, kitchen screens, waiter handhelds, Dawam, branding or Basira.
- No layout shift: fonts preloaded (BaseLayout), sizes reserved, motion on transform/opacity.
- Tap targets 44 px (`.hit` gives a small link an invisible 44 px area); no horizontal
  overflow at 360 px.
- `downloads/` is a separate site: never import from `site/` there.

## Verify

```bash
npm run build && npm run check && CHROME_PATH=… npm run verify
```
`check` type-checks and runs `scripts/lint-motion.mjs` (keyframes, `data-in`, tokens in their
one place). `verify` loads every page × language × width in Chrome (overflow, console errors,
one `<h1>`, meta, cut-off split words), the flows, and the offline archive. Look at the
screenshots it leaves in `node_modules/.verify/` before calling a change done.
