import { useEffect, useRef, useState } from "react";
import { animate, useInView, useMotionValue, useReducedMotion } from "motion/react";

import { COUNT_ANIM_MS, easeOutQuart } from "@/lib/motion";

interface AnimatedNumberProps {
  /** The target value. */
  value: number;
  /** Formats the (possibly fractional, mid-tween) number into display text. */
  format: (n: number) => string;
  /**
   * When false (default), the count-up runs once on first reveal then snaps on
   * subsequent value changes — the value tells the truth instantly after load,
   * which the product register wants for money. When true, every change tweens.
   */
  tweenOnChange?: boolean;
  className?: string;
}

/**
 * A KPI value that counts up to its target on first reveal, over a fixed
 * duration shared with the charts (COUNT_ANIM_MS) so numbers and chart draws
 * finish together. Native `tabular` numerals keep the width stable so the
 * surrounding layout never reflows. Honors prefers-reduced-motion: reduced
 * users get the final value immediately.
 */
export function AnimatedNumber({ value, format, tweenOnChange = false, className }: AnimatedNumberProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });

  const mv = useMotionValue(reduced ? value : 0);
  const [shown, setShown] = useState(reduced ? value : 0);
  const started = useRef(reduced);

  // Paint every animated frame into React state (cheap; formatting in render
  // keeps the locale correct and never gets stuck on a stale frame).
  useEffect(() => mv.on("change", (v) => setShown(v)), [mv]);

  useEffect(() => {
    if (reduced) {
      setShown(value);
      return;
    }
    const opts = { duration: COUNT_ANIM_MS / 1000, ease: easeOutQuart } as const;
    if (!started.current) {
      // First reveal → count up from 0, matched to the chart draw.
      if (inView) {
        started.current = true;
        const controls = animate(mv, value, opts);
        return () => controls.stop();
      }
    } else if (tweenOnChange) {
      const controls = animate(mv, value, opts);
      return () => controls.stop();
    } else {
      // Later change → snap, and paint directly so the DOM never lags.
      mv.set(value);
      setShown(value);
    }
  }, [inView, value, reduced, tweenOnChange, mv]);

  return (
    <span ref={ref} className={className}>
      {format(shown)}
    </span>
  );
}
