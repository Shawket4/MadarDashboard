// "One ledger under everything": every surface writes to the same ledger, and every
// report reads from it. Built from Magic UI's AnimatedBeam (MIT), restyled.
import { useRef, type ReactNode, type RefObject } from "react";
import { AnimatedBeam } from "./AnimatedBeam";
import { cn } from "@/lib/utils";

type Labels = {
  till: string;
  ordering: string;
  inventory: string;
  loyalty: string;
  ledger: string;
  dashboard: string;
  exports: string;
  basira: string;
};

const I = {
  till: "M4 7h16v10H4zM8 7V4h8v3M8 12h3",
  inventory: "M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8",
  ordering: "M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2",
  loyalty: "M4 7h16v10H4zM4 11h16M8 15h2",
  dashboard: "M4 5h16v14H4zM8 15v-3M12 15V9M16 15v-5",
  exports: "M6 3h9l3 3v15H6zM9 13h6M9 17h6M9 9h3",
  basira: "M5 5h14v10H9l-4 4zM9 10h6",
};

function Node({ nodeRef, icon, label, center = false }: { nodeRef: RefObject<HTMLDivElement | null>; icon?: string; label: string; center?: boolean }) {
  return (
    <div
      ref={nodeRef}
      className={cn(
        "relative z-10 flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-sm font-medium shadow-sm",
        center
          ? "flex-col gap-2 border-teal/30 bg-ink px-6 py-5 text-paper shadow-[0_20px_50px_-20px_rgba(13,98,115,0.8)]"
          : "border-ink/10 bg-white text-ink",
      )}
    >
      {center ? (
        <svg viewBox="0 0 100 100" className="h-12 w-12" aria-hidden="true">
          <circle cx="50" cy="50" r="34" stroke="#EFF3F4" strokeWidth="6.5" fill="none" />
          <circle cx="50" cy="50" r="12" fill="#EFF3F4" />
          <circle cx="74.04" cy="25.96" r="8" fill="#0D6273" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-teal" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={icon} />
        </svg>
      )}
      <span>{label}</span>
    </div>
  );
}

export function LedgerBeams({ labels, rtl = false }: { labels: Labels; rtl?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const r = {
    till: useRef<HTMLDivElement>(null),
    ordering: useRef<HTMLDivElement>(null),
    inventory: useRef<HTMLDivElement>(null),
    loyalty: useRef<HTMLDivElement>(null),
    ledger: useRef<HTMLDivElement>(null),
    dashboard: useRef<HTMLDivElement>(null),
    exports: useRef<HTMLDivElement>(null),
    basira: useRef<HTMLDivElement>(null),
  };
  const inputs = ["till", "ordering", "inventory", "loyalty"] as const;
  const outputs = ["dashboard", "exports", "basira"] as const;
  const beam = (from: RefObject<HTMLDivElement | null>, to: RefObject<HTMLDivElement | null>, i: number, out = false): ReactNode => (
    <AnimatedBeam
      key={`${out ? "o" : "i"}${i}`}
      containerRef={container}
      fromRef={from}
      toRef={to}
      curvature={(i - 1.5) * 26}
      duration={3.6 + i * 0.35}
      delay={i * 0.2}
      reverse={rtl}
      pathColor="#14181E"
      pathOpacity={0.12}
      pathWidth={1.75}
      gradientStartColor="#2E94A6"
      gradientStopColor="#0D6273"
    />
  );

  return (
    <div ref={container} className="relative mx-auto grid w-full max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-6 sm:gap-10 md:gap-16">
      <div className="flex flex-col items-start gap-3">
        {inputs.map((k) => (
          <Node key={k} nodeRef={r[k]} icon={I[k]} label={labels[k]} />
        ))}
      </div>
      <Node nodeRef={r.ledger} label={labels.ledger} center />
      <div className="flex flex-col items-end gap-3">
        {outputs.map((k) => (
          <Node key={k} nodeRef={r[k]} icon={I[k]} label={labels[k]} />
        ))}
      </div>
      {inputs.map((k, i) => beam(r[k], r.ledger, i))}
      {outputs.map((k, i) => beam(r.ledger, r[k], i + 1, true))}
    </div>
  );
}
