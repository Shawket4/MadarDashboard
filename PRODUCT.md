# Product

## Register

This project is **evenly split** across both registers — neither leads by default. Choose per surface:

- **Product** (design serves the task) — the authenticated management dashboard: orders, analytics, inventory, menu & recipe costing, shifts, delivery, permissions, settings, onboarding. The operator is mid-task; the tool should disappear into the work. Use `reference/product.md`.
- **Brand** (design is the product) — the unauthenticated customer surfaces: the marketing landing page, public ordering at `/order/:orgId`, and order tracking at `/track/:id`. These are someone's first impression of a coffee shop; they should feel hospitable and have a voice. Use `reference/brand.md`.

When a task doesn't name a surface, infer from the route/file in focus before defaulting. If it's genuinely ambiguous, ask rather than assume.

## Users

Two first-class authenticated audiences for the dashboard, weighted equally:

- **Org admin / multi-branch owner** — oversees several branches. Needs cross-branch rollups, comparisons, costing/margin visibility, and confidence that the numbers are trustworthy enough to act on.
- **Single-branch manager** — runs one location day to day: orders, shifts, inventory counts, menu upkeep. Wants routine work to be fast and unambiguous.

Tellers are **not** a primary audience here — they live in the Flutter POS (`madar_pos`); this dashboard is the management layer above it.

A third audience belongs to the brand surfaces: **end customers / diners** browsing a public menu, placing an order, and tracking it. They arrive with no training, often on a phone, possibly in Arabic, possibly on a poor connection.

Context of use: real F&B operations in Egypt — bilingual (English + Arabic, RTL is native not bolted on), money in Egyptian piastres, everything anchored to Africa/Cairo time. Often used alongside the POS during a live shift, sometimes desktop, sometimes the Tauri app, sometimes mobile.

## Product Purpose

Madar is a bilingual platform for running a coffee shop end to end. The dashboard is the management brain: point-of-sale records, menu and recipe **costing**, inventory (append-only adjustments, transfers, stocktakes), shift lifecycle, order history and voids, delivery configuration, multi-branch analytics, and per-user permissions. The customer-facing surfaces let a diner discover the menu, order, and track fulfilment.

It exists because operators were running on spreadsheets and a register: this replaces that with one trustworthy, bilingual, offline-tolerant system that ties what's sold to what it costs. Success is three things at once, not one:

- **Confident control** — the owner trusts the numbers and can act fast; nothing hidden, nothing ambiguous, ledger-honest.
- **Effortless daily ops** — managers breeze through routine work; the tool disappears into the task.
- **Decision clarity** — analytics and costing surface what to do next: what's selling, what's bleeding margin, where to act.

## Brand Personality

**Quiet in the tool, bold on the brand.** Two complementary modes, not a contradiction:

- In the **dashboard**, the voice is calm, professional, and precise. Restraint is the feature. It should read as a serious tool for someone's livelihood — never flashy, never decorative for its own sake.
- On the **customer surfaces**, the voice is bold and characterful: an editorial, hospitable warmth carried by the Fraunces display serif, terracotta, and confident type. This is where Madar has personality.

Across both: **warm precision**. Navy carries trust, terracotta carries warmth, cream carries hospitality. The throughline is honesty — money is real, the ledger is real, Arabic is a peer language. Three-word feel: **trustworthy, hospitable, precise.**

## Anti-references

This must NOT look like any of these:

- **Generic SaaS-cream template** — the AI-slop dashboard: cream/sand body background, gradient hero-metric cards, identical icon-card grids, tiny tracked-uppercase eyebrows above every section. (Note: the dashboard already uses a near-white warm-neutral surface; keep it disciplined and token-driven, never let it drift into the "parchment" cliché.)
- **Loud delivery-app neon** — oversaturated food-delivery gradients, flashing promo banners, garish discount badges. Discounts and delivery are configured here soberly, not screamed.
- **Enterprise-grey snoozefest** — sterile, lifeless, all-grey admin panel with no warmth or hierarchy (old SAP/ERP energy). Density is welcome; deadness is not.
- **Consumer toy-like** — bubbly oversized rounded shapes, emoji-heavy, playful to the point of not feeling credible for money and operations.

## Design Principles

1. **Ledger-honest.** The backend is append-only: orders and shifts can't be edited or deleted, inventory reverses with compensating entries, voids go through a dedicated action. The UI must never imply a mutation it can't make — surface voids, force-closes, and reversals as first-class events, never fake an "edit" button for flavor.
2. **Bilingual by symmetry.** Arabic is a peer, not a translation. Every layout, number, and date must read as native in both directions — logical properties only, `ar-EG` numerals, Cairo-anchored dates. If a screen only looks right in one direction, it isn't finished.
3. **Quiet tool, loud brand.** Restraint serves the operator; character is reserved for customer-facing moments. Don't borrow dashboard flatness for the landing page, or landing-page flourish for a data table. The register dictates the volume.
4. **Trust the numbers.** Money is real (piastres → EGP, Talabat online/cash split rules, Cairo time). Precision in formatting and clear disclosure outrank visual cleverness; never let a design choice create a wrong reading of a figure.
5. **Earned familiarity.** Operators are fluent in the category's best tools. Reach for standard affordances over invented ones; consistency screen-to-screen is a virtue. Delight is a moment, not a layout.

## Accessibility & Inclusion

Target **WCAG 2.1 AAA where feasible**, AA as the non-negotiable floor:

- Push body-text contrast toward 7:1 (large text ≥4.5:1); never ship muted gray body copy on a tinted near-white that only scrapes AA.
- Full keyboard operability with a clearly visible focus ring (the terracotta `--ring` token); no keyboard traps in dialogs, drawers, or the command palette.
- **RTL parity** is a correctness requirement, not an enhancement — Arabic and English must be equally usable, tested in both directions.
- Respect `prefers-reduced-motion` everywhere (the app already wraps motion in `MotionConfig reducedMotion="user"`); every animation needs a reduced alternative.
- Don't encode meaning in color alone — pair status color with an icon or label (matters for the chart palette and order/shift status).
- Customer surfaces must stay usable on a phone, on a poor connection, with no training.
