---
name: Madar Dashboard
description: A bilingual, ledger-honest management system for F&B operators — warm precision in the tool, editorial warmth on the brand.
colors:
  harbor-navy: "oklch(0.27 0.05 250)"
  terracotta-clay: "oklch(0.58 0.132 38)"
  linen-cream: "oklch(0.985 0.004 85)"
  card-white: "oklch(1 0 0)"
  leaf-green: "oklch(0.45 0.07 165)"
  muted-stone: "oklch(0.965 0.006 85)"
  muted-ink: "oklch(0.52 0.02 255)"
  border-sand: "oklch(0.91 0.008 80)"
  success: "oklch(0.55 0.1 160)"
  warning: "oklch(0.76 0.15 75)"
  destructive: "oklch(0.585 0.22 27)"
  info: "oklch(0.6 0.13 240)"
typography:
  display:
    fontFamily: "IBM Plex Sans Arabic, IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3.25rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "IBM Plex Sans Arabic, IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "IBM Plex Sans Arabic, IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "IBM Plex Sans Arabic, IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "IBM Plex Sans Arabic, IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
  numeric:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    fontFeature: "tabular-nums"
rounded:
  sm: "0.5rem"
  md: "0.625rem"
  lg: "0.75rem"
  xl: "1rem"
  full: "9999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.harbor-navy}"
    textColor: "{colors.linen-cream}"
    rounded: "{rounded.md}"
    height: "2.25rem"
    padding: "0 1rem"
  button-brand:
    backgroundColor: "{colors.terracotta-clay}"
    textColor: "{colors.linen-cream}"
    rounded: "{rounded.md}"
    height: "2.25rem"
    padding: "0 1rem"
  button-outline:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.harbor-navy}"
    rounded: "{rounded.md}"
    height: "2.25rem"
    padding: "0 1rem"
  button-ghost:
    textColor: "{colors.harbor-navy}"
    rounded: "{rounded.md}"
    height: "2.25rem"
    padding: "0 1rem"
  card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.harbor-navy}"
    rounded: "{rounded.xl}"
    padding: "1.5rem"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.harbor-navy}"
    rounded: "{rounded.md}"
    height: "2.25rem"
    padding: "0.25rem 0.75rem"
  stat-card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.harbor-navy}"
    rounded: "{rounded.xl}"
    padding: "1.5rem"
---

# Design System: Madar Dashboard

## 1. Overview

**Creative North Star: "The Warm Ledger"**

Madar is an honest accounting book bound in warm materials. Every figure is precise, auditable, and ledger-true — orders, shifts, and inventory are append-only, so the interface never implies a mutation the system can't make. But the surface is hospitable, not clinical: this is a tool for someone's livelihood in F&B, and it should feel like the warm front counter of a good coffee shop, not a grey ERP terminal. Harbor Navy carries trust, Terracotta Clay carries warmth, and Linen Cream carries hospitality.

The system speaks in two complementary volumes, dictated by register. In the **authenticated dashboard** (product) the voice is quiet, professional, and precise — restraint is the feature, density is welcome where operators need it, and the tool disappears into the task. On the **customer surfaces** (brand) — the marketing landing, public ordering at `/order/:orgId`, order tracking at `/track/:id` — the voice turns bold and editorial, carried by weight, scale and confident terracotta rather than a second typeface. Never borrow dashboard flatness for the landing page, or landing-page flourish for a data table.

Everything is bilingual by symmetry. Arabic is a peer of English, not a translation — and since one superfamily carries both, they are literally the same face: layouts use logical properties so they flip cleanly for RTL, numerals localize to `ar-EG`, and dates anchor to Africa/Cairo. A screen that only reads right in one direction is unfinished. Color is the entire OKLCH semantic system in `src/styles/globals.css` — **never raw hex in components**.

**Key Characteristics:**
- **Ledger-honest** — append-only reality is reflected in the UI; no fake edit/delete affordances.
- **Warm precision** — navy/terracotta/cream warmth over tabular-number accuracy.
- **Two volumes, one system** — restrained product UI, bold editorial brand surfaces.
- **Bilingual by symmetry** — EN/AR parity, logical properties, `ar-EG` numerals, Cairo dates.
- **Token-driven** — semantic OKLCH tokens; class-driven dark mode; no hardcoded color.

## 2. Colors

A warm, coastal-F&B palette — sea, clay, and linen — disciplined into a full OKLCH semantic system that ramps cleanly into a deep-navy dark mode. Colors are expressed in OKLCH (project doctrine: never raw hex in components; consume the semantic Tailwind tokens).

### Primary
- **Harbor Navy** (`oklch(0.27 0.05 250)`): The ink of the system — body text, headings, and the primary action color (`--primary`) in light mode. Trust, authority, the color you read the numbers in. In **dark mode the primary flips to Terracotta Clay** so the pop comes from warmth, not a blinding navy.

### Secondary
- **Terracotta Clay** (`oklch(0.58 0.132 38)`): The brand accent (`--brand`), CTA highlight, and focus ring (`--ring`). Hospitality and emphasis. Used on primary CTAs, the active sidebar marker, selection, and the chart lead color — **not** decoration. In dark mode it brightens (`oklch(0.64 0.14 40)`) and becomes the primary.

### Tertiary
- **Leaf Green** (`oklch(0.45 0.07 165)` / success `oklch(0.55 0.1 160)`): The deep brand green, used for the second categorical chart hue and the `success` status. Quiet, grounded, never neon.

### Neutral
- **Linen Cream** (`oklch(0.985 0.004 85)`): The app background (`--background`) — a warm near-white at very low chroma. It is *disciplined* warmth, never drifting into "parchment."
- **Card White** (`oklch(1 0 0)`): Pure-white card and popover surfaces (`--card`, `--popover`) that lift one tonal step off the linen background.
- **Muted Stone** (`oklch(0.965 0.006 85)`): Secondary/muted fills (`--secondary`, `--muted`) — chips, toolbars, inactive surfaces.
- **Muted Ink** (`oklch(0.52 0.02 255)`): Secondary text (`--muted-foreground`). Note: at AAA this must be reserved for genuinely secondary copy; never run primary body text at this lightness on Linen Cream.
- **Border Sand** (`oklch(0.91 0.008 80)`): Hairline borders and input strokes (`--border`, `--input`).

### Status
- **Destructive** (`oklch(0.585 0.22 27)`): voids, force-close, delete-reversals, errors.
- **Warning** (`oklch(0.76 0.15 75)`): low-stock, attention-needed.
- **Info** (`oklch(0.6 0.13 240)`): neutral informational state.

### Named Rules
**The One-Voice Accent Rule.** Terracotta Clay is the single brand accent. On any dashboard screen it should touch ≤10% of the surface — a CTA, the active nav marker, a focus ring, the lead chart series. Its rarity is what makes it read as *the* action. Flood a dashboard with terracotta and you've built a delivery-app promo banner.

**The Dark-Mode Inversion Rule.** Navy is the light-mode primary; terracotta is the dark-mode primary. Brand panels (`brand-panel`, auth) must stay deep navy in dark mode and let terracotta live only in blurred accent glows — a full-saturation terracotta panel in the dark is blinding.

**The No-Color-Alone Rule.** Status is never encoded in color alone. Pair every status color with an icon or label (order/shift status, chart legends), so it survives color-blindness and grayscale.

## 3. Typography

**Body / UI / Display Font:** IBM Plex Sans Arabic (with IBM Plex Sans, system-ui fallback)
**Numeric Font:** IBM Plex Mono (with `ui-monospace` fallback)
**Arabic Font:** the same — IBM Plex Sans Arabic leads the stack in both directions

**Character:** One superfamily, not a pairing. The Arabic cut carries Latin as
well as Arabic, so a bilingual row — an Arabic item name beside a Latin size
label — sits on one skeleton instead of two faces meeting in the middle of it.
That is also why there is no RTL font swap: nothing changes when the direction
does. Figures go to the monospaced cut of the same family, so a column of
totals lines up without the digits looking borrowed from somewhere else.

There is deliberately **no display serif**. The product used to pair Fraunces
with Inter and reserve the serif for brand surfaces; it now speaks in one voice
everywhere. `font-serif` still resolves — to the same stack — so the class
survives on the fifty-odd brand surfaces that use it without each one needing
to be edited, but it selects nothing different.

All four weights are static (400/500/600/700), which is the whole of what the
interface uses; nothing asks for 800 or 900. Only the **latin and arabic
subsets** are imported. The bare `400.css` entries pull Cyrillic, Greek and
Vietnamese too — most of a megabyte of glyphs this product has no text for,
downloaded on a phone over whatever connection the shop has.

### Hierarchy
- **Display** (600, brand headlines — public ordering, landing hero moments).
- **Headline** (600, 1.5rem, line-height 1.2): Dashboard page titles (`PageHeader`). Fixed rem — product headings don't fluid-scale.
- **Title** (600, 1.125rem): Card titles, section headers, dialog titles.
- **Body** (400, 0.875rem, line-height 1.5): The dashboard's default text size. Prose caps at 65–75ch; dense tables may run wider.
- **Label** (500, 0.75rem): Buttons, form labels, badges, table headers.
- **Numeric** (IBM Plex Mono, 500–600, tabular): All money, counts, and metrics. Money is piastres→EGP; Arabic uses `ar-EG` numerals.

### Named Rules
**The Mono-Means-Tabular Rule.** `font-mono` and `tabular-nums` both switch on
`font-variant-numeric: tabular-nums`, so asking for the mono face IS asking for
aligned figures. There is no reason to want one without the other, and two
names for the same intent is how half a table ends up ragged.

**The Fixed-Scale Rule.** Dashboard type uses a fixed rem scale (≈1.125–1.2 ratio), never `clamp()`. A heading that shrinks inside a sidebar looks worse, not responsive. Fluid type is a brand-surface privilege.

## 4. Elevation

Hybrid, register-aware. The **dashboard is essentially flat**: depth comes from tonal layering (Card White lifting one step off Linen Cream) and hairline Border Sand strokes, with at most a whisper of shadow. The **brand surfaces are lifted**: soft ambient shadows and blurred terracotta/navy gradient glows give the hero and customer cards atmosphere. In dark mode, borders become low-opacity white (`oklch(1 0 0 / 10%)`) and tonal contrast does the lifting instead of shadow.

### Shadow Vocabulary
- **Hairline** (`shadow-xs` ≈ `0 1px 2px rgb(0 0 0 / 0.05)`): Inputs, outline buttons — barely there, just enough to seat the control.
- **Resting card** (`shadow-sm` ≈ `0 1px 3px rgb(0 0 0 / 0.08)`): Cards and StatCards at rest. The maximum the dashboard should carry.
- **Lifted / floating** (`shadow-lg`/`shadow-xl`): Popovers, command palette, dialogs, and brand-surface hero imagery only.
- **Brand glow** (`blur-2xl` on a `from-primary/15` gradient layer): Decorative atmosphere behind marketing/auth/public-ordering heroes. Never on dashboard data.

### Named Rules
**The Flat-Dashboard Rule.** A dashboard surface never carries more than `shadow-sm` at rest. If a card looks like it's hovering above the page while idle, the shadow is wrong. Elevation in the product is a *response to state* (hover, focus, open), not a resting decoration.

## 5. Components

The dashboard component vocabulary is **refined and restrained** — quiet shadcn discipline on the unified `radix-ui` package, calm and predictable, so the control disappears into the task. Same button shape, same form-control vocabulary, same icon family (Lucide) on every screen.

### Buttons
- **Shape:** Gently curved (`rounded-md`, 0.625rem). Default height `h-9` (2.25rem); sizes `xs`/`sm`/`lg` and matching `icon*` variants.
- **Primary:** Harbor Navy fill, Linen Cream text (`bg-primary`), `padding 0 1rem`. Hover darkens to `primary/90`.
- **Brand:** Terracotta Clay fill (`bg-brand`) — reserved for the single most important CTA on a surface. Hover `brand/90`.
- **Outline / Secondary / Ghost:** Outline = Card White + Border Sand + `shadow-xs`; Secondary = Muted Stone fill; Ghost = transparent, tinting `accent` on hover. Link = navy underline-on-hover.
- **States:** Focus shows a 3px terracotta ring (`focus-visible:ring-ring/50` + `ring-[3px]`). Disabled drops to 50% opacity. A `loading` prop swaps in a spinning Lucide `Loader2` and disables the control. `aria-invalid` shifts the border/ring to Destructive.

### Cards / Containers
- **Corner Style:** `rounded-xl` (1rem) — the softest radius in the system, signature to cards.
- **Background:** Card White on Linen Cream; one tonal step of lift.
- **Border:** 1px Border Sand (`border`). In dark mode, low-opacity white.
- **Shadow Strategy:** `shadow-sm` at rest (see Elevation — the Flat-Dashboard Rule caps it here).
- **Internal Padding:** `1.5rem` (`py-6`, `gap-6`). Title is `font-semibold leading-none`; description is `text-sm text-muted-foreground`.

### Inputs / Fields
- **Style:** `h-9`, `rounded-md`, 1px Border Sand stroke, transparent background, `shadow-xs`. **16px font on viewports ≤768px** to defeat iOS auto-zoom (enforced globally in `globals.css`).
- **Focus:** Border shifts to terracotta `ring` + a 3px `ring/50` glow. No layout shift.
- **Error / Disabled:** `aria-invalid` → Destructive border + ring. Disabled → 50% opacity, `not-allowed` cursor. Placeholder uses Muted Ink (must still clear contrast on Linen Cream).

### Navigation (App Sidebar)
- **Style:** A **permanent deep-navy rail** (`--sidebar` ≈ `oklch(0.24 0.038 256)` light, `oklch(0.18 0.028 252)` dark) in *both* themes — it frames the linen content and echoes the auth/brand panel. Collapses to icons on desktop, becomes a Sheet on mobile. The brand mark sits in a hairline-ringed chip so it reads on navy.
- **States:** Inactive items are Sidebar Foreground (light text on navy); hover is a quiet lighter-navy wash (`sidebar-accent`); the **active item is a distinct Terracotta Clay pill** — `sidebar-primary/15` fill + terracotta text — clearly separated from hover (the canonical shadcn sidebar makes active == hover; we override it). Active state is role-gated by `usePermissions`. Group labels are quiet, muted (`text-sidebar-foreground/45`).
- **Typography:** `text-sm`; the brand wordmark at `text-base font-semibold`.

### StatCard (signature component)
A dashboard KPI tile: a small rounded icon chip tinted with a semantic accent at 10% (`bg-{accent}/10 text-{accent}` — brand, primary, success, warning, info, destructive), a label, a large **tabular** value that compacts (1.2M / 4.5K) with the full figure in a tooltip/popover, and an optional signed trend (`ArrowUpRight`/`ArrowDownRight`). A `dense` mode tightens padding for crowded mobile grids. This is the canonical "trust the numbers" surface — precision and disclosure over flourish.

## 6. Do's and Don'ts

### Do:
- **Do** consume semantic tokens (`bg-background`, `text-foreground`, `bg-brand`, `bg-card`) — **never raw hex** in components. The OKLCH system in `globals.css` is the single source of truth.
- **Do** use logical properties everywhere (`ps/pe`, `ms/me`, `start/end`, `text-start/end`). Every layout must flip cleanly for Arabic RTL; test in both directions.
- **Do** keep Terracotta Clay to ≤10% of any dashboard screen — CTA, active nav, focus ring, lead chart series (the One-Voice Accent Rule).
- **Do** render money with the `.tabular` numeral utility and `fmtMoney`; respect piastres→EGP, `ar-EG` numerals, and Africa/Cairo dates.
- **Do** use the mono cut for every figure, so money and ids align down a column (the Mono-Means-Tabular Rule).
- **Do** pair every status color with an icon or label (the No-Color-Alone Rule) and push body contrast toward AAA (≥7:1) on Linen Cream.
- **Do** reflect the append-only ledger: surface voids, force-closes, and compensating reversals as first-class events.
- **Do** give every interactive component its full state set — default, hover, focus-visible (3px terracotta ring), active, disabled, loading, error — and respect `prefers-reduced-motion`.

### Don't:
- **Don't** drift Linen Cream into the **generic SaaS-cream template**: no cream/sand body with gradient hero-metric cards, identical icon-card grids, or tiny tracked-uppercase eyebrows above every section.
- **Don't** make discounts or delivery scream — no **loud delivery-app neon**, flashing promo banners, or garish discount badges. Configure them soberly.
- **Don't** let the dashboard decay into an **enterprise-grey snoozefest** — density is welcome, deadness is not; keep the warm navy/terracotta/cream hierarchy.
- **Don't** go **consumer toy-like** — no bubbly oversized rounded shapes, no emoji-heavy UI; this handles money and operations and must read as credible.
- **Don't** put a display serif, fluid `clamp()` heading, or decorative motion into dashboard data, labels, or buttons.
- **Don't** float a resting card above `shadow-sm`, or flood a brand panel with full-saturation terracotta in dark mode.
- **Don't** invent affordances for standard tasks (custom scrollbars beyond the themed default, non-standard modals); reach for inline/progressive patterns before a modal.
- **Don't** imply a mutation the backend can't make — no fake "edit" or "delete" on orders, shifts, or inventory adjustments.
