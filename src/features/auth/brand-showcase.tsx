import { Component, lazy, Suspense, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { DURATION, prefersReducedMotion, recipes, Reveal, useReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Orbit2D, type ShowcaseTone } from "./orbit-2d";

/**
 * The signed-out pages' picture: the 3D showcase where it can run well, the 2D
 * orbit everywhere else. `size="panel"` fills the wide-screen brand panel;
 * `size="compact"` is the ink band above the form (every width on sign-up,
 * below the panel's breakpoint on sign-in).
 *
 * The 3D runs wherever the device can render it, phones included. It lives in
 * its own lazy chunk (three.js and the shared engine), requested only with
 * motion allowed and WebGL available (data saving does not opt out: the owner
 * wants it wherever it can render), so the reduced-motion
 * crowd never downloads it and the form never waits for it. It fades in once
 * its first frame is drawn. If it
 * hasn't arrived within a few seconds, fails to load, throws, or loses its GPU
 * context, the 2D orbit takes its place for the rest of the visit.
 */

const Showcase3D = lazy(() => import("./showcase-3d"));

/** Long enough for a normal connection, short enough that a slow one isn't left with a blank panel. */
const PATIENCE_MS = 4000;

const DESKTOP = "(min-width: 1024px)";

/** Wide enough for the brand panel (and for the 3D at all). */
export const useDesktop = () => useMedia(DESKTOP);

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof window.matchMedia !== "function") return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", notify);
      return () => mql.removeEventListener("change", notify);
    },
    () => typeof window.matchMedia === "function" && window.matchMedia(query).matches,
    () => false,
  );
}

function webglAvailable(): boolean {
  if (typeof window === "undefined" || !("WebGLRenderingContext" in window)) return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function wants3D(): boolean {
  if (typeof window === "undefined") return false;
  if (prefersReducedMotion()) return false;
  return webglAvailable();
}

/** Catches a failed chunk load or a render error inside the 3D, and hands over to the 2D. */
class ShowcaseBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** The 3D's footprint: room for the object and its caption, never taller than half the screen and a bit. */
const FRAME = {
  panel: "relative mx-auto h-[min(32rem,56svh)] w-full max-w-[38rem]",
  compact: "relative mx-auto h-[min(16rem,30svh)] w-full",
};

/** The 2D orbit's size in the band: small enough to leave the form above the fold on a phone. */
const ORBIT_COMPACT = "w-[min(100%,17rem,34svh)]";

type Mode = "loading" | "3d" | "2d";

export function BrandShowcase({
  className,
  size = "panel",
  tone = "ink",
}: {
  className?: string;
  size?: "panel" | "compact";
  tone?: ShowcaseTone;
}) {
  const desktop = useDesktop();
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<Mode>(() => (wants3D() ? "loading" : "2d"));

  // Not there in time: the 2D orbit for this visit.
  useEffect(() => {
    if (mode !== "loading" || (!desktop && size === "panel")) return;
    const id = window.setTimeout(() => setMode((m) => (m === "loading" ? "2d" : m)), PATIENCE_MS);
    return () => window.clearTimeout(id);
  }, [mode, desktop, size]);

  // The panel only shows on desktop widths; there, nothing to draw below them.
  if (!desktop && size === "panel") return null;

  // The 2D orbit only where the 3D can't run (see wants3D and the fallbacks).
  if (mode === "2d" || reduced) {
    return (
      <Reveal recipe={recipes.fade(DURATION.brand)} className={className}>
        <Orbit2D tone={tone} className={size === "compact" ? ORBIT_COMPACT : undefined} />
      </Reveal>
    );
  }

  return (
    <div aria-hidden="true" className={cn(FRAME[size], className)}>
      <ShowcaseBoundary onError={() => setMode("2d")}>
        <Suspense fallback={null}>
          <div
            className={cn(
              "size-full transition-opacity duration-brand ease-out",
              mode === "3d" ? "opacity-100" : "opacity-0",
            )}
          >
            <Showcase3D tone={tone} onReady={() => setMode("3d")} onFail={() => setMode("2d")} />
          </div>
        </Suspense>
      </ShowcaseBoundary>
    </div>
  );
}
