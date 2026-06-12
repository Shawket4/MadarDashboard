import { useEffect, useRef, useState, type RefObject } from "react";
import { prefersReducedMotion } from "../lib/motion";

/**
 * One-shot "has this entered the viewport yet" flag, used to drive card
 * entrance animations. When the user prefers reduced motion we report `true`
 * immediately and never create an observer.
 */
export function useInView<T extends Element>(
  options?: IntersectionObserverInit,
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState<boolean>(() => prefersReducedMotion());

  useEffect(() => {
    if (prefersReducedMotion()) {
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      options ?? { rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
    // options identity intentionally ignored — observe once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, inView];
}
