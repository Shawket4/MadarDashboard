import { useSyncExternalStore } from "react";

/**
 * The media conditions motion depends on, read in one place. It answers
 * synchronously on the first render, before the GSAP chunk has landed, which
 * is why it watches `window.matchMedia` itself rather than `gsap.matchMedia()`.
 */
const QUERIES = {
  reduced: "(prefers-reduced-motion: reduce)",
  /** No hover and a coarse pointer: a phone or tablet. */
  touch: "(hover: none) and (pointer: coarse)",
  desktop: "(min-width: 768px)",
} as const;

export type MotionCondition = keyof typeof QUERIES;

const lists = new Map<MotionCondition, MediaQueryList | null>();

function list(name: MotionCondition): MediaQueryList | null {
  if (!lists.has(name)) {
    const mql = typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(QUERIES[name])
      : null;
    lists.set(name, mql);
  }
  return lists.get(name) ?? null;
}

/** The condition's current value, outside React. */
export function matches(name: MotionCondition): boolean {
  return list(name)?.matches ?? false;
}

/** True when the visitor asked for less motion. */
export const prefersReducedMotion = () => matches("reduced");

function subscribe(name: MotionCondition, onChange: () => void) {
  const mql = list(name);
  mql?.addEventListener?.("change", onChange);
  return () => mql?.removeEventListener?.("change", onChange);
}

/** A motion condition as React state; re-renders when it flips. */
export function useMotionCondition(name: MotionCondition): boolean {
  return useSyncExternalStore(
    (cb) => subscribe(name, cb),
    () => matches(name),
    () => false,
  );
}

export const useReducedMotion = () => useMotionCondition("reduced");

/** Whether any part of `el` is inside the viewport right now. */
export function inViewport(el: Element): boolean {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const vw = window.innerWidth || document.documentElement.clientWidth;
  return r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw && (r.width > 0 || r.height > 0);
}
