import { useState } from "react";

import { DISTANCE, DURATION, EASE_NAME, recipes, sec, type Recipe } from "@/lib/motion";

/** Motion shared by the public bundles (ordering, tracking, reservations, loyalty). */

/**
 * A step swap that travels in the reading direction: forward, the new step
 * arrives from the end edge and the old one leaves toward the start; back,
 * the reverse. Mirrors in RTL.
 */
export function stepSwap(dir: 1 | -1, rtl: boolean): Recipe {
  const x = dir * (rtl ? -1 : 1);
  return {
    from: { opacity: 0, x: x * DISTANCE.lg },
    to: { opacity: 1, x: 0, duration: sec(DURATION.brand), ease: EASE_NAME.expo },
    exit: { opacity: 0, x: -x * DISTANCE.md, duration: sec(DURATION.fast), ease: EASE_NAME.in },
  };
}

/** Which way a step flow just moved (1 forward, -1 back), for `stepSwap`. */
export function useStepDirection<T>(step: T, order: readonly T[]): 1 | -1 {
  const [seen, setSeen] = useState({ step, dir: 1 as 1 | -1 });
  if (seen.step === step) return seen.dir;
  const dir = order.indexOf(step) >= order.indexOf(seen.step) ? 1 : -1;
  setSeen({ step, dir });
  return dir;
}

/** A success badge (order placed, status reached, table booked) landing with a twist. */
export const successBadge: Recipe = {
  ...recipes.pop,
  from: { ...recipes.pop.from, scale: 0.4, rotate: -20 },
  to: { ...recipes.pop.to, rotate: 0 },
};

/**
 * A signal for `usePop` that changes only when `value` grows (an item added,
 * an order moving on), never on mount, on a removal, or when the value first
 * becomes known (undefined → a number).
 */
export function useGrowSignal(value: number | undefined): number {
  const [seen, setSeen] = useState({ value, bumps: 0 });
  if (seen.value !== value) {
    const grew = seen.value !== undefined && value !== undefined && value > seen.value;
    setSeen({ value, bumps: grew ? seen.bumps + 1 : seen.bumps });
  }
  return seen.bumps;
}
