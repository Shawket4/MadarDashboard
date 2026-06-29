import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ImageIcon, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { riseIn, fadeInUp, staggerContainer } from "@/lib/motion";

/* ─────────────────────────────────────────────────────────────────────────────
 * Brand-surface building blocks for the marketing landing page.
 *
 * Everything here is register = BRAND (design is the product): lifted shadows,
 * soft glows, editorial confidence. Still bilingual-by-symmetry (logical
 * properties only) and reduced-motion correct (entrances collapse to their final
 * state when the user opts out — content is never gated behind opacity:0).
 * ────────────────────────────────────────────────────────────────────────── */

/** Scroll-reveal wrapper. Animates once on enter; static under reduced-motion. */
export function Reveal({
  children,
  className,
  delay = 0,
  variant = "rise",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "rise" | "fade";
  as?: "div" | "section" | "li" | "span";
}) {
  const reduced = useReducedMotion();
  const Comp = motion[as] as typeof motion.div;
  if (reduced) {
    const Static = as as "div";
    return <Static className={className}>{children}</Static>;
  }
  // Mount-based entrance (not scroll-gated): the animation runs once and completes
  // regardless of scroll, so content is never trapped at opacity:0 below the fold
  // (the project convention — entrance enhances already-visible content).
  return (
    <Comp
      className={className}
      variants={variant === "rise" ? riseIn : fadeInUp}
      initial="hidden"
      animate="show"
      transition={{ delay }}
    >
      {children}
    </Comp>
  );
}

/** Stagger container for revealing a group of children in sequence on enter. */
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
      animate="show"
    >
      {children}
    </motion.div>
  );
}

/** A single reveal item to drop inside <RevealGroup>. */
export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={fadeInUp}>
      {children}
    </motion.div>
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
  alt,
  label,
  className,
}: {
  src?: string;
  alt: string;
  label: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  // Reset when the source changes (e.g. EN ⇄ AR language swap).
  useEffect(() => setErrored(false), [src]);

  if (!src || errored) {
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
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
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
        <div className="mx-auto flex max-w-xs flex-1 items-center justify-center gap-1.5 rounded-md bg-background/80 px-3 py-1 text-xs text-muted-foreground">
          <Lock className="size-3" />
          <span className="truncate" dir="ltr">{url}</span>
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
        <div className="aspect-[4/3] bg-muted">{children}</div>
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
