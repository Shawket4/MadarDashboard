import type { gsap as GsapCore } from "gsap";

import { EASE, EASE_NAME, REGISTER, sec, type EaseName } from "./tokens";

/**
 * GSAP, loaded lazily. Nothing outside src/lib/motion imports it (lint
 * enforces that): the core is fetched in its own chunk at boot (modulepreloaded),
 * and entrances that run before it lands still play: they wait for it,
 * hidden, at most ENTER_PATIENCE_MS, then use the Web Animations API (engine.ts).
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
    // Never let a long frame eat an entrance. Opening a dialog or a page costs
    // one long task (React's commit, layout); with GSAP's default (only gaps
    // over 500 ms are smoothed) a 160-220 ms entrance created in that task had
    // already finished by the first frame anyone saw: it "snapped". Any gap
    // over 50 ms now counts as one 16 ms frame, so the motion is always seen.
    gsap.ticker.lagSmoothing(50, 16);
    core = gsap;
    return gsap;
  });
  return pending;
}

/**
 * Fetch GSAP now, at boot, in parallel with the app (its chunk is also
 * modulepreloaded from the HTML, vite/preload-motion.ts). Entrances that run
 * before it lands still play (engine.ts). A failed fetch leaves the Web
 * Animations fallback; the next call tries again.
 */
export function preloadGsap(): void {
  if (typeof window === "undefined") return;
  void loadGsap().catch(() => {
    pending = null;
  });
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
