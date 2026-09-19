import { useTranslation } from "react-i18next";
import {
  CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart,
  Tooltip as ReTooltip, XAxis, YAxis,
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { fmtMoney, piastresToEgp } from "@/lib/format";
import type { MarginLedgerRow } from "@/data/api/generated/models";

/** Dot fill per Kasavana–Smith class. The server classifies; we only colour. */
const CLASS_COLOR: Record<string, string> = {
  star: "var(--success)",
  workhorse: "var(--info)",
  challenge: "var(--warning)",
  dog: "var(--destructive)",
};

interface Dot { x: number; y: number; row: MarginLedgerRow }

function DotTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Dot }> }) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  const { row } = payload[0].payload;
  return (
    <div className="min-w-[180px] space-y-1 rounded-xl border bg-popover p-3 text-xs shadow-lg">
      <p className="text-sm font-bold">
        {row.item_name}
        {row.size_label !== "one_size" ? <span className="text-muted-foreground"> · {row.size_label}</span> : null}
      </p>
      <p className="flex justify-between gap-4">
        <span className="text-muted-foreground">{t("insights.profitability.revenue", "Revenue")}</span>
        <span className="font-semibold tabular">{fmtMoney(row.revenue)}</span>
      </p>
      <p className="flex justify-between gap-4">
        <span className="text-muted-foreground">{t("insights.profitability.quantity", "Qty")}</span>
        <span className="tabular">{row.quantity_sold}</span>
      </p>
      <p className="flex justify-between gap-4">
        <span className="text-muted-foreground">{t("insights.profitability.margin", "Margin")}</span>
        <span className="font-semibold tabular">{row.margin != null ? fmtMoney(row.margin) : "—"}</span>
      </p>
      <p className="flex justify-between gap-4">
        <span className="text-muted-foreground">{t("insights.profitability.popularity", "Popularity")}</span>
        <span className="tabular">{(row.popularity_pct ?? 0).toFixed(1)}%</span>
      </p>
    </div>
  );
}

/**
 * Profit vs popularity, the classic menu-engineering quadrant. Only rows the
 * server could classify are plotted — an unclassified row has no honest
 * position on either axis, and guessing one would invent a verdict.
 */
export function QuadrantView({ rows }: { rows: MarginLedgerRow[] }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const plotted = rows.filter((r) => r.class && r.margin != null && r.quantity_sold > 0);
  const dots: Dot[] = plotted.map((r) => ({
    x: r.popularity_pct ?? 0,
    // Per-UNIT margin: the axis compares items, not volumes.
    y: piastresToEgp(r.margin! / r.quantity_sold),
    row: r,
  }));

  // Kasavana–Smith: popularity splits at the 70% rule (0.70/n, as a percent);
  // profit splits at the weighted-average unit margin.
  const popThreshold = plotted.length > 0 ? 70 / plotted.length : 0;
  const totalMargin = plotted.reduce((sum, r) => sum + (r.margin ?? 0), 0);
  const totalQty = plotted.reduce((sum, r) => sum + r.quantity_sold, 0);
  const avgUnitMargin = totalQty > 0 ? piastresToEgp(totalMargin / totalQty) : 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 grid grid-cols-2 px-8 text-xs text-muted-foreground">
          <span>{t("insights.quadrant.challengesDogs", "Challenges / Dogs")}</span>
          <span className="text-end">{t("insights.quadrant.starsWorkhorses", "Stars / Workhorses")}</span>
        </div>
        <ResponsiveContainer width="100%" height={420}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              type="number" dataKey="x" domain={[0, "auto"]} reversed={isRtl}
              name={t("insights.profitability.popularity", "Popularity")}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              type="number" dataKey="y" orientation={isRtl ? "right" : "left"}
              name={t("insights.profitability.margin", "Margin")}
              tickFormatter={(v: number) => v.toFixed(0)}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <ReferenceLine x={popThreshold} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
            <ReferenceLine y={avgUnitMargin} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
            <ReTooltip content={<DotTooltip />} />
            <Scatter data={dots}>
              {dots.map((d, i) => (
                <Cell key={i} fill={CLASS_COLOR[d.row.class!] ?? "var(--muted-foreground)"} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
          {(["star", "workhorse", "challenge", "dog"] as const).map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: CLASS_COLOR[c] }} />
              {t(`insights.class.${c}`, c)}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
