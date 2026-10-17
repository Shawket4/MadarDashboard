import { useEffect, useRef, useState } from "react";

import { DURATION, playIn, recipes, useGsap } from "@/lib/motion";
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
  // The figure on screen, and the one it replaced while that fades out.
  const [shown, setShown] = useState<{ text: string; old: string | null }>({ text, old: null });
  if (shown.text !== text) setShown({ text, old: shown.text });
  const ref = useRef<HTMLSpanElement>(null);

  useGsap(
    (gsap, { reduced }) => {
      const [now, old] = Array.from(ref.current?.children ?? []) as HTMLElement[];
      if (!now || !old || reduced) return;
      playIn(gsap, now, recipes.rise("product", now.offsetHeight / 4));
      gsap.fromTo(old, { opacity: 1 }, recipes.fade().exit);
    },
    [shown],
    { scope: ref },
  );

  // The old figure is invisible at rest (no GSAP, reduced motion); drop it
  // once its fade, and the new figure's rise, are over.
  useEffect(() => {
    if (shown.old === null) return;
    const id = setTimeout(() => setShown((s) => ({ ...s, old: null })), DURATION.slow);
    return () => clearTimeout(id);
  }, [shown]);

  return (
    <span ref={ref} className={cn("relative inline-grid overflow-hidden tabular", className)}>
      <span key={shown.text} className="col-start-1 row-start-1">
        {shown.text}
      </span>
      {shown.old !== null ? (
        <span key={shown.old} aria-hidden className="absolute start-0 top-0 whitespace-nowrap opacity-0">
          {shown.old}
        </span>
      ) : null}
    </span>
  );
}
