import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion, type Transition, type Variants } from "motion/react";
// Vanilla (non-React) motion — the hybrid WAAPI engine. animate() here precompiles
// a spring to a linear() easing and runs it on the COMPOSITOR thread, so it stays
// smooth while Lenis's scroll rAF + React saturate the main thread.
import { animate, inView, stagger } from "motion";
import { ImageIcon, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { staggerContainer } from "@/lib/motion";

/* ─────────────────────────────────────────────────────────────────────────────
 * Brand-surface building blocks for the marketing landing page.
 *
 * Register = BRAND (design is the product): lifted shadows, soft glows, editorial
 * confidence. Scroll-reveals are varied per content (a panel slides in from the
 * side it lives on, a frame rises and settles, a grid staggers) — never one
 * uniform fade on every section. Bilingual-by-symmetry (logical properties) and
 * reduced-motion correct: every reveal collapses to its final, visible state.
 * ────────────────────────────────────────────────────────────────────────── */

/*
 * Motion = spring physics, transform + opacity ONLY (no blur/filter/layout
 * animation) — GPU-composited, so the bounce stays at 60fps. Two springs: a
 * bouncy POP for content that should feel lively, and a calmer GLIDE for the
 * large device frames (a big rasterised layer doesn't want to overshoot).
 */
const POP: Transition = { type: "spring", stiffness: 300, damping: 18, mass: 0.85 };
const GLIDE: Transition = { type: "spring", stiffness: 190, damping: 24 };
const HOVER: Transition = { type: "spring", stiffness: 380, damping: 22 };

/** Per-variant target states (pure transforms) + the spring each one rides. */
export type RevealVariant = "rise" | "fade" | "left" | "right" | "scale";

const TARGETS: Record<RevealVariant, Variants> = {
  rise: { hidden: { opacity: 0, y: 44 }, show: { opacity: 1, y: 0 } },
  fade: { hidden: { opacity: 0 }, show: { opacity: 1 } },
  left: { hidden: { opacity: 0, x: -64 }, show: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 64 }, show: { opacity: 1, x: 0 } },
  scale: { hidden: { opacity: 0, y: 36, scale: 0.94 }, show: { opacity: 1, y: 0, scale: 1 } },
};
const SPRING: Record<RevealVariant, Transition> = {
  rise: POP,
  fade: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  left: GLIDE,
  right: GLIDE,
  scale: GLIDE,
};

// Fire a touch before fully in view so content is mid-spring as it slides up.
const REVEAL_VIEWPORT = { once: true, amount: 0.15 as const, margin: "0px 0px -12% 0px" };

/**
 * Scroll-reveal wrapper: springs in once as it enters the viewport. Under
 * reduced-motion it renders statically (no opacity gate), so content is never
 * trapped invisible. An optional `lift` adds a spring hover for tactile cards.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  variant = "rise",
  lift = false,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: RevealVariant;
  lift?: boolean;
  as?: "div" | "section" | "li" | "span";
}) {
  const reduced = useReducedMotion();
  if (reduced) {
    const Static = as as "div";
    return <Static className={className}>{children}</Static>;
  }
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      className={className}
      variants={TARGETS[variant]}
      initial="hidden"
      whileInView="show"
      viewport={REVEAL_VIEWPORT}
      transition={{ ...SPRING[variant], delay }}
      whileHover={lift ? { y: -6, transition: HOVER } : undefined}
    >
      {children}
    </Comp>
  );
}

/** Stagger container: children (RevealItem) spring in sequence as the group enters. */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={staggerContainer(stagger)}
      initial="hidden"
      whileInView="show"
      viewport={REVEAL_VIEWPORT}
    >
      {children}
    </motion.div>
  );
}

const ITEM_VARIANT: Variants = {
  hidden: { opacity: 0, y: 34, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: POP },
};

/**
 * A single reveal item to drop inside <RevealGroup>: pops up with a little bounce.
 * `lift` gives it a springy hover (use for cards / framed shots, not text rows).
 */
export function RevealItem({
  children,
  className,
  lift = false,
}: {
  children: ReactNode;
  className?: string;
  lift?: boolean;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={ITEM_VARIANT}
      whileHover={lift ? { y: -8, scale: 1.025, transition: HOVER } : undefined}
    >
      {children}
    </motion.div>
  );
}

/**
 * GPU-accelerated stagger reveal — for heavy, image-dense groups (the device
 * frames) where a main-thread spring would stutter against Lenis's scroll loop.
 *
 * Drives the entrance with motion's VANILLA animate()/inView() (the hybrid WAAPI
 * engine): the spring precompiles to a linear() easing and runs on the COMPOSITOR
 * thread — and an active WAAPI transform promotes each layer, so animating `scale`
 * no longer re-rasterises the frame's shadow + rounded corners every frame. Same
 * bouncy feel as <RevealGroup>, none of the main-thread cost.
 *
 * Correctness: the resting (revealed) state is the DEFAULT. The hidden state is
 * applied by JS only just before animating, so reduced-motion / no-JS / a missed
 * observer can never trap content invisible. Children to animate carry [data-reveal].
 */
export function GpuStaggerReveal({
  children,
  className,
  amount = 0.2,
}: {
  children: ReactNode;
  className?: string;
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || reduced) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!items.length) return;

    // Hidden state via JS (the rendered default stays visible).
    for (const el of items) {
      el.style.opacity = "0";
      el.style.transform = "translateY(34px) scale(0.92)";
      el.style.willChange = "transform, opacity";
    }

    let fired = false;
    const stop = inView(
      root,
      () => {
        if (fired) return;
        fired = true;
        const controls = animate(
          items,
          { opacity: [0, 1], transform: ["translateY(34px) scale(0.92)", "translateY(0px) scale(1)"] },
          // Same POP spring as RevealItem — precompiled to a GPU linear() here.
          { type: "spring", stiffness: 300, damping: 20, mass: 0.85, delay: stagger(0.08) },
        );
        // Drop the layer hint once settled so we don't keep N promoted layers.
        controls.finished
          .then(() => {
            for (const el of items) el.style.willChange = "auto";
          })
          .catch(() => {});
      },
      { amount },
    );
    return () => stop();
  }, [reduced, amount]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/* ── Screenshot with graceful placeholder ──────────────────────────────────── */

/**
 * Renders a screenshot, falling back to a tasteful labeled placeholder when the
 * asset isn't on disk yet (or fails to load). The page ships before the images
 * land in /public/screenshots — each frame shows where its shot will go.
 */
export function Screenshot({
  src,
  fallbackSrc,
  alt,
  label,
  className,
  priority = false,
}: {
  src?: string;
  /** Tried if `src` fails to load (e.g. a not-yet-captured variant) before the
   *  placeholder — e.g. a dark/AR POS shot falls back to the en/light default. */
  fallbackSrc?: string;
  alt: string;
  label: string;
  className?: string;
  /** Above-the-fold (hero) shot: load eagerly with high fetch priority for LCP. */
  priority?: boolean;
}) {
  const [errored, setErrored] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  // Reset when the source changes (e.g. EN ⇄ AR or light ⇄ dark swap).
  useEffect(() => {
    setErrored(false);
    setUsingFallback(false);
  }, [src, fallbackSrc]);

  const current = usingFallback ? fallbackSrc : src;

  if (!current || errored) {
    return (
      <div
        className={cn(
          "grid size-full place-items-center bg-gradient-to-br from-muted to-secondary/60",
          className,
        )}
      >
        <div className="flex flex-col items-center gap-2 px-6 text-center">
          <span className="grid size-10 place-items-center rounded-full bg-background/70 text-muted-foreground shadow-xs">
            <ImageIcon className="size-5" />
          </span>
          <span className="text-sm font-medium text-foreground/80">{label}</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={current}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      onError={() => {
        // Try the fallback once, then give up to the placeholder.
        if (fallbackSrc && !usingFallback && fallbackSrc !== src) setUsingFallback(true);
        else setErrored(true);
      }}
      className={cn("size-full object-cover object-top", className)}
    />
  );
}

/* ── Device frames ─────────────────────────────────────────────────────────── */

/**
 * A browser chrome wrapper for dashboard (product) shots. Renders its own
 * traffic-lights + URL pill, so capture content-only (no real browser chrome).
 * Content area is 16:10 to match the dashboard captures.
 */
export function BrowserFrame({
  children,
  url = "madar-pos.cloud",
  className,
}: {
  children: ReactNode;
  url?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-2xl ring-1 ring-foreground/5",
        className,
      )}
    >
      {/* Title bar */}
      <div className="flex items-center gap-3 border-b border-border bg-muted/70 px-4 py-2.5">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
        </div>
        <div className="mx-auto flex min-w-0 max-w-xs flex-1 items-center justify-center gap-1.5 rounded-md bg-background/80 px-3 py-1 text-xs text-muted-foreground">
          <Lock className="size-3 shrink-0" />
          <span className="min-w-0 truncate" dir="ltr">{url}</span>
        </div>
        <div className="w-12" aria-hidden />
      </div>
      {/* Content */}
      <div className="aspect-[16/10] bg-muted">{children}</div>
    </div>
  );
}

/**
 * An iPad (landscape) bezel for the SwiftUI POS shots. The POS renders its wide
 * iPad/desktop layout; content area is 4:3 with object-contain so off-aspect
 * captures letterbox rather than crop.
 */
export function IpadFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[1.6rem] bg-gradient-to-b from-neutral-800 to-neutral-900 p-3 shadow-2xl ring-1 ring-black/20 dark:from-neutral-900 dark:to-black",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-[0.85rem] bg-black">
        {/* Front camera */}
        <span
          className="absolute start-1/2 top-2 z-10 size-1.5 -translate-x-1/2 rounded-full bg-white/25 rtl:translate-x-1/2"
          aria-hidden
        />
        {/* Matches the iPad Pro 11" capture (2420×1668) so shots fill edge to edge. */}
        <div className="aspect-[2420/1668] bg-muted">{children}</div>
      </div>
    </div>
  );
}

/** A phone bezel for the customer-facing brand surfaces (public ordering / track). */
export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[2rem] bg-gradient-to-b from-neutral-800 to-neutral-900 p-2 shadow-2xl ring-1 ring-black/20 dark:from-neutral-900 dark:to-black",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-[1.5rem] bg-black">
        {/* Notch */}
        <span
          className="absolute start-1/2 top-1.5 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-white/20 rtl:translate-x-1/2"
          aria-hidden
        />
        <div className="aspect-[9/19.5] bg-muted">{children}</div>
      </div>
    </div>
  );
}
