import type { Variants, Transition } from "motion/react";

/**
 * Shared motion vocabulary. Pair with <MotionConfig reducedMotion="user"> at the
 * app root so all of these respect prefers-reduced-motion automatically.
 *
 * Register note: the dashboard (product) keeps motion in the 150–250ms band and
 * uses it to convey state, never as decoration. Brand surfaces may run a touch
 * longer and more expressive — reach for `easeOutExpo` + larger offsets there.
 */

// ── Duration + easing tokens ────────────────────────────────────────────────
// Exponential ease-outs only (no bounce / elastic in product UI).
export const DURATION = {
  fast: 0.16,
  base: 0.22,
  slow: 0.32,
  /** Brand-surface entrances may breathe a little longer. */
  brand: 0.5,
} as const;

/** ease-out-quart — crisp, decelerating. The product default. */
export const easeOutQuart = [0.25, 1, 0.5, 1] as const;
/** ease-out-expo — longer tail, for brand reveals. */
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;

// ── Transition presets ────────────────────────────────────────────────────
// Snappy by default — short durations + a tight ease so the UI feels instant
// rather than "sliding". A crisper spring is reserved for small affordances.
export const easeOut: Transition = { duration: DURATION.fast, ease: [0.22, 1, 0.36, 1] };
export const easeBase: Transition = { duration: DURATION.base, ease: easeOutQuart };
export const spring: Transition = { type: "spring", stiffness: 420, damping: 32 };
export const springSoft: Transition = { type: "spring", stiffness: 260, damping: 28 };
/**
 * Shared duration (ms) for KPI count-ups and chart entrance draws, so a number
 * counts up in lockstep with the chart animating beside it. Tune both at once.
 */
export const COUNT_ANIM_MS = 1100;

/** For count-ups and value tweens — snappy, settles in ~0.4s without overshoot. */
export const numberSpring: Transition = { type: "spring", stiffness: 300, damping: 36, mass: 0.5 };

// ── Entrance variants ────────────────────────────────────────────────────
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: easeOut },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: easeOut },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: spring },
};

/** A more characterful entrance for brand surfaces — larger offset, longer tail. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.brand, ease: easeOutExpo } },
};

/** Container that staggers its direct motion children. */
export const staggerContainer = (stagger = 0.03, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

/** Item to use inside a staggerContainer. */
export const listItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: easeOut },
};

// ── Overlay variants ──────────────────────────────────────────────────────
/** Dialog/popover content. Pair with an AnimatePresence + a backdrop fade. */
export const overlayContent: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 4 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: DURATION.base, ease: easeOutQuart } },
  exit: { opacity: 0, scale: 0.98, y: 2, transition: { duration: DURATION.fast, ease: easeOutQuart } },
};

// ── Interaction affordances ────────────────────────────────────────────────
/**
 * Spread onto a `motion` element to give it a quiet hover-lift + press-settle.
 * Restrained on purpose: a 1px lift and a 1% scale, nothing springy.
 *   <motion.div {...pressable}> … </motion.div>
 */
export const pressable = {
  whileHover: { y: -1 },
  whileTap: { scale: 0.985 },
  transition: { duration: DURATION.fast, ease: easeOutQuart },
} as const;

/** Slightly more pronounced lift for tappable cards (channel tiles, menu items). */
export const liftCard = {
  whileHover: { y: -3 },
  whileTap: { scale: 0.99 },
  transition: { type: "spring", stiffness: 400, damping: 30 },
} as const;
