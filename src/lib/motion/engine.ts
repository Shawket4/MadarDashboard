/*
 * The entrance and exit engine every motion primitive plays through.
 *
 * An entrance is never skipped because GSAP has not arrived. Its targets are
 * hidden before their first paint (the caller runs this in a layout effect),
 * then:
 *   1. GSAP is there: it plays with GSAP.
 *   2. GSAP is not there yet: the recipe's `from` is set with plain inline
 *      styles, GSAP is awaited for ENTER_PATIENCE_MS (it is fetched at boot,
 *      so this is rare), and the entrance plays with GSAP when it lands.
 *   3. Still no GSAP: the same recipe plays with the Web Animations API
 *      (transform and opacity, the same tokens and cubic-bézier eases).
 *   4. Neither available: the final state, at once.
 * An exit plays with GSAP or the Web Animations API, never waits.
 *
 * Reduced motion: callers either skip (content entrances) or pass the
 * recipe through `reduce` (overlays keep a short fade); both run here.
 */
import { getGsap, loadGsap, type Gsap, type TweenVars } from "./gsap";
import { prefersReducedMotion } from "./media";
import { reduce, type Recipe } from "./recipes";
import { DURATION, EASE, EASE_NAME, sec, type EaseName } from "./tokens";

/** How long an entrance waits, hidden, for GSAP before it plays with the Web Animations API. */
export const ENTER_PATIENCE_MS = 300;

/** A running entrance or exit: stop it, and ask whether it finished. */
export interface Playing {
  (): void;
  finished: () => boolean;
}

const playing = (stop: () => void, finished: () => boolean): Playing => Object.assign(stop, { finished });
const NOOP: Playing = playing(() => {}, () => true);

/*
 * Re-shown content. Once an entrance has finished on an element it is marked;
 * an entrance asked to run again on the same element without new content
 * (a Suspense boundary re-showing it, an effect re-run) skips it. New content
 * is always a new element or comes with a `replayKey`, so it always plays.
 */
const arrived = new WeakSet<Element>();

/** Whether an entrance may hide `el`: it has not arrived yet, or its content was just replaced. */
export function mayEnter(el: Element, replayed: boolean) {
  return replayed || !arrived.has(el);
}

/** Mark elements shown at rest without an entrance (skeletons, off-screen items). */
export function markArrived(els: Iterable<Element>) {
  for (const el of els) arrived.add(el);
}

/*
 * An entrance cut off by its cleanup (StrictMode's second run, a Suspense
 * hide, a dialog reopened mid-exit) notes where it got to; the next run
 * carries on from there instead of starting over.
 */
const interrupted = new WeakMap<Element, Record<string, unknown>>();

function hold(gsap: Gsap, tween: gsap.core.Tween | gsap.core.Timeline, keys: string[]) {
  if (tween.progress() >= 1) return;
  const targets = "targets" in tween ? (tween.targets() as Element[]) : [];
  for (const el of targets) {
    const at: Record<string, unknown> = {};
    for (const k of keys) at[k] = gsap.getProperty(el, k);
    interrupted.set(el, at);
  }
}

/** Tween `targets` into place from a recipe's `from` (or where an interrupted run left them), with GSAP. */
export function playIn(gsap: Gsap, targets: gsap.TweenTarget, recipe: Recipe, extra: TweenVars = {}) {
  const r = prefersReducedMotion() ? reduce(recipe) : recipe;
  const keys = Object.keys(r.from);
  const from: TweenVars = {};
  for (const k of keys) from[k] = (_i: number, el: Element) => (interrupted.get(el)?.[k] ?? r.from[k]) as gsap.TweenValue;
  const els = gsap.utils.toArray<Element>(targets);
  const tween = gsap.fromTo(els, from, {
    ...r.to,
    ...extra,
    // Hand styling back to CSS by hand: GSAP's clearProps re-parses every
    // target's transform as it clears it, which upsets a form typing inside
    // (react-hook-form lost the tail of a word typed while a dialog arrived).
    onComplete: () => {
      for (const el of els) clearInline([el as HTMLElement]);
      markArrived(els);
    },
  });
  for (const el of els) interrupted.delete(el);
  return tween;
}

/* ── Web Animations fallback ─────────────────────────────────────────────── */

const EASE_BY_NAME = new Map<string, EaseName>(Object.entries(EASE_NAME).map(([k, v]) => [v, k as EaseName]));

function cssEase(ease: unknown): string {
  if (ease === "none") return "linear";
  const key = typeof ease === "string" ? EASE_BY_NAME.get(ease) : undefined;
  return `cubic-bezier(${EASE[key ?? "out"].join(",")})`;
}

const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : 0);

/** A recipe state as a CSS transform. */
function transformOf(v: TweenVars): string {
  const parts: string[] = [];
  if (num(v.xPercent) || num(v.yPercent)) parts.push(`translate(${num(v.xPercent)}%, ${num(v.yPercent)}%)`);
  if (num(v.x) || num(v.y)) parts.push(`translate(${num(v.x)}px, ${num(v.y)}px)`);
  if (v.scale !== undefined && num(v.scale) !== 1) parts.push(`scale(${num(v.scale)})`);
  return parts.join(" ") || "none";
}

const opacityOf = (v: TweenVars, rest = 1) => (v.opacity === undefined ? rest : num(v.opacity));

const canAnimate = () => typeof Element !== "undefined" && typeof Element.prototype.animate === "function";

/** Set a recipe's `from` as plain inline styles: the pre-state, before the first paint. */
function setPreState(els: HTMLElement[], r: Recipe) {
  for (const el of els) {
    const at = interrupted.get(el) as TweenVars | undefined;
    const v = at ?? r.from;
    el.style.opacity = String(opacityOf(v));
    const tf = transformOf(v);
    if (tf !== "none") el.style.transform = tf;
  }
}

function clearInline(els: HTMLElement[]) {
  for (const el of els) {
    for (const p of ["opacity", "transform", "translate", "rotate", "scale"]) el.style.removeProperty(p);
  }
}

function waapi(els: HTMLElement[], from: TweenVars, to: TweenVars, delayOf: (i: number) => number, onDone: () => void) {
  const duration = num(to.duration ?? sec(DURATION.base)) * 1000;
  const easing = cssEase(to.ease);
  let left = els.length;
  const anims = els.map((el, i) => {
    const a = el.animate(
      [
        { opacity: opacityOf(from, Number(getComputedStyle(el).opacity) || 1), transform: transformOf(from) },
        { opacity: opacityOf(to), transform: transformOf(to) },
      ],
      { duration, delay: (delayOf(i) + num(to.delay)) * 1000, easing, fill: "both" },
    );
    a.onfinish = () => {
      if (--left === 0) onDone();
    };
    return a;
  });
  return () => anims.forEach((a) => a.cancel());
}

/* ── Entrances and exits ─────────────────────────────────────────────────── */

export interface EnterOptions {
  /** Seconds. */
  delay?: number;
  /** Seconds added for the i-th target (a stagger). */
  stagger?: (i: number) => number;
}

/**
 * Bring `els` in by `recipe`. Call from a layout effect, so the pre-state is
 * on before the first paint; the returned function stops it (from the
 * effect's cleanup).
 */
export function enter(els: HTMLElement[], recipe: Recipe, { delay = 0, stagger }: EnterOptions = {}): Playing {
  if (!els.length) return NOOP;
  const r = prefersReducedMotion() ? reduce(recipe) : recipe;
  const keys = Object.keys(r.from);
  const delayOf = (i: number) => delay + (stagger?.(i) ?? 0);
  let done = false;
  let stop: () => void = () => {};

  const withGsap = (gsap: Gsap) => {
    const t = playIn(gsap, els, r, { delay, ...(stagger ? { stagger: (i: number) => stagger(i) } : {}) });
    t.eventCallback("onComplete", () => {
      clearInline(els);
      done = true;
      markArrived(els);
    });
    stop = () => {
      hold(gsap, t, keys);
      t.kill();
      clearInline(els);
    };
  };

  const gsap = getGsap();
  if (gsap) {
    withGsap(gsap);
    return playing(() => stop(), () => done);
  }

  // No GSAP and no Web Animations (a test DOM): nothing could play it, so the
  // final state, and GSAP is not fetched for it.
  if (!canAnimate()) return NOOP;
  // GSAP is still on its way: hide before paint, then whichever comes first.
  setPreState(els, r);
  let state: "waiting" | "playing" | "stopped" = "waiting";
  const withWaapi = () => {
    if (!canAnimate()) {
      clearInline(els);
      done = true;
      return;
    }
    const from = { ...r.from, ...(interrupted.get(els[0]) as TweenVars | undefined) };
    for (const el of els) interrupted.delete(el);
    const cancel = waapi(els, from, r.to, delayOf, () => {
      clearInline(els);
      cancel();
      done = true;
      markArrived(els);
    });
    stop = () => {
      cancel();
      clearInline(els);
    };
  };
  const timer = setTimeout(() => {
    if (state !== "waiting") return;
    state = "playing";
    withWaapi();
  }, ENTER_PATIENCE_MS);
  loadGsap().then(
    (g) => {
      if (state !== "waiting") return;
      state = "playing";
      clearTimeout(timer);
      withGsap(g);
    },
    () => {},
  );
  return playing(
    () => {
      clearTimeout(timer);
      if (state === "waiting") clearInline(els);
      state = "stopped";
      stop();
    },
    () => done,
  );
}

/**
 * Take `els` out by `recipe.exit`, then `onDone`. GSAP if it is there, else the
 * Web Animations API, else at once. Never waits for GSAP.
 */
export function leave(els: HTMLElement[], recipe: Recipe, onDone: () => void): Playing {
  const r = prefersReducedMotion() ? reduce(recipe) : recipe;
  if (!els.length) {
    onDone();
    return NOOP;
  }
  // A DOM that cannot animate (jsdom in tests): leave at once, whatever is loaded.
  if (!canAnimate()) {
    onDone();
    return NOOP;
  }
  let done = false;
  const finish = () => {
    done = true;
    onDone();
  };
  const gsap = getGsap();
  if (gsap) {
    const tl = gsap.timeline({ onComplete: finish });
    for (const el of els) tl.add(gsap.to(el, r.exit), 0);
    return playing(
      () => {
        // A reopen mid-exit carries on from here.
        for (const t of tl.getChildren(false, true, false)) hold(gsap, t as gsap.core.Tween, Object.keys(r.from));
        tl.kill();
      },
      () => done,
    );
  }
  const cancel = waapi(els, {}, r.exit, () => 0, finish);
  return playing(cancel, () => done);
}
