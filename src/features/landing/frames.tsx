import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
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

// A gentle, unhurried ease — content settles in softly (ease-out-quint), never snaps.
const EASE = [0.22, 1, 0.36, 1] as const;
const FRAME_DURATION = 0.95;

/** A reveal vocabulary — each entrance fits what it reveals, not a single reflex. */
export type RevealVariant = "rise" | "fade" | "left" | "right" | "scale";

const VARIANTS: Record<RevealVariant, Variants> = {
  rise: { hidden: { opacity: 0, y: 40, filter: "blur(8px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)" } },
  fade: { hidden: { opacity: 0, filter: "blur(6px)" }, show: { opacity: 1, filter: "blur(0px)" } },
  left: { hidden: { opacity: 0, x: -56 }, show: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 56 }, show: { opacity: 1, x: 0 } },
  scale: { hidden: { opacity: 0, y: 36, scale: 0.955 }, show: { opacity: 1, y: 0, scale: 1 } },
};

// Fire a touch before the element is fully in view so content is mid-reveal as it
// slides up — more of the page is always animating in as you scroll.
const REVEAL_VIEWPORT = { once: true, amount: 0.15 as const, margin: "0px 0px -12% 0px" };

/**
 * Scroll-reveal wrapper: eases in once as it enters the viewport. Under
 * reduced-motion it renders statically (no opacity gate), so content is never
 * trapped invisible.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  duration = FRAME_DURATION,
  variant = "rise",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  variant?: RevealVariant;
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
      variants={VARIANTS[variant]}
      initial="hidden"
      whileInView="show"
      viewport={REVEAL_VIEWPORT}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </Comp>
  );
}

/** Stagger container: children (RevealItem) reveal in sequence as the group enters. */
export function RevealGroup({
  children,
  className,
  stagger = 0.1,
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
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: EASE } },
};

/** A single reveal item to drop inside <RevealGroup>. Eases up with a soft focus-in. */
export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={ITEM_VARIANT}>
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
