import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { DURATION } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface AnimatedFigureProps {
  /** The figure as it should read, already formatted. A new text animates in. */
  text: string;
  className?: string;
}

/**
 * A figure that cross-fades and lifts a few pixels when it changes — the same
 * motion as the POS charge amount (`AnimatedMoneyText`: 220 ms, ease-out, the
 * new figure rising a quarter of its height). Unlike `AnimatedNumber` it never
 * counts through intermediate values: a computed amount shows the true figure,
 * only the change is animated. Reduced motion swaps it in place.
 */
export function AnimatedFigure({ text, className }: AnimatedFigureProps) {
  const reduced = useReducedMotion();
  const transition = { duration: reduced ? 0 : DURATION.base, ease: [0, 0, 0.58, 1] as const };
  return (
    <span className={cn("relative inline-grid overflow-hidden tabular", className)}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={text}
          className="col-start-1 row-start-1"
          initial={reduced ? false : { opacity: 0, y: "25%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={transition}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
