import { Component, lazy, Suspense, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import { Orbit2D } from "./orbit-2d";

/**
 * The sign-in panel's picture: the 3D showcase where it can run well, the 2D
 * orbit everywhere else.
 *
 * The 3D lives in its own lazy chunk (three.js and the shared engine) that is only
 * requested on a desktop-width screen, with motion allowed, data saving off and
 * WebGL available, so phones and the reduced-motion crowd never download it and
 * the form never waits for it. It fades in once its first frame is drawn. If it
 * hasn't arrived within a few seconds, fails to load, throws, or loses its GPU
 * context, the 2D orbit takes its place for the rest of the visit.
 */

const Showcase3D = lazy(() => import("./showcase-3d"));

/** Long enough for a normal connection, short enough that a slow one isn't left with a blank panel. */
const PATIENCE_MS = 4000;

const DESKTOP = "(min-width: 1024px)";
const REDUCED = "(prefers-reduced-motion: reduce)";

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
  if (typeof window.matchMedia === "function" && window.matchMedia(REDUCED).matches) return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return false;
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
const FRAME = "relative mx-auto h-[min(32rem,56svh)] w-full max-w-[38rem]";

type Mode = "loading" | "3d" | "2d";

export function BrandShowcase({ className }: { className?: string }) {
  const desktop = useMedia(DESKTOP);
  const reduced = useMedia(REDUCED);
  const [mode, setMode] = useState<Mode>(() => (wants3D() ? "loading" : "2d"));

  // Not there in time: the 2D orbit for this visit.
  useEffect(() => {
    if (mode !== "loading" || !desktop) return;
    const id = window.setTimeout(() => setMode((m) => (m === "loading" ? "2d" : m)), PATIENCE_MS);
    return () => window.clearTimeout(id);
  }, [mode, desktop]);

  // The panel only shows on desktop widths; elsewhere there's nothing to draw.
  if (!desktop) return null;

  if (mode === "2d" || reduced) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className={className}>
        <Orbit2D />
      </motion.div>
    );
  }

  return (
    <div aria-hidden="true" className={cn(FRAME, className)}>
      <ShowcaseBoundary onError={() => setMode("2d")}>
        <Suspense fallback={null}>
          <div
            className={cn(
              "size-full transition-opacity duration-700 ease-out",
              mode === "3d" ? "opacity-100" : "opacity-0",
            )}
          >
            <Showcase3D onReady={() => setMode("3d")} onFail={() => setMode("2d")} />
          </div>
        </Suspense>
      </ShowcaseBoundary>
    </div>
  );
}
