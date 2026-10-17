/**
 * The motion tokens: the one source for every duration, easing, distance and
 * stagger in the app. `motion.css` mirrors them as CSS custom properties
 * (`--motion-*`, `--ease-*`), and `tokens.test.ts` fails if the two disagree.
 *
 * Register: the dashboard (product) stays in the 160–220 ms band and uses motion
 * to say what changed. Brand surfaces (ordering, tracking, reservations,
 * loyalty, sign-in, sign-up) may run longer, travel further and overshoot.
 */

/** Durations in milliseconds. GSAP takes seconds: use `sec()`. */
export const DURATION = {
  /** Hover, press, small affordances, every exit. */
  fast: 160,
  /** The product default: entrances, overlays, tab and route changes. */
  base: 220,
  /** Sheets and anything that crosses a large part of the screen. */
  slow: 320,
  /** Brand-surface entrances. */
  brand: 500,
  /** KPI count-ups and chart draws, which run in lockstep. */
  count: 1100,
} as const;

/** Cubic-bézier control points. GSAP registers each under `EASE_NAME[key]`. */
export const EASE = {
  /** Decelerating (ease-out-quint): the product entrance curve. */
  out: [0.22, 1, 0.36, 1],
  /** Accelerating: exits leave quickly and never linger. */
  in: [0.5, 0, 0.75, 0],
  /** Symmetric: indicators that slide between two resting places, loops. */
  inOut: [0.65, 0, 0.35, 1],
  /** Long tail (ease-out-expo): brand entrances. */
  expo: [0.16, 1, 0.3, 1],
  /** The drawer curve: sheets and the sidebar. */
  drawer: [0.32, 0.72, 0, 1],
  /** A small overshoot. Brand register only; never in product UI. */
  overshoot: [0.34, 1.56, 0.64, 1],
} as const;

export type EaseName = keyof typeof EASE;

/** The names the eases are registered under in GSAP (`ease: EASE_NAME.out`). */
export const EASE_NAME: Record<EaseName, string> = {
  out: "madarOut",
  in: "madarIn",
  inOut: "madarInOut",
  expo: "madarExpo",
  drawer: "madarDrawer",
  overshoot: "madarOvershoot",
};

/** Travel distances in px. */
export const DISTANCE = {
  /** A nudge: popovers, tab content, a changed figure. */
  xs: 4,
  /** Product entrances and list rows. */
  sm: 6,
  /** Brand cards. */
  md: 12,
  /** Brand hero entrances. */
  lg: 18,
} as const;

/** Scales a pressed or arriving element starts from. */
export const SCALE = {
  /** A pressed control (product). */
  press: 0.985,
  /** A pressed card or tile (brand). */
  pressBrand: 0.97,
  /** An overlay arriving: dialogs, menus. */
  overlay: 0.97,
} as const;

/** Stagger between siblings, in seconds, and the most a whole stagger may add. */
export const STAGGER = {
  product: 0.03,
  brand: 0.06,
  /** However many items, a stagger adds at most this much in total. */
  maxTotal: 0.3,
  /** Items past this index arrive with the last staggered one. */
  maxItems: 12,
} as const;

export type Register = "product" | "brand";

/** What an entrance means in each register. */
export const REGISTER = {
  product: { duration: DURATION.base, ease: "out", distance: DISTANCE.sm, stagger: STAGGER.product },
  brand: { duration: DURATION.brand, ease: "expo", distance: DISTANCE.lg, stagger: STAGGER.brand },
} as const satisfies Record<Register, { duration: number; ease: EaseName; distance: number; stagger: number }>;

/** Milliseconds → seconds, for GSAP. */
export const sec = (ms: number) => ms / 1000;

/** The per-item stagger for `count` items, capped so the whole run stays short. */
export function staggerFor(count: number, register: Register = "product"): number {
  const each = REGISTER[register].stagger;
  const n = Math.min(count, STAGGER.maxItems);
  return n > 1 ? Math.min(each, STAGGER.maxTotal / (n - 1)) : 0;
}
