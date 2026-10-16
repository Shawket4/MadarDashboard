import { createContext, useContext, useRef, type ComponentProps, type ReactNode } from "react";
import { Slot } from "radix-ui";

import { useCountUp, useReveal, useStagger, type CountUpOptions, type RevealOptions, type StaggerOptions } from "./hooks";
import { useReducedMotion } from "./media";
import { fade } from "./recipes";
import { DURATION } from "./tokens";

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
      <Comp ref={ref} {...props} />
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

/** Skeleton while loading, then the content fades in where the skeleton was. */
export function SkeletonSwap({
  loading,
  skeleton,
  className,
  children,
}: {
  loading: boolean;
  skeleton: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  if (loading) return <>{skeleton}</>;
  return (
    <Reveal className={className} recipe={fade(DURATION.base)}>
      {children}
    </Reveal>
  );
}
