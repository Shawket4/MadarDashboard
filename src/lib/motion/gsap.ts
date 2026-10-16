import type { gsap as GsapCore } from "gsap";

import { EASE, EASE_NAME, REGISTER, sec, type EaseName } from "./tokens";

/**
 * GSAP, loaded lazily. Nothing outside src/lib/motion imports it (lint
 * enforces that): the core is fetched in its own chunk after the first paint,
 * and until it lands every motion primitive renders its final state, still.
 * Content is never hidden while waiting for an animation library.
 */
export type Gsap = typeof GsapCore;
export type Tween = GSAPTween;
export type Timeline = GSAPTimeline;
export type TweenVars = GSAPTweenVars;

let core: Gsap | null = null;
let pending: Promise<Gsap> | null = null;

/** GSAP if it has loaded, else null. Motion code treats null as "show it still". */
export function getGsap(): Gsap | null {
  return core;
}

/** Load GSAP once, with the motion eases registered. Safe to call repeatedly. */
export function loadGsap(): Promise<Gsap> {
  pending ??= Promise.all([import("gsap"), import("gsap/CustomEase")]).then(([g, c]) => {
    const gsap = g.gsap;
    gsap.registerPlugin(c.CustomEase);
    for (const name of Object.keys(EASE) as EaseName[]) {
      c.CustomEase.create(EASE_NAME[name], EASE[name].join(","));
    }
    gsap.defaults({ duration: sec(REGISTER.product.duration), ease: EASE_NAME.out });
    // Targets that unmounted mid-tween are expected, not an error.
    gsap.config({ nullTargetWarn: false });
    core = gsap;
    return gsap;
  });
  return pending;
}

/**
 * Fetch GSAP once the first paint is done, so the first animation finds it
 * ready. Called once per bundle, at boot. A failed fetch (offline, a blocked
 * chunk) leaves the app still and working; the next call tries again.
 */
export function preloadGsap(): void {
  if (typeof window === "undefined") return;
  const go = () =>
    void loadGsap().catch(() => {
      pending = null;
    });
  if ("requestIdleCallback" in window) window.requestIdleCallback(go, { timeout: 1500 });
  else setTimeout(go, 200);
}

export type FlipPlugin = typeof import("gsap/Flip").Flip;
let flip: Promise<FlipPlugin> | null = null;
let flipCore: FlipPlugin | null = null;
/** The Flip plugin, on first use (only the lists that reorder need it). */
export function loadFlip() {
  flip ??= Promise.all([loadGsap(), import("gsap/Flip")]).then(([gsap, f]) => {
    gsap.registerPlugin(f.Flip);
    flipCore = f.Flip;
    return f.Flip;
  });
  return flip;
}
/** Flip if it has loaded, else null. */
export function getFlip(): FlipPlugin | null {
  return flipCore;
}
