import { useEffect, useRef, useState, type DependencyList, type RefObject } from "react";

import { getGsap, loadFlip, loadGsap, type Gsap, type Timeline } from "./gsap";
import { inViewport, prefersReducedMotion } from "./media";
import { reduce, rise, type Recipe } from "./recipes";
import { DURATION, EASE_NAME, sec, staggerFor, STAGGER, type Register } from "./tokens";

import { useIsoLayoutEffect, useLatest } from "./latest";

export interface MotionEnv {
  reduced: boolean;
}

/**
 * Run GSAP code scoped to an element, the way @gsap/react's useGSAP does:
 * everything created inside is collected in a `gsap.context` and reverted on
 * cleanup, so StrictMode's double mount and fast re-renders leave no stray
 * tweens or inline styles. Runs before paint.
 *
 * If GSAP has not loaded yet the effect is skipped (the element shows at rest)
 * unless `late` is set, in which case it runs once GSAP arrives. Use `late`
 * only for motion that does not hide anything: ambient loops, not entrances.
 */
export function useGsap(
  effect: (gsap: Gsap, env: MotionEnv) => void | (() => void),
  deps: DependencyList,
  { scope, late = false }: { scope?: RefObject<Element | null>; late?: boolean } = {},
) {
  const effectRef = useLatest(effect);
  useIsoLayoutEffect(() => {
    let ctx: gsap.Context | undefined;
    let inner: void | (() => void);
    let cancelled = false;
    const run = (gsap: Gsap) => {
      if (cancelled) return;
      ctx = gsap.context(() => {
        inner = effectRef.current(gsap, { reduced: prefersReducedMotion() });
      }, scope?.current ?? undefined);
    };
    const gsap = getGsap();
    if (gsap) run(gsap);
    else if (late) loadGsap().then(run, () => {});
    return () => {
      cancelled = true;
      inner?.();
      ctx?.revert();
    };
  }, deps);
}

/** Tween `targets` from a recipe's resting state into place, then hand styling back to CSS. */
export function playIn(gsap: Gsap, targets: gsap.TweenTarget, recipe: Recipe, extra: gsap.TweenVars = {}) {
  const r = prefersReducedMotion() ? reduce(recipe) : recipe;
  return gsap.fromTo(targets, r.from, { ...r.to, ...extra, clearProps: "opacity,transform" });
}

export interface RevealOptions {
  register?: Register;
  /** Overrides the register's rise. */
  recipe?: Recipe;
  /** Seconds. */
  delay?: number;
  /** Reveal when this turns true (e.g. data arrived). Default: on mount. */
  when?: boolean;
  /** Re-run whenever this changes (a new route, a new tab). */
  replayKey?: unknown;
  /**
   * Below the fold at mount: product content just shows; with `scroll` it
   * waits off screen and rises when scrolled into view (brand pages).
   */
  scroll?: boolean;
}

/** Rise an element into place once, on mount or when `when` turns true. */
export function useReveal(ref: RefObject<HTMLElement | null>, opts: RevealOptions = {}) {
  const { register = "product", recipe, delay = 0, when = true, replayKey, scroll = false } = opts;
  useGsap(
    (gsap, { reduced }) => {
      const el = ref.current;
      if (!el || !when || reduced) return;
      const r = recipe ?? rise(register);
      if (inViewport(el)) {
        playIn(gsap, el, r, { delay });
        return;
      }
      if (!scroll || typeof IntersectionObserver === "undefined") return;
      gsap.set(el, r.from);
      el.dataset.motion = "";
      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          io.disconnect();
          delete el.dataset.motion;
          playIn(gsap, el, r);
        },
        { rootMargin: "0px 0px -8% 0px" },
      );
      io.observe(el);
      return () => {
        io.disconnect();
        delete el.dataset.motion;
      };
    },
    [when, replayKey],
  );
}

export interface StaggerOptions {
  register?: Register;
  recipe?: Recipe;
  /** Which descendants arrive. Default: the direct children. */
  selector?: string;
  when?: boolean;
  /** Re-run whenever this changes, e.g. the first page of rows arriving. */
  replayKey?: unknown;
  delay?: number;
}

/**
 * Bring a group in one after another: KPI rows, list rows, cards. Only the
 * items on screen move; the run is capped (STAGGER.maxTotal) however long the
 * list, so a 200-row table arrives as fast as a 6-row one.
 */
export function useStagger(ref: RefObject<HTMLElement | null>, opts: StaggerOptions = {}) {
  const { register = "product", recipe, selector = ":scope > *", when = true, replayKey, delay = 0 } = opts;
  useGsap(
    (gsap, { reduced }) => {
      const el = ref.current;
      if (!el || !when || reduced) return;
      const items = Array.from(el.querySelectorAll<HTMLElement>(selector)).filter(inViewport);
      if (!items.length) return;
      const each = staggerFor(items.length, register);
      playIn(gsap, items, recipe ?? rise(register), {
        delay,
        stagger: (i: number) => Math.min(i, STAGGER.maxItems - 1) * each,
      });
    },
    [when, replayKey],
  );
}

export interface CountUpOptions {
  /** "snap" (default): count up on first reveal, then show changes at once.
   *  "tween": every change tweens from the figure on screen. */
  onChange?: "snap" | "tween";
  /** Milliseconds; defaults to the count token so figures land with the charts. */
  duration?: number;
}

/**
 * Count a figure up into place. The element's only child must be the text
 * React renders for `format(value)`; the tween rewrites that same text node,
 * so React and GSAP never disagree about which node holds the number. Starts
 * only on screen; reduced motion and a not-yet-loaded GSAP show the figure.
 */
export function useCountUp(
  ref: RefObject<HTMLElement | null>,
  value: number,
  format: (n: number) => string,
  { onChange = "snap", duration = DURATION.count }: CountUpOptions = {},
) {
  const fmt = useLatest(format);
  const st = useRef({ revealed: false, started: false, current: 0 });
  useIsoLayoutEffect(() => {
    const el = ref.current;
    const gsap = getGsap();
    const s = st.current;
    const settle = () => {
      s.revealed = true;
      s.current = value;
    };
    if (!el || !gsap || prefersReducedMotion()) return settle();
    let from: number;
    if (!s.revealed) {
      if (!s.started && !inViewport(el)) return settle();
      from = s.started ? s.current : 0;
    } else if (onChange === "tween" && s.current !== value && inViewport(el)) {
      from = s.current;
    } else return settle();
    s.started = true;
    const state = { v: from };
    const paint = () => {
      const node = el.firstChild;
      if (node && node.nodeType === Node.TEXT_NODE) node.nodeValue = fmt.current(state.v);
    };
    paint();
    const tween = gsap.to(state, {
      v: value,
      duration: sec(duration),
      ease: EASE_NAME.out,
      onUpdate: () => {
        s.current = state.v;
        paint();
      },
      onComplete: settle,
    });
    return () => {
      tween.kill();
      if (tween.progress() >= 1) return;
      // Interrupted (a new value, StrictMode's re-mount): put the true figure
      // back; the next run continues from s.current.
      const node = el.firstChild;
      if (node && node.nodeType === Node.TEXT_NODE) node.nodeValue = fmt.current(value);
    };
  }, [value]);
}

/**
 * A choreographed set piece (a celebration, a demo loop). `build` adds to the
 * timeline; it is skipped under reduced motion unless `reduced: "run"`. Loops
 * should pass `pauseOffscreen` so nothing animates while out of sight.
 */
export function useTimeline(
  scope: RefObject<HTMLElement | null>,
  build: (tl: Timeline, gsap: Gsap) => void,
  deps: DependencyList,
  { pauseOffscreen = false, late = false, repeat = 0, reduced: whenReduced = "skip" }:
    { pauseOffscreen?: boolean; late?: boolean; repeat?: number; reduced?: "skip" | "run" } = {},
) {
  useGsap(
    (gsap, { reduced }) => {
      const el = scope.current;
      if (!el || (reduced && whenReduced === "skip")) return;
      const tl = gsap.timeline({ repeat });
      build(tl, gsap);
      if (!pauseOffscreen || typeof IntersectionObserver === "undefined") return;
      const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl.resume() : tl.pause()));
      io.observe(el);
      return () => io.disconnect();
    },
    deps,
    { scope, late },
  );
}

/**
 * Report how far an element has travelled through the viewport, 0 (its top at
 * the viewport's bottom) to 1 (its bottom at the viewport's top). Listens only
 * while the element is on screen, once per frame.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>, onProgress: (p: number) => void) {
  const cb = useLatest(onProgress);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      cb.current(Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height))));
    };
    const onScroll = () => {
      frame ||= requestAnimationFrame(measure);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
      } else window.removeEventListener("scroll", onScroll);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [ref, cb]);
}

/**
 * Animate the children of `container` from where they were to where they are
 * now whenever `key` changes (an item removed or reordered), using transforms
 * only. Items that just arrived fade in.
 */
export function useFlip(container: RefObject<HTMLElement | null>, key: unknown, selector = ":scope > *") {
  const flipRef = useRef<typeof import("gsap/Flip").Flip | null>(null);
  const state = useRef<Flip.FlipState | null>(null);
  const lastKey = useRef(key);
  useEffect(() => {
    void loadFlip().then((f) => (flipRef.current = f), () => {});
  }, []);
  useIsoLayoutEffect(() => {
    const el = container.current;
    const Flip = flipRef.current;
    if (!el || !Flip) return;
    const targets = el.querySelectorAll<HTMLElement>(selector);
    if (key !== lastKey.current && state.current && !prefersReducedMotion()) {
      Flip.from(state.current, {
        targets,
        duration: sec(DURATION.base),
        ease: EASE_NAME.out,
        onEnter: (els) => getGsap()?.fromTo(els, { opacity: 0 }, { opacity: 1, duration: sec(DURATION.base) }),
      });
    }
    lastKey.current = key;
    state.current = Flip.getState(targets);
  });
}

/** The width the indicator is drawn at; it is scaled to the active item's width. */
const INDICATOR_BASE = 100;

/**
 * A sliding active indicator (a tab underline, a segmented pill): one element
 * inside `list` that glides to whichever item matches `active`. Transforms
 * only, measured in physical px (offsetLeft), so RTL needs nothing special.
 * The indicator must be `absolute left-0` at INDICATOR_BASE px wide with
 * `origin-left`, inside the same positioned parent as the items.
 * `axis: "y"` is the vertical form (a side nav): `absolute top-0`,
 * INDICATOR_BASE px tall, `origin-top`; it glides by offsetTop and height.
 */
export function useIndicator(
  list: RefObject<HTMLElement | null>,
  indicator: RefObject<HTMLElement | null>,
  active = '[data-state="active"]',
  axis: "x" | "y" = "x",
) {
  useEffect(() => {
    const l = list.current;
    const ind = indicator.current;
    if (!l || !ind) return;
    const place = (animate: boolean) => {
      const a = l.querySelector<HTMLElement>(active);
      if (!a) {
        ind.style.setProperty("opacity", "0");
        return;
      }
      const vars =
        axis === "y"
          ? { y: a.offsetTop, scaleY: a.offsetHeight / INDICATOR_BASE, opacity: 1 }
          : { x: a.offsetLeft, scaleX: a.offsetWidth / INDICATOR_BASE, opacity: 1 };
      const gsap = getGsap();
      if (!gsap) {
        ind.style.setProperty(
          "transform",
          "y" in vars ? `translateY(${vars.y}px) scaleY(${vars.scaleY})` : `translateX(${vars.x}px) scaleX(${vars.scaleX})`,
        );
        ind.style.setProperty("opacity", "1");
      } else if (animate && !prefersReducedMotion()) {
        gsap.to(ind, { ...vars, duration: sec(DURATION.base), ease: EASE_NAME.out, overwrite: true });
      } else gsap.set(ind, vars);
    };
    place(false);
    const mo = new MutationObserver(() => place(true));
    mo.observe(l, { subtree: true, attributes: true, attributeFilter: ["data-state", "aria-current", "data-active", "aria-checked", "aria-selected"] });
    // Re-place without a slide when the list's size changes; observe() reports
    // once on mount, which must not cut short a slide already under way.
    let size = `${l.clientWidth}x${l.clientHeight}`;
    const ro = new ResizeObserver(() => {
      const next = `${l.clientWidth}x${l.clientHeight}`;
      if (next === size) return;
      size = next;
      place(false);
    });
    ro.observe(l);
    return () => {
      mo.disconnect();
      ro.disconnect();
    };
  }, [list, indicator, active, axis]);
}

/**
 * Error feedback: a short horizontal shake (symmetric, so it reads the same in
 * RTL) each time `signal` changes to a new truthy value — a wrong code, a
 * refused sign-in. Never on a field while the person is typing in it; shake
 * the row or the form. Reduced motion: no shake; the error text carries it.
 */
export function useShake(ref: RefObject<HTMLElement | null>, signal: unknown) {
  useGsap(
    (gsap, { reduced }) => {
      const el = ref.current;
      if (!el || !signal || reduced) return;
      gsap.to(el, {
        keyframes: { x: [0, -6, 5, -3, 2, 0] },
        duration: sec(DURATION.slow),
        ease: "none",
        // clearProps does not reach through `keyframes`; clear at the end instead.
        onComplete: () => void gsap.set(el, { clearProps: "transform" }),
      });
    },
    [signal],
  );
}

/**
 * Success feedback: the element settles from a slightly smaller scale each
 * time `signal` changes to a new truthy value — a saved row, a confirmed step.
 */
export function usePop(ref: RefObject<HTMLElement | null>, signal: unknown) {
  useGsap(
    (gsap, { reduced }) => {
      const el = ref.current;
      if (!el || !signal || reduced) return;
      gsap.fromTo(el, { scale: 0.94 }, { scale: 1, duration: sec(DURATION.slow), ease: EASE_NAME.out, clearProps: "transform" });
    },
    [signal],
  );
}

/**
 * A signal for usePop / useShake that changes only when `value` changes in
 * place (a status flipping on a row already on screen), never on mount or when
 * the value first arrives or goes away (null/undefined), so a list or sheet
 * that loads does not pop everything at once.
 *   usePop(ref, useChangeSignal(order.status))
 */
export function useChangeSignal(value: unknown): number {
  const [seen, setSeen] = useState({ value, n: 0 });
  if (Object.is(seen.value, value)) return seen.n;
  const n = seen.value == null || value == null ? seen.n : seen.n + 1;
  setSeen({ value, n });
  return n;
}
