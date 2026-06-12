import { useEffect, useRef, useState } from "react";
import { PRICE_ROLL_MS } from "../lib/constants";
import { prefersReducedMotion } from "../lib/motion";

/**
 * Animate a number toward `value` with rAF easing (easeOutCubic). Used for the
 * order total and unit price. Jumps instantly when reduced motion is requested.
 */
export function useAnimatedValue(value: number, duration = PRICE_ROLL_MS): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTargetRef = useRef(value);

  useEffect(() => {
    if (value === lastTargetRef.current) return;
    lastTargetRef.current = value;

    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }

    fromRef.current = display;
    startRef.current = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const step = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(fromRef.current + (value - fromRef.current) * e);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // intentionally not depending on `display` — that would loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return display;
}
