import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { haptic } from "../lib/menu-format";

/**
 * Sticky category navigation logic: tracks the active category via an
 * IntersectionObserver on each section, auto-centres the active pill, handles
 * pill clicks (smooth-scroll with observer suppression), and honours an initial
 * `#cat-<id>` hash on first load.
 *
 * Sections and pills register their DOM nodes through the returned callbacks.
 */
export function useScrollSpy(categoryIds: string[], menuReady: boolean) {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const pillRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const ignoreObserverRef = useRef(false);
  const hashHandledRef = useRef(false);

  const registerSection = useCallback((id: string, el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  }, []);
  const registerPill = useCallback((id: string, el: HTMLAnchorElement | null) => {
    pillRefs.current[id] = el;
  }, []);

  // Re-observe whenever the set of visible categories changes (e.g. search).
  const idsKey = categoryIds.join("|");
  useEffect(() => {
    if (categoryIds.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (ignoreObserverRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveCat(visible[0].target.id.replace(/^cat-/, ""));
        }
      },
      { rootMargin: "-140px 0px -55% 0px", threshold: 0 },
    );
    categoryIds.forEach((id) => {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  // Keep the active pill centred in the horizontal rail.
  useEffect(() => {
    if (!activeCat) return;
    pillRefs.current[activeCat]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeCat]);

  const onPillClick = useCallback((e: MouseEvent<HTMLAnchorElement>, catId: string) => {
    e.preventDefault();
    const el = sectionRefs.current[catId];
    if (!el) return;
    haptic("light");
    ignoreObserverRef.current = true;
    setActiveCat(catId);
    el.scrollIntoView({ behavior: "smooth", block: "start" });

    let timeoutId: number;
    const release = () => {
      ignoreObserverRef.current = false;
      window.clearTimeout(timeoutId);
      window.removeEventListener("scrollend", release);
    };
    timeoutId = window.setTimeout(release, 1200);
    window.addEventListener("scrollend", release, { once: true });
  }, []);

  // Honour an initial #cat-<id> hash once the menu is ready.
  useEffect(() => {
    if (!menuReady || hashHandledRef.current) return;
    const hash = window.location.hash;
    if (!hash.startsWith("#cat-")) {
      hashHandledRef.current = true;
      return;
    }
    const catId = hash.slice(5);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = sectionRefs.current[catId];
        if (el) {
          ignoreObserverRef.current = true;
          setActiveCat(catId);
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          window.setTimeout(() => {
            ignoreObserverRef.current = false;
          }, 1200);
        }
        hashHandledRef.current = true;
      });
    });
  }, [menuReady]);

  return { activeCat, registerSection, registerPill, onPillClick };
}
