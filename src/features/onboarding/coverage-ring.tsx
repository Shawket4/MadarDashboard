import { fmtPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Pure-SVG circular progress ring for recipe coverage (0..1). */
export function CoverageRing({ ratio, size = 96, strokeWidth = 8, label, className }: {
  ratio: number; size?: number; strokeWidth?: number; label?: string; className?: string;
}) {
  const clamped = Math.min(1, Math.max(0, ratio));
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--primary)" strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - clamped)} className="transition-[stroke-dashoffset] duration-700" />
      </svg>
      <div className="absolute text-center">
        <p className="text-lg font-bold tabular">{fmtPercent(clamped)}</p>
        {label ? <p className="text-[10px] text-muted-foreground">{label}</p> : null}
      </div>
    </div>
  );
}
