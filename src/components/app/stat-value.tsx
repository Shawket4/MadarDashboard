import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, useInView, useMotionValue, useReducedMotion } from "motion/react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COUNT_ANIM_MS, easeOutQuart } from "@/lib/motion";
import { fmtMoney, fmtMoneyCompact, fmtNumber, fmtNumberCompact, fmtPercent } from "@/lib/format";

export type StatFormat = "money" | "number" | "percent";
type Fmt = (n: number) => string;

/**
 * Representations from richest (exact) to leanest, per type. The middle money
 * step drops decimals before falling back to K/M compaction — so "EGP 1,234.56"
 * becomes "EGP 1,235" (still the full figure) before ever becoming "EGP 1.2K".
 */
function formattersFor(formatType?: StatFormat): Fmt[] {
  if (formatType === "money") {
    return [(n) => fmtMoney(n), (n) => fmtMoney(n, { maxFractionDigits: 0 }), (n) => fmtMoneyCompact(n)];
  }
  if (formatType === "percent") return [(n) => fmtPercent(n)];
  return [(n) => fmtNumber(n), (n) => fmtNumberCompact(n)];
}

interface StatValueProps {
  value: number;
  formatType?: StatFormat;
  /** Shown in the expand popover header when the figure is shortened. */
  label: string;
  /** Candidate font sizes in px, largest → smallest, tried within the slot. */
  sizes: number[];
}

/**
 * A KPI figure that is *aware of its slot*: it measures the available width and
 * shows the richest representation that fits, shrinking the font within `sizes`
 * to keep the fuller number before it resorts to compacting. If it still has to
 * shorten (e.g. "EGP 1.2M"), the exact value is one click away. Counts up on
 * first reveal; honors prefers-reduced-motion.
 */
export function StatValue({ value, formatType, label, sizes }: StatValueProps) {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(wrapRef, { once: true, margin: "0px 0px -10% 0px" });

  const fmts = formattersFor(formatType);
  const exact = fmts[0](value);
  // Distinct representations for this value, richest → leanest.
  const reps: Fmt[] = (() => {
    const seen = new Set<string>();
    return fmts.filter((f) => {
      const s = f(value);
      if (seen.has(s)) return false;
      seen.add(s);
      return true;
    });
  })();

  const [repIdx, setRepIdx] = useState(0);
  const [size, setSize] = useState(sizes[0]);

  const mv = useMotionValue(reduced ? value : 0);
  const [shown, setShown] = useState(reduced ? value : 0);
  const started = useRef(reduced);

  useEffect(() => mv.on("change", (v) => setShown(v)), [mv]);
  useEffect(() => {
    if (reduced) {
      setShown(value);
      return;
    }
    if (!started.current) {
      if (inView) {
        started.current = true;
        const controls = animate(mv, value, { duration: COUNT_ANIM_MS / 1000, ease: easeOutQuart });
        return () => controls.stop();
      }
    } else {
      mv.set(value);
      setShown(value);
    }
  }, [inView, value, reduced, mv]);

  // Choose the richest representation + largest font that fits the slot.
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const meas = measureRef.current;
    if (!wrap || !meas) return;
    const candidates = formattersFor(formatType);
    const seen = new Set<string>();
    const distinct = candidates.filter((f) => {
      const s = f(value);
      if (seen.has(s)) return false;
      seen.add(s);
      return true;
    });
    const fit = () => {
      const avail = wrap.clientWidth;
      if (!avail) return;
      for (let ri = 0; ri < distinct.length; ri++) {
        meas.textContent = distinct[ri](value);
        for (let si = 0; si < sizes.length; si++) {
          meas.style.fontSize = `${sizes[si]}px`;
          if (Math.ceil(meas.getBoundingClientRect().width) <= avail) {
            setRepIdx(ri);
            setSize(sizes[si]);
            return;
          }
        }
      }
      setRepIdx(distinct.length - 1);
      setSize(sizes[sizes.length - 1]);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [value, formatType, sizes]);

  const rep = reps[Math.min(repIdx, reps.length - 1)];
  const shortened = rep(value) !== exact;
  // Counts are whole numbers — round mid-tween so the animation ticks up through
  // integers (1,2,3…) instead of flashing fractions. This also covers the
  // default (no formatType) case used by branch/order counts. Only money and
  // percent keep their formatter's decimals.
  const isDecimalType = formatType === "money" || formatType === "percent";
  const displayValue = isDecimalType ? shown : Math.round(shown);

  const valueSpan = (
    <span className="block truncate font-semibold leading-none tracking-tight tabular" style={{ fontSize: size }}>
      {rep(displayValue)}
    </span>
  );

  return (
    <div ref={wrapRef} className="relative min-w-0">
      {shortened ? (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="block w-full max-w-full text-start underline decoration-dotted decoration-muted-foreground/40 underline-offset-[5px] outline-none transition-colors hover:decoration-muted-foreground/70 focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              {valueSpan}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={8} className="w-auto px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-base font-semibold tabular">{exact}</p>
          </PopoverContent>
        </Popover>
      ) : (
        valueSpan
      )}
      {/* Off-screen measurer — same font metrics as the value. */}
      <span
        ref={measureRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 inline-block whitespace-nowrap font-semibold tracking-tight tabular opacity-0"
      />
    </div>
  );
}
