// Adapted from Magic UI's NumberTicker (https://magicui.design), MIT License,
// Copyright (c) Magic UI. Changes: the server renders the final value (so the number
// is right without JavaScript and for reduced motion), Western digits in both
// languages, and the count only runs when motion is allowed.
import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";
import { useInView, useMotionValue, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
  value: number;
  startValue?: number;
  delay?: number;
  decimalPlaces?: number;
}

const fmt = (n: number, d: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }).format(Number(n.toFixed(d)));

export function NumberTicker({ value, startValue = 0, delay = 0, className, decimalPlaces = 0, ...props }: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(startValue);
  const springValue = useSpring(motionValue, { damping: 60, stiffness: 100 });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!isInView) return;
    if (ref.current) ref.current.textContent = fmt(startValue, decimalPlaces);
    const timer = setTimeout(() => motionValue.set(value), delay * 1000);
    return () => clearTimeout(timer);
  }, [isInView, motionValue, delay, value, startValue, decimalPlaces]);

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current) ref.current.textContent = fmt(latest, decimalPlaces);
      }),
    [springValue, decimalPlaces],
  );

  return (
    <span ref={ref} className={cn("inline-block tabular-nums", className)} {...props}>
      {fmt(value, decimalPlaces)}
    </span>
  );
}
