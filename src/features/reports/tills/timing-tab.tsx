import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useReducedMotion } from "motion/react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Clock, DoorClosed, DoorOpen, Hourglass } from "lucide-react";

import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { CHART_AXIS_TICK, ChartCard, chartColor } from "@/components/app/chart-card";
import { ChartTooltipContent } from "@/components/app/chart-tooltip";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/data/api/errors";
import { fmtDuration, fmtElapsedMs, fmtHour, fmtNumber } from "@/lib/format";
import { byHour, fmtBusinessDate, fmtMinutesOfDay, timingStats } from "./lib";
import type { TillTabProps } from "./sales-tab";

/**
 * When drawers open, when they close, and for how long. The averages are
 * CIRCULAR (see `meanTimeOfDay`) — a plain mean of clock times is nonsense
 * across midnight, and a late-night branch would report an average open of
 * lunchtime.
 */
export function TimingTab({ rows, loading, error, onRetry }: TillTabProps) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const s = useMemo(() => timingStats(rows), [rows]);
  const hours = useMemo(() => byHour(rows), [rows]);

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (error) return <ErrorState message={typeof error === "string" ? error : getErrorMessage(error)} onRetry={onRetry} />;
  if (rows.length === 0) {
    return <EmptyState title={t("reports.tills.empty", "No till sessions opened in this period")} />;
  }

  const strip: LedgerItem[] = [
    {
      key: "open",
      label: t("reports.tills.avgOpen", "Typical open"),
      value: fmtMinutesOfDay(s.avgOpen),
      icon: DoorOpen,
      accent: "brand",
    },
    {
      key: "close",
      label: t("reports.tills.avgClose", "Typical close"),
      value: fmtMinutesOfDay(s.avgClose),
      icon: DoorClosed,
      hint:
        s.openNow > 0
          ? t("reports.tills.stillOpenCount", {
              count: s.openNow,
              defaultValue: "{{count}} still open",
            })
          : undefined,
    },
    {
      key: "duration",
      label: t("reports.tills.avgDuration", "Average length"),
      value: s.avgDurationMs == null ? "—" : fmtElapsedMs(s.avgDurationMs),
      icon: Hourglass,
    },
    {
      key: "longest",
      label: t("reports.tills.longest", "Longest session"),
      value: s.longest ? fmtDuration(s.longest.opened_at, s.longest.closed_at) : "—",
      icon: Clock,
      hint: s.longest
        ? `${s.longest.teller_name} · ${s.longest.branch_name} · ${fmtBusinessDate(s.longest.business_date)}`
        : undefined,
    },
  ];

  const chartSummary = t("reports.tills.byHourSummary", {
    open: fmtMinutesOfDay(s.avgOpen),
    close: fmtMinutesOfDay(s.avgClose),
    defaultValue: "Till opens and closes counted by hour of the day. Typical open {{open}}, typical close {{close}}.",
  });

  return (
    <div className="space-y-4">
      <LedgerStrip items={strip} />

      <ChartCard title={t("reports.tills.byHour", "Opens and closes by hour")}>
        {/* A picture to a screen reader: the sentence says what it shows, and
            the Sessions tab holds every open and close behind it. */}
        <div role="img" aria-label={chartSummary} className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hours} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="hour"
                tickFormatter={(h: number) => fmtHour(h)}
                tick={CHART_AXIS_TICK}
                tickLine={false}
                axisLine={false}
                interval={2}
              />
              <YAxis
                allowDecimals={false}
                width={32}
                tick={CHART_AXIS_TICK}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => fmtNumber(v)}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(h) => fmtHour(Number(h))}
                    formatter={(v) => fmtNumber(v)}
                  />
                }
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="opened"
                name={t("reports.tills.opened", "Opened")}
                fill={chartColor(0)}
                radius={[4, 4, 0, 0]}
                isAnimationActive={!reduced}
              />
              <Bar
                dataKey="closed"
                name={t("reports.tills.closed", "Closed")}
                // Not the next categorical hue: teal beside blue at the same
                // lightness is one colour to many eyes. Ink-grey against the
                // lead hue separates on lightness alone.
                fill="var(--muted-foreground)"
                radius={[4, 4, 0, 0]}
                isAnimationActive={!reduced}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
