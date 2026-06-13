import type { Variants, Transition } from "motion/react";

/**
 * Shared motion vocabulary. Pair with <MotionConfig reducedMotion="user"> at the
 * app root so all of these respect prefers-reduced-motion automatically.
 */

// Snappy by default — short durations + a tight ease so the UI feels instant
// rather than "sliding". A crisper spring is reserved for small affordances.
export const easeOut: Transition = { duration: 0.16, ease: [0.22, 1, 0.36, 1] };
export const spring: Transition = { type: "spring", stiffness: 420, damping: 32 };
export const springSoft: Transition = { type: "spring", stiffness: 260, damping: 28 };

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
