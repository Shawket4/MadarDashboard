/**
 * The motion system. Every animation in src/ goes through here; see the
 * "Motion" section of CLAUDE.md for the registers and how to add motion to a
 * feature. GSAP itself is private to this folder and loads lazily.
 */
import { preloadGsap } from "./gsap";
import { installPressFeedback } from "./press";

export * from "./tokens";
export * as recipes from "./recipes";
export type { Recipe } from "./recipes";
export { useReducedMotion, useMotionCondition, prefersReducedMotion } from "./media";
export { playIn, enter, leave, ENTER_PATIENCE_MS } from "./engine";
export {
  useGsap,
  useReveal,
  useStagger,
  useCountUp,
  useTimeline,
  useScrollProgress,
  useFlip,
  useIndicator,
  useShake,
  usePop,
  useChangeSignal,
  type RevealOptions,
  type StaggerOptions,
  type CountUpOptions,
} from "./hooks";
export {
  usePresence,
  Presence,
  SwapPresence,
  useOverlayRoot,
  useOverlayOpen,
  OverlayOpenProvider,
  useEnter,
  composeRefs,
  type PresencePart,
} from "./presence";
export { usePressFeedback } from "./press";
export { Reveal, Stagger, CountUp, AnimatedNumber, ChartEntrance, SkeletonSwap, useChartMotion } from "./components";

/** Start the motion system: called once at the top of each bundle's main.tsx. */
export function bootMotion() {
  preloadGsap();
  installPressFeedback();
}
