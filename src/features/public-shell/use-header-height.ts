import { useEffect, useState } from "react";

/**
 * The height of the page's sticky header, so something that sticks under it
 * (the menu's category bar) sits flush against its edge.
 *
 * Measured, not assumed: `StorefrontShell` and `StepShell` draw different
 * headers, and either grows with the reader's text size. Both mark theirs with
 * `data-sticky-header`; a page without one reads 0 and sticks to the top.
 */
export function useHeaderHeight(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-sticky-header]");
    if (!header) return;
    const measure = () => setHeight(header.getBoundingClientRect().height);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);
  return height;
}
