import { createContext, useContext, useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Slot } from "radix-ui";

import { getGsap, loadGsap } from "./gsap";
import {
  ARRIVAL_PATIENCE_MS,
  groupDelay,
  holdForGsap,
  holdInterrupted,
  playIn,
  useCountUp,
  useReveal,
  useStagger,
  type CountUpOptions,
  type RevealOptions,
  type StaggerOptions,
} from "./hooks";
import { useIsoLayoutEffect } from "./latest";
import { inViewport, prefersReducedMotion, useReducedMotion } from "./media";
import { fade, rise } from "./recipes";
import { DURATION, EASE_NAME, sec } from "./tokens";

type DivProps = Omit<ComponentProps<"div">, "ref">;

/**
 * True inside a Stagger or a ChartEntrance, which bring their items in with the
 * same commit that mounts them, so a chart card placed in one does not arrive
 * a second time on its own. (A Page's fade is not one: a chart that mounts
 * later in a page still needs its own entrance.)
 */
const Arriving = createContext(false);

/**
 * Rise into place on mount (or when `when` turns true). `asChild` puts the
 * motion on the single child instead of adding a wrapper.
 */
export function Reveal({
  asChild,
  register,
  recipe,
  delay,
  when,
  replayKey,
  scroll,
  ...props
}: DivProps & RevealOptions & { asChild?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref, { register, recipe, delay, when, replayKey, scroll });
  const Comp = asChild ? Slot.Root : "div";
  return <Comp ref={ref} {...props} />;
}

/** Bring the children in one after another (only those on screen, capped). */
export function Stagger({
  asChild,
  register,
  recipe,
  selector,
  when,
  replayKey,
  delay,
  ...props
}: DivProps & StaggerOptions & { asChild?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useStagger(ref, { register, recipe, selector, when, replayKey, delay });
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Arriving.Provider value>
      <Comp ref={ref} data-stagger="" {...props} />
    </Arriving.Provider>
  );
}

interface NumberProps extends Omit<ComponentProps<"span">, "ref" | "children"> {
  value: number;
  /** Formats the figure, including mid-count fractions. Use lib/format. */
  format: (n: number) => string;
}

/**
 * A KPI figure that counts up on first reveal, in lockstep with the charts
 * (DURATION.count), then shows later changes at once: after load the number
 * tells the truth instantly. Tabular numerals keep its width still.
 */
export function CountUp({ value, format, className, duration, ...props }: NumberProps & Pick<CountUpOptions, "duration">) {
  const ref = useRef<HTMLSpanElement>(null);
  useCountUp(ref, value, format, { duration });
  return (
    <span ref={ref} className={["tabular", className].filter(Boolean).join(" ")} {...props}>
      {format(value)}
    </span>
  );
}

/** A live figure: every change counts from the old value to the new one. */
export function AnimatedNumber({ value, format, className, duration = DURATION.slow, ...props }: NumberProps & { duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useCountUp(ref, value, format, { onChange: "tween", duration });
  return (
    <span ref={ref} className={["tabular", className].filter(Boolean).join(" ")} {...props}>
      {format(value)}
    </span>
  );
}

/**
 * Props for a Recharts series so its draw runs with the motion tokens: the
 * same duration as the KPI count-ups beside it, off under reduced motion.
 * Recharts keeps its own engine (it morphs between datasets); these are the
 * only values it reads.
 */
export function useChartMotion() {
  const reduced = useReducedMotion();
  return { isAnimationActive: !reduced, animationDuration: DURATION.count, animationEasing: "ease-out" as const };
}

/**
 * A chart card's entrance: the frame fades up while Recharts draws the series.
 * `ChartCard` already wears one; inside a Stagger it stays still and lets the
 * Stagger bring it in. `asChild` puts it on the single child.
 */
export function ChartEntrance({
  className,
  children,
  when,
  asChild,
}: {
  className?: string;
  children: ReactNode;
  when?: boolean;
  asChild?: boolean;
}) {
  const inside = useContext(Arriving);
  const Comp = asChild ? Slot.Root : "div";
  if (inside) return <Comp className={className}>{children}</Comp>;
  return (
    <Arriving.Provider value>
      <Reveal asChild={asChild} className={className} recipe={fade(DURATION.base)} when={when}>
        {children}
      </Reveal>
    </Arriving.Provider>
  );
}

/**
 * Skeleton while loading; when the data lands, the content rises in where the
 * skeleton was (in step with the Stagger it sits in) and the skeleton fades
 * out over it, never blinking. The content is a new element, hidden before
 * its first paint; if GSAP has not loaded yet it waits for it, hidden, at most
 * ARRIVAL_PATIENCE_MS. Content there from the start just shows (the page's or
 * the group's entrance covers it). Reduced motion: the content, at once.
 */
export function SkeletonSwap({
  loading,
  skeleton,
  className,
  contentClassName,
  children,
}: {
  loading: boolean;
  skeleton: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  const [prev, setPrev] = useState(loading);
  const [arrivals, setArrivals] = useState(0);
  const [leaving, setLeaving] = useState(false);
  if (prev !== loading) {
    setPrev(loading);
    if (!loading) {
      setArrivals((n) => n + 1);
      setLeaving(!prefersReducedMotion());
    } else setLeaving(false);
  }
  const content = useRef<HTMLDivElement>(null);
  const ghost = useRef<HTMLDivElement>(null);

  // The content rises in, before its first paint.
  useIsoLayoutEffect(() => {
    const el = content.current;
    if (!arrivals || !el || prefersReducedMotion() || !inViewport(el)) return;
    const r = rise();
    const play = (gsap: NonNullable<ReturnType<typeof getGsap>>) => playIn(gsap, el, r, { delay: groupDelay(el) });
    const gsap = getGsap();
    if (!gsap) return holdForGsap([el], r, play);
    const t = play(gsap);
    return () => {
      holdInterrupted(gsap, t);
      t.kill();
      gsap.set(el, { clearProps: "opacity,transform" });
    };
  }, [arrivals]);

  // The skeleton fades out over it, once GSAP is there to fade it. Off screen
  // it just goes (and GSAP is not fetched for it).
  useIsoLayoutEffect(() => {
    const el = ghost.current;
    if (!leaving || !el) return;
    if (!inViewport(el)) {
      setLeaving(false);
      return;
    }
    let tween: ReturnType<NonNullable<ReturnType<typeof getGsap>>["to"]> | undefined;
    let live = true;
    const fadeOut = (gsap: NonNullable<ReturnType<typeof getGsap>>) => {
      if (!live) return;
      tween = gsap.to(el, { opacity: 0, duration: sec(DURATION.base), ease: EASE_NAME.in, onComplete: () => setLeaving(false) });
    };
    const gsap = getGsap();
    if (gsap) fadeOut(gsap);
    else loadGsap().then(fadeOut, () => setLeaving(false));
    return () => {
      live = false;
      tween?.kill();
    };
  }, [leaving]);
  useEffect(() => {
    if (!leaving) return;
    const id = setTimeout(() => setLeaving(false), ARRIVAL_PATIENCE_MS + DURATION.slow);
    return () => clearTimeout(id);
  }, [leaving]);

  return (
    <div className={["relative", className].filter(Boolean).join(" ")}>
      {loading ? (
        skeleton
      ) : (
        <div key={arrivals} ref={content} data-arrive="" className={contentClassName}>
          {children}
        </div>
      )}
      {leaving && !loading ? (
        <div ref={ghost} aria-hidden className="pointer-events-none absolute inset-0">
          {skeleton}
        </div>
      ) : null}
    </div>
  );
}
