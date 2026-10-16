# Handoff: dashboard motion (branch `feat/dashboard-motion`)

Written 2026-10-16 for a fresh session on another machine. Read the repo's `CLAUDE.md`
first, especially its **Motion** section: it is the contract for everything here. This
file is the state of the work and what is left. Delete it when the branch merges.

## Getting the branch
The branch is pushed to `origin`:

```bash
git clone https://github.com/Shawket4/MadarDashboard.git && cd MadarDashboard
git switch feat/dashboard-motion
npm ci
npx playwright install chromium   # for the harness below
```

Commit and push as you go so the work never lives on one machine only.
Merging and tagging are the owner's call. Another session works in `site/`,
`downloads/` and one pointer line in this `CLAUDE.md`; tell it (or the owner) before
tagging or pushing `main`. Do not edit `site/`, `downloads/`, `vitest.config.ts` or CI.

## The ask, as it stands
The owner wants every animation in the dashboard on **GSAP**: super polished and robust,
with motion expanded everywhere and one central system, so no page skips it,
reimplements it, or uses it differently. Product register (dashboard): quiet, 160–220 ms,
motion conveys state. Brand register (ordering, tracking, reservations, loyalty, sign-in,
sign-up, onboarding): more expressive.

Hard rules (in CLAUDE.md):
- Reduced motion is honoured.
- Transform and opacity only.
- RTL parity, and the floor canvas is never mirrored.
- Nothing animates off screen.
- CSP is unchanged.
- No motion on a field someone is typing in.
- WCAG AA.

Decisions the owner made in conversation:
- **GSAP for everything one-shot or state-driven.** `motion` (Framer) and `tw-animate-css`
  are uninstalled.
- **These stay CSS, on the motion tokens:** hover and colour transitions, the spinner and
  the skeleton shimmer (compositor-driven, they keep moving while the main thread is busy).
- **These keep their own engines:** Recharts (it morphs between datasets), vaul (the
  public cart drawer's drag physics) and sonner (toasts).
- **But each must be used consistently.** One component per job, and lint must fail
  when a page skips it or rolls its own. That pass is **not done yet** (see below).
- **Sidebar collapse is rebuilt with transforms:** done.
- **Sign-up is rebuilt on sign-in's frame:** done. The 3D showcase runs wherever the
  device can render it, phones included, with nothing behind it on the page.

## What is done (commits on the branch, oldest first)
1. **The motion core in `src/lib/motion/`:**
   - `tokens.ts`, mirrored as CSS variables in `motion.css`; `tokens.test.ts` fails if
     the two drift.
   - `gsap.ts`: lazy GSAP plus CustomEase, Flip on demand.
   - `media.ts`: reduced motion, touch and desktop, read once.
   - `recipes.ts`; `hooks.ts` (useGsap, useReveal, useStagger, useCountUp, useTimeline,
     useScrollProgress, useFlip, useIndicator, useShake, usePop, and D1's useChangeSignal).
   - `presence.tsx` (Presence, SwapPresence, the overlay open state), `press.ts`
     (delegated `data-press`) and `components.tsx` (Reveal, Stagger, CountUp,
     AnimatedNumber, ChartEntrance, useChartMotion, SkeletonSwap).
   - Overlays (dialog, alert-dialog, sheet, popover, dropdown, select, tooltip), tabs,
     button, skeleton and the four bundle roots run on it.
   - Guardrails: ESLint bans `gsap`, `motion`, `framer-motion` and `tw-animate-css`
     outside `src/lib/motion`. `scripts/motion-check.mjs` (part of `npm run lint`)
     bans keyframes, `animate-[…]`, pulse/bounce, tw-animate classes, numeric
     `duration-*`, arbitrary eases and inline transition styles.
2. **Migration of every animation:**
   - Shared components: KPI count-up, DataTable row arrival, sliding indicators, empty
     states, export shake.
   - Charts and KPIs, brand surfaces, auth and onboarding.
   - Keyframes removed from `globals.css` and from the inline `<style>` blocks.
   - View Transitions replaced by the `Page` fade.
3. **Sidebar collapse with transforms only.** The gap snaps once; the main area slides
   with translateX while the rail's clip-path travels with it.
   - Measured at 4× CPU throttle: p95 went from 99.9 ms to 16.8–33 ms.
   - Two long frames remain per toggle: the React commit at each end.
4. **Sign-up on sign-in's frame.**
   - `AuthShell` is shared. `SignupShell` wraps it, with the plans copy in the panel and
     the showcase above the form.
   - The step block is flat, with no card.
5. **3D showcase wherever the device can render it**, on phones too.
   - It falls back to the 2D orbit on: no WebGL, a failed load or one slower than 4 s, a
     lost GPU context, data saving, or reduced motion.
   - Open question for the owner: should data saving still fall back? Reduced motion
     must, per the repo's accessibility rules.
   - `tone="page"` colours the caption and orbit for a plain page in both themes.
6. **The last commit (WIP):**
   - The two sweep agents' expansion across the remaining features.
   - D1 is complete: orders, floor, bookings, customers, tills, delivery, devices, orgs,
     qr, links, kitchen-stations, whatsapp, recipes.
   - D2 was stopped before its own test run: menu, inventory, staff, staff-pool, dawam,
     combos, deals, discounts, payment-methods, branch-builder, access, users. It also
     made every ExportButton caller rethrow after its toast, so a failed export shakes.
   - Also: the harness in `scripts/motion-harness/` and this file.

State at the last commit:
- `npx tsc --noEmit -p .` is clean, and `npm run lint` is clean (motion-check included).
- Tests over every changed folder: 4109 pass, **1 fails** (below).
- The full suite passed before the sweep commit: 5454, with the payroll test fixed.

## Known broken: fix first
`src/features/menu/menu-item-dialog-recipe.test.tsx` › "sends an edited line as the
amount typed":
- Typing `90` into a recipe line saves `9`, so **a keystroke is lost**. That breaks the
  "no motion on data entry" rule.
- It passes on `main` and fails every run on the branch.
- Prime suspect: D1's `useFlip` on the ingredient rows, or the `Presence` scaling panel,
  in `src/features/recipes/recipe-builder.tsx`. A Flip or remount mid-typing would drop
  the input.
- Also check the menu files D2 touched: `menu/recipe/recipe-grid.tsx` (AnimatedFigure)
  and `menu/studio/*`.
- Fix the root cause: no motion may remount or re-key an input. Keep the test as it is.

## What is left
1. **Review D2's unfinished sweep.**
   - Read the diff of the last commit for D2's folders.
   - Check every ExportButton caller: it rethrows, shows no second toast, and leaves no
     unhandled rejection.
   - New files to review: `src/components/app/export-button.test.tsx` and
     `src/components/app/pop-on-change.tsx` (D2's).
   - Then run the tests for those folders.
2. **The consistency pass** (the owner's explicit request). For each item: one
   implementation, every page using it, and a rule in `scripts/motion-check.mjs` or
   ESLint so it can't come back. Then update CLAUDE.md's Motion section.
   - **Spinner:** 48 hand-rolled `Loader2` + `animate-spin` become
     `<Spinner>` (`components/ui/spinner.tsx`), including Button's loading state. Only
     `spinner.tsx` may use `animate-spin`. Drop `motion-reduce:animate-none` from
     spinners: the policy keeps them spinning.
   - **Charts:**
     - Every Recharts series (`Bar`, `Line`, `Area`, `Pie`, `Scatter`, `Radar`,
       `RadialBar`, …) spreads `useChartMotion()`. A single-line grep found 16 of 23,
       so check the multi-line tags.
     - Every chart card arrives via `ChartEntrance` or a parent `Stagger`.
     - The check needs a small JSX tag scanner, because attributes contain `=>`.
   - **Placeholders:** `Skeleton` only.
   - **Drawer:** vaul only through `components/ui/drawer.tsx` (ESLint).
   - **Toasters:** sonner's `Toaster` only in `components/ui/sonner.tsx` and
     `features/public-shell/public-toaster.tsx`.
   - **Overlays:** no direct Radix overlay primitives (`Dialog`, `AlertDialog`,
     `Popover`, `DropdownMenu`, `Select`, `Tooltip`) outside `components/ui`, or they skip
     the motion. ESLint `no-restricted-imports` with `importNames` on `radix-ui`. Tabs is
     fine in `components/app`.
   - **`transition-all`:** banned, because it animates layout. Three uses exist.
   - **Redundant classes:** remove `motion-reduce:transition-none`; `motion.css` already
     zeroes transitions under reduced motion.
   - **`StatusPill`:** take a `ref` (React 19 prop), so the wrapper spans D1 added for
     `usePop` can go. Consider `useChangeSignal` + `usePop` as the one way to pop a
     changed status.
   - **Bookings "no table" alert:** it shows "0 bookings" while fading out. A `Presence`
     exit should keep the last content it showed.
3. **Full verification**, then a report to the owner:
   - `npm run lint`, `npx tsc --noEmit -p .`, `npm run test` (the full suite takes 10+
     minutes; under heavy load some dawam/staff tests time out, so rerun those files
     alone before calling them failures), `npm run build`.
   - Bundle sizes: `node scripts/motion-harness/sizes.mjs dist`, compared with the
     numbers below. GSAP must stay out of the eager graph.
   - Run the harness against `npm run dev:mock` on this branch **and** on `main`,
     because the numbers below came from a different machine:
     `node scripts/motion-harness/harness.mjs http://localhost:5180 out/`. It takes
     screenshots of home, orders, floor, reports, settings, onboarding, sign-in and
     sign-up in EN/AR × light/dark, measures CLS, and records frames at 4× throttle
     for four navigations and a sheet open.
   - `sidebar-probe.mjs` (collapse frames) and `auth-shots.mjs` (signed-out pages).
   - Look at the screenshots: EN and AR, light and dark, phone and desktop, and a
     reduced-motion pass.
4. **Not pushed or merged.** The owner decides.

## Numbers from the first machine (dev mock server, Apple Silicon, 4× CPU throttle)
- **Bundle (main build, brotli):**
  - Eager JS: 657.7 kB → 624.6 kB. Framer's eager `motion-vendor` (37.7 kB) is gone, and
    `src/lib/motion` costs 4.1 kB eagerly.
  - `gsap-vendor` 26.9 kB and `gsap-flip` 8.2 kB are lazy: not preloaded, not imported
    statically.
  - Entry chunk 55.0 kB → 55.6 kB.
- **Navigation on `main`:**
  - p95 16.8 ms, with 1–2 frames over 34 ms per navigation (200–680 ms each). Those are
    the route's own render, not motion.
  - CLS about 0.75–0.95 on every screen: the boot loader counts as a layout shift, so
    use it only as a before/after comparison.
- **Sidebar collapse:** p95 99.9 ms on `main` (4–5 frames over 34 ms), 16.8–33 ms on the
  branch (2 commit frames).

## How to run things
- **Mock mode:** `npm run dev:mock` (port 5180). It seeds a session.
  - Set `sessionStorage["madar.onboarding.skip"] = "1"` to get past the onboarding
    redirect.
  - Language and theme: `localStorage["madar.lang"]` (`en`/`ar`) and
    `localStorage["madar.theme"]` (`light`/`dark`).
- **Signed-out pages** (`/login`, `/signup`) in mock mode: the seeded session redirects
  away from them. The harness intercepts `src/data/api/mock/enable.ts` and strips the
  `signIn(...)` line (see `auth-shots.mjs`).
- **Problems that already exist on `main`** (not this branch; leave them unless asked):
  - The public ordering bundle renders blank in mock mode: `mock/combos.ts` calls
    `rules.margin`, which the public rules package lacks.
  - `/staff/*` and `/customers` have no mock handlers.
  - `index.html`'s crawler copy shows under the app on phones.
  - `chart-vendor` is preloaded eagerly by the dashboard entry.
