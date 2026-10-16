import type { RefObject } from "react";

import { EASE_NAME, useTimeline } from "@/lib/motion";

/**
 * The scan line on the "scan the code" landings: it sweeps the viewfinder
 * from 20% to 80% of its height and back (2.8 s), off screen paused. Reduced
 * motion, or before GSAP lands, it rests centred (the element sits at top-1/2).
 */
export function useScanSweep(line: RefObject<HTMLElement | null>) {
  useTimeline(
    line,
    (tl) => {
      const el = line.current;
      const travel = (el?.parentElement?.offsetHeight ?? 0) * 0.3;
      tl.fromTo(el, { y: -travel }, { y: travel, duration: 1.4, ease: EASE_NAME.inOut }).to(el, {
        y: -travel,
        duration: 1.4,
        ease: EASE_NAME.inOut,
      });
    },
    [],
    { repeat: -1, pauseOffscreen: true, late: true },
  );
}
