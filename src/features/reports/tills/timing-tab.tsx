import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Clock, DoorClosed, DoorOpen, Hourglass } from "lucide-react";

import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDuration, fmtElapsedMs, fmtHour, fmtNumber } from "@/lib/format";
import type { TillSessionRow } from "@/data/api/generated/models";
import { byHour, fmtMinutesOfDay, timingStats } from "./lib";

/**
 * When drawers open, when they close, and for how long. The averages are
 * CIRCULAR (see `meanTimeOfDay`) — a plain mean of clock times is nonsense
 * across midnight, and a late-night branch would report an average open of
 * lunchtime.
 */
export function TimingTab({ rows, loading }: { rows: TillSessionRow[]; loading: boolean }) {
  const { t } = useTranslation();
  const s = useMemo(() => timingStats(rows), [rows]);
  const hours = useMemo(() => byHour(rows), [rows]);

  if (loading) return <Skeleton className="h-64 w-full" />;
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
      hint: s.longest ? `${s.longest.teller_name} · ${s.longest.branch_name}` : undefined,
    },
  ];

  return (
    <div className="space-y-4">
      <LedgerStrip items={strip} />

      <Card className="py-0">
        <CardHeader className="pt-4">
          <CardTitle className="text-base">{t("reports.tills.byHour", "Opens and closes by hour")}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={hours} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="hour"
                tickFormatter={(h: number) => fmtHour(h)}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                interval={2}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={(v: number) => fmtNumber(v)}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                labelFormatter={(h) => fmtHour(Number(h))}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="opened"
                name={t("reports.tills.opened", "Opened")}
                fill="var(--color-primary)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="closed"
                name={t("reports.tills.closed", "Closed")}
                fill="var(--color-muted-foreground)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
