/**
 * A Basira pie or donut that answers when it is pressed.
 *
 * Tapping (or clicking) a slice, or its legend entry, pins it: the slice pulls
 * out, the others fade, and the panel under the chart reads its label, its
 * figure in the column's own format and its share of the total. Pressing it
 * again, anywhere else, or Escape lets it go. A pointer hovering a slice
 * previews it while nothing is pinned, so a mouse gets the same reading free.
 *
 * The legend is the keyboard surface: each entry is a toggle button with the
 * whole reading in its accessible name, and the detail panel is a polite live
 * region. The plot stays left to right in Arabic like every chart here; the
 * legend and the panel follow the page's direction.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pie, PieChart, ResponsiveContainer, Sector, type PieSectorShapeProps } from "recharts";

import { CHART_COLORS } from "@/components/app/chart-card";
import { fmtShare } from "@/lib/format";
import { ChartEntrance, useChartMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { formatCell } from "./result-format";
import type { Column, ResultBlock } from "./types";

export interface PieSlice {
  label: string;
  /** The row's figure as the backend sent it (piastres for money). */
  raw: number | null;
  /** What the pie plots: never negative, pounds for money. */
  plot: number;
  /** Formatted figure, in the column's kind. */
  value: string;
  /** Formatted share of the total, e.g. `42.5%`. */
  share: string;
  color: string;
}

/**
 * The slices a result draws, with each one's reading. The share is of the
 * sum of what the pie plots, so the shares a merchant reads add up to the
 * circle they see. A null figure is "unknown", shown as an em dash and drawn
 * as nothing, never counted as zero sales.
 */
export function pieSlices(block: ResultBlock, measure: Column, labelKey: string): PieSlice[] {
  const plots = block.rows.map((row) => {
    const v = row[measure.key];
    if (v === null || v === undefined) return 0;
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return measure.kind === "money" ? n / 100 : n;
  });
  const total = plots.reduce((a, b) => a + b, 0);
  return block.rows.map((row, i) => {
    const v = row[measure.key];
    const raw = v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v);
    return {
      label: String(row[labelKey] ?? "—"),
      raw,
      plot: plots[i],
      value: formatCell(raw, measure.kind),
      share: fmtShare(plots[i], total),
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });
}

/** How far a selected slice pulls out of the pie, in px. */
const PULL = 8;

export function PieView({
  block,
  measure,
  labelKey,
  donut,
}: {
  block: ResultBlock;
  measure: Column;
  labelKey: string;
  donut: boolean;
}) {
  const { t } = useTranslation();
  const chartMotion = useChartMotion();
  const slices = useMemo(() => pieSlices(block, measure, labelKey), [block, measure, labelKey]);
  const [pinned, setPinned] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  // A pinned slice wins; hover previews only while nothing is pinned.
  const shown = pinned ?? hovered;
  const focus = shown !== null ? slices[shown] : undefined;

  const toggle = useCallback((i: number) => setPinned((p) => (p === i ? null : i)), []);

  // Pressing anywhere outside the chart lets the slice go, as does Escape.
  useEffect(() => {
    if (pinned === null) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setPinned(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPinned(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pinned]);

  const data = slices.map((s) => ({ name: s.label, plot: s.plot }));
  const reading = (s: PieSlice) =>
    t("basira.slice.aria", "{{label}}: {{value}}, {{share}} of the total", {
      label: s.label,
      value: s.value,
      share: s.share,
    });

  const shape = (props: PieSectorShapeProps) => {
    const i = props.index;
    const active = shown === i;
    return (
      <Sector
        {...props}
        fill={slices[i]?.color}
        outerRadius={(props.outerRadius ?? 0) + (active ? PULL : 0)}
        opacity={shown === null || active ? 1 : 0.35}
        stroke="var(--card)"
        strokeWidth={active ? 2 : 1}
        className="cursor-pointer outline-none transition-opacity"
        data-slice={i}
        data-selected={active || undefined}
      />
    );
  };

  return (
    <div
      ref={root}
      className="space-y-3"
      // A press on the chart's empty space (not a slice) lets go too.
      onClick={() => setPinned(null)}
    >
      <ChartEntrance className="h-60 w-full">
        <div dir="ltr" className="size-full" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart accessibilityLayer={false}>
              <Pie
                data={data}
                dataKey="plot"
                nameKey="name"
                innerRadius={donut ? "55%" : 0}
                outerRadius="78%"
                paddingAngle={1}
                rootTabIndex={-1}
                shape={shape}
                onClick={(_, i, e) => {
                  e.stopPropagation();
                  setHovered(null);
                  toggle(i);
                }}
                onMouseEnter={(_, i) => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                {...chartMotion}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartEntrance>

      <div
        aria-live="polite"
        data-testid="pie-detail"
        className="flex min-h-12 items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2 text-sm"
      >
        {focus ? (
          <>
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: focus.color }} />
            <span className="min-w-0 flex-1 truncate font-medium text-foreground">{focus.label}</span>
            <span className="flex shrink-0 flex-col items-end leading-tight">
              <span className="font-mono font-semibold tabular-nums text-foreground">{focus.value}</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {t("basira.slice.share", "{{share}} of the total", { share: focus.share })}
              </span>
            </span>
          </>
        ) : (
          <span className="text-[13px] text-muted-foreground">
            {t("basira.slice.hint", "Tap a slice to see its figures")}
          </span>
        )}
      </div>

      <ul
        aria-label={t("basira.slice.legend", "Slices of {{measure}}", { measure: measure.label })}
        className="flex flex-wrap gap-1.5"
      >
        {slices.map((s, i) => (
          <li key={i}>
            <button
              type="button"
              aria-pressed={pinned === i}
              aria-label={reading(s)}
              onClick={(e) => {
                e.stopPropagation();
                setHovered(null);
                toggle(i);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                pinned === i
                  ? "border-foreground/40 bg-accent text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-muted",
                shown !== null && shown !== i && "opacity-60",
              )}
            >
              <span className="size-2 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="max-w-40 truncate">{s.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
