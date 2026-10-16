import { useEffect, useRef, useState, type DependencyList, type RefObject } from "react";

import { getFlip, getGsap, loadFlip, loadGsap, type Gsap, type Timeline } from "./gsap";
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

/*
 * No ghost first frames. An entrance hides its targets (the recipe's `from`)
 * before the browser paints them, in a layout effect, so the first frame is
 * the clean pre-state. It must never hide something already painted at rest:
 * content shown while GSAP was still loading, skeleton cards a `when` turns
 * into figures, or content React hid and re-showed (a Suspense boundary
 * re-suspending re-runs layout effects). That is the faint flash of content
 * that vanishes and then animates in. So once an element has been on screen
 * for a frame it is marked, and entrances skip marked elements unless their
 * `replayKey` changed (new content in the same commit, never painted).
 */
const painted = new WeakSet<Element>();

/** Mark `els` as painted once the frame that shows them has been drawn. */
function markPainted(els: Element[]) {
  if (!els.length || typeof requestAnimationFrame === "undefined") return;
  // Two frames: the first callback runs before its paint. StrictMode's double
  // run is synchronous, so it never sees its own mark.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      // Waiting off screen for a scroll reveal, or still arriving, is not at rest.
      const gsap = getGsap();
      for (const el of els) {
        if ((el instanceof HTMLElement && "motion" in el.dataset) || holding.has(el) || gsap?.isTweening(el)) continue;
        painted.add(el);
      }
    }),
  );
}

/** Whether an entrance may hide `el`: never painted, or its content was just replaced. */
export function mayEnter(el: Element, replayed: boolean) {
  return replayed || !painted.has(el);
}

/*
 * Data that lands before GSAP has loaded is still new content: it is hidden
 * before its first paint with plain inline styles (the recipe's `from`), GSAP
 * is fetched at once, and the entrance plays when it arrives. If it has not
 * arrived within ARRIVAL_PATIENCE_MS, the content simply shows: nothing stays
 * hidden waiting on the library. Only for data landing (a `when` turning
 * true, a skeleton swapped out), never for a page's first render.
 */
export const ARRIVAL_PATIENCE_MS = 1200;
const holding = new WeakSet<Element>();

export function holdForGsap(els: HTMLElement[], recipe: Recipe, play: (gsap: Gsap) => gsap.core.Tween | void) {
  const from = recipe.from as Record<string, number | undefined>;
  const parts = [
    from.x ? `translateX(${from.x}px)` : "",
    from.y ? `translateY(${from.y}px)` : "",
    from.scale !== undefined ? `scale(${from.scale})` : "",
  ].filter(Boolean);
  for (const el of els) {
    holding.add(el);
    el.style.opacity = String(from.opacity ?? 0);
    if (parts.length) el.style.transform = parts.join(" ");
  }
  let state: "waiting" | "playing" | "done" = "waiting";
  let tween: gsap.core.Tween | void;
  const release = () => {
    for (const el of els) {
      holding.delete(el);
      el.style.removeProperty("opacity");
      el.style.removeProperty("transform");
    }
  };
  const timer = setTimeout(() => {
    if (state !== "waiting") return;
    state = "done";
    release();
  }, ARRIVAL_PATIENCE_MS);
  loadGsap().then(
    (gsap) => {
      if (state !== "waiting") return;
      clearTimeout(timer);
      state = "playing";
      for (const el of els) holding.delete(el);
      tween = play(gsap);
    },
    () => {
      if (state !== "waiting") return;
      clearTimeout(timer);
      state = "done";
      release();
    },
  );
  return () => {
    clearTimeout(timer);
    if (state === "playing" && tween) {
      holdInterrupted(getGsap()!, tween);
      tween.kill();
    }
    state = "done";
    release();
  };
}

/** Whether `when` turned true since the last run: data landed. */
function useLanded(when: boolean) {
  const last = useRef(when);
  return () => {
    const landed = when && !last.current;
    last.current = when;
    return landed;
  };
}

/**
 * The delay that puts an element arriving on its own (a SkeletonSwap whose
 * data landed) in step with the Stagger it sits in, by its item's index.
 */
export function groupDelay(el: HTMLElement, register: Register = "product") {
  const root = el.closest<HTMLElement>("[data-stagger]");
  if (!root) return 0;
  const items = Array.from(root.children);
  const i = items.findIndex((c) => c.contains(el));
  if (i < 0) return 0;
  return Math.min(i, STAGGER.maxItems - 1) * staggerFor(items.length, register);
}

/** A ref'd value's "did it change since the last run" flag, for replayKey. */
function useReplayed(replayKey: unknown) {
  const last = useRef(replayKey);
  return () => {
    const changed = !Object.is(last.current, replayKey);
    last.current = replayKey;
    return changed;
  };
}

/*
 * An entrance cut off by its effect's cleanup (React StrictMode's second run,
 * which in development comes a frame or two after the first; a Suspense
 * boundary hiding and re-showing its content) is reverted to rest and run
 * again. The re-run carries on from where the first one was, never from the
 * start, so nothing fades in, blinks and fades in again.
 */
const interrupted = new WeakMap<Element, Record<string, unknown>>();

/**
 * Note where each still-arriving target of an entrance is, for a re-run to
 * carry on from. Call it from the effect's cleanup, before GSAP reverts.
 */
export function holdInterrupted(gsap: Gsap, tween: gsap.core.Tween) {
  const keys = (tween.data as { enterKeys?: string[] } | undefined)?.enterKeys;
  if (!keys || tween.progress() >= 1) return;
  for (const el of tween.targets() as Element[]) {
    const at: Record<string, unknown> = {};
    for (const k of keys) at[k] = gsap.getProperty(el, k);
    interrupted.set(el, at);
  }
}

/** Tween `targets` from a recipe's resting state into place, then hand styling back to CSS. */
export function playIn(gsap: Gsap, targets: gsap.TweenTarget, recipe: Recipe, extra: gsap.TweenVars = {}) {
  const r = prefersReducedMotion() ? reduce(recipe) : recipe;
  const keys = Object.keys(r.from);
  // Each target starts from the recipe's `from`, or from where an interrupted
  // run of the same entrance left it.
  const from: gsap.TweenVars = {};
  for (const k of keys) {
    from[k] = (_i: number, el: Element) => (interrupted.get(el)?.[k] ?? r.from[k]) as gsap.TweenValue;
  }
  const els = gsap.utils.toArray<Element>(targets);
  const tween = gsap.fromTo(els, from, {
    ...r.to,
    ...extra,
    clearProps: "opacity,transform",
    data: { enterKeys: keys },
    onComplete: () => {
      for (const el of els) painted.add(el);
    },
  });
  for (const el of els) interrupted.delete(el);
  return tween;
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
  const replayed = useReplayed(replayKey);
  useGsap(
    (gsap, { reduced }) => {
      const el = ref.current;
      const fresh = replayed();
      if (!el || !when || reduced || !mayEnter(el, fresh)) return;
      const r = recipe ?? rise(register);
      if (inViewport(el)) {
        const t = playIn(gsap, el, r, { delay });
        return () => holdInterrupted(gsap, t);
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
  // With or without GSAP, whatever this shows is on screen from the next frame.
  useIsoLayoutEffect(() => {
    if (ref.current) markPainted([ref.current]);
  }, [when, replayKey]);
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
  const replayed = useReplayed(replayKey);
  const landed = useLanded(when);
  // Data landed before GSAP: hide the new items before paint, play on arrival.
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!landed() || getGsap() || !el || prefersReducedMotion()) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>(selector)).filter((i) => inViewport(i) && mayEnter(i, false));
    if (!items.length) return;
    const r = recipe ?? rise(register);
    const each = staggerFor(items.length, register);
    return holdForGsap(items, r, (gsap) =>
      playIn(gsap, items, r, { delay, stagger: (i: number) => Math.min(i, STAGGER.maxItems - 1) * each }),
    );
  }, [when, replayKey]);
  useGsap(
    (gsap, { reduced }) => {
      const el = ref.current;
      const fresh = replayed();
      if (!el || !when || reduced) return;
      const items = Array.from(el.querySelectorAll<HTMLElement>(selector)).filter((i) => inViewport(i) && mayEnter(i, fresh));
      if (!items.length) return;
      const each = staggerFor(items.length, register);
      const t = playIn(gsap, items, recipe ?? rise(register), {
        delay,
        stagger: (i: number) => Math.min(i, STAGGER.maxItems - 1) * each,
      });
      return () => holdInterrupted(gsap, t);
    },
    [when, replayKey],
  );
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (el) markPainted(Array.from(el.querySelectorAll(selector)));
  }, [when, replayKey]);
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
 *
 * The DOM is measured only when `key` changes, never on an ordinary
 * re-render: a keystroke in one of the rows re-renders the list, and must
 * not touch it. "Where they were" is read during the render that carries the
 * new key, before React commits it, so the old layout is still on screen.
 * Hidden items (no box: a closed tab, a collapsed section) are left out, since
 * measuring them makes GSAP lift them out of the page and put them back,
 * which drops the focus of any field inside.
 */
export function useFlip(container: RefObject<HTMLElement | null>, key: unknown, selector = ":scope > *") {
  const snap = useRef<{ key: unknown; state: Flip.FlipState | null }>({ key, state: null });
  useEffect(() => {
    void loadFlip().catch(() => {});
  }, []);
  // Render phase on purpose: this is the last moment the previous layout is in
  // the DOM. Reading it is idempotent, so a discarded or doubled render is harmless.
  // eslint-disable-next-line react-hooks/refs
  if (snap.current.key !== key) {
    const el = container.current;
    const Flip = getFlip();
    // eslint-disable-next-line react-hooks/refs
    snap.current = {
      key,
      state: el && Flip && !prefersReducedMotion() ? Flip.getState(flipTargets(el, selector)) : null,
    };
  }
  useIsoLayoutEffect(() => {
    const state = snap.current.state;
    const el = container.current;
    const Flip = getFlip();
    if (!state || !el || !Flip) return;
    snap.current.state = null;
    Flip.from(state, {
      targets: flipTargets(el, selector),
      duration: sec(DURATION.base),
      ease: EASE_NAME.out,
      onEnter: (els) => getGsap()?.fromTo(els, { opacity: 0 }, { opacity: 1, duration: sec(DURATION.base) }),
    });
  }, [key]);
}

/** The items of a flip list that have a box on screen. */
function flipTargets(el: HTMLElement, selector: string) {
  return Array.from(el.querySelectorAll<HTMLElement>(selector)).filter((t) => {
    const r = t.getBoundingClientRect();
    return r.width > 0 || r.height > 0;
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
 * Feedback plays once per signal value: a Suspense re-show re-runs layout
 * effects with the same signal, which must not shake or pop again. StrictMode's
 * synchronous double run is let through (its first run is reverted at once).
 */
function useFiredOnce(signal: unknown) {
  const last = useRef<{ signal: unknown; sameTask: boolean } | null>(null);
  return () => {
    const prev = last.current;
    if (prev && Object.is(prev.signal, signal) && !prev.sameTask) return false;
    const mark = { signal, sameTask: true };
    last.current = mark;
    queueMicrotask(() => (mark.sameTask = false));
    return true;
  };
}

/**
 * Error feedback: a short horizontal shake (symmetric, so it reads the same in
 * RTL) each time `signal` changes to a new truthy value — a wrong code, a
 * refused sign-in. Never on a field while the person is typing in it; shake
 * the row or the form. Reduced motion: no shake; the error text carries it.
 */
export function useShake(ref: RefObject<HTMLElement | null>, signal: unknown) {
  const fired = useFiredOnce(signal);
  useGsap(
    (gsap, { reduced }) => {
      const el = ref.current;
      if (!el || !signal || reduced || !fired()) return;
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
  const fired = useFiredOnce(signal);
  useGsap(
    (gsap, { reduced }) => {
      const el = ref.current;
      if (!el || !signal || reduced || !fired()) return;
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
