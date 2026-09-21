import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useReducedMotion } from "motion/react";
import {
  CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart,
  Tooltip as ReTooltip, XAxis, YAxis,
} from "recharts";

import { CHART_AXIS_TICK, ChartCard } from "@/components/app/chart-card";
import { fmtMoney, fmtNumber, fmtPercent } from "@/lib/format";
import type { MarginLedgerRow } from "@/data/api/generated/models";
import { QUADRANT_CLASSES, quadrantModel, type QuadrantClass, type QuadrantDot } from "./quadrant";

/**
 * Each class gets a hue AND a shape. Red/green alone is the pair a colour-blind
 * reader cannot separate, and star-vs-dog is exactly the distinction this chart
 * exists to make (DESIGN.md, the No-Color-Alone Rule).
 */
const CLASS_MARK: Record<QuadrantClass, { color: string; shape: "star" | "square" | "triangle" | "circle"; fallback: string }> = {
  star: { color: "var(--success)", shape: "star", fallback: "Star" },
  workhorse: { color: "var(--info)", shape: "square", fallback: "Workhorse" },
  challenge: { color: "var(--warning)", shape: "triangle", fallback: "Challenge" },
  dog: { color: "var(--destructive)", shape: "circle", fallback: "Dog" },
};

const unitMargin = (row: MarginLedgerRow): number | null =>
  row.margin != null && row.quantity_sold > 0 ? Math.round(row.margin / row.quantity_sold) : null;

function DotTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: QuadrantDot }> }) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  const { row, x } = payload[0].payload;
  const line = (label: string, value: string, strong = false) => (
    <p className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold tabular" : "tabular"}>{value}</span>
    </p>
  );
  return (
    <div className="min-w-[180px] space-y-1 rounded-xl border bg-popover p-3 text-xs text-popover-foreground shadow-lg">
      <p className="text-sm font-bold">
        {row.item_name}
        {row.size_label !== "one_size" ? <span className="text-muted-foreground"> · {row.size_label}</span> : null}
      </p>
      {row.class ? (
        <p className="text-muted-foreground">{t(`insights.class.${row.class}`, row.class)}</p>
      ) : null}
      {/* The two figures the dot is actually placed by come first. */}
      {line(t("insights.quadrant.unitMargin", "Margin per unit"), fmtMoney(unitMargin(row)), true)}
      {line(t("insights.profitability.popularity", "Popularity"), fmtPercent(x / 100), true)}
      {line(t("insights.profitability.quantity", "Qty"), fmtNumber(row.quantity_sold))}
      {line(t("insights.profitability.revenue", "Revenue"), fmtMoney(row.revenue))}
      {line(t("insights.profitability.margin", "Margin"), fmtMoney(row.margin))}
    </div>
  );
}

/**
 * Profit vs popularity, the classic menu-engineering quadrant. The server
 * classifies; this only places and colours. Rows it could not classify (no
 * sales, or cost unknown) are not plotted — they have no honest position on
 * either axis, and the page's "cost unknown" note already accounts for them.
 *
 * `rows` must be the WHOLE ledger, not the table's filtered view: the two
 * threshold lines are properties of the full classified set (see
 * `quadrantModel`).
 */
export function QuadrantView({ rows }: { rows: MarginLedgerRow[] }) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const model = useMemo(() => quadrantModel(rows), [rows]);

  const className = (c: QuadrantClass) => t(`insights.class.${c}`, CLASS_MARK[c].fallback);
  // The chart is an image to a screen reader; the sentence carries its verdict
  // and the Table view carries every figure.
  const summary = t("insights.quadrant.summary", {
    count: model.plotted,
    stars: fmtNumber(model.counts.star),
    workhorses: fmtNumber(model.counts.workhorse),
    challenges: fmtNumber(model.counts.challenge),
    dogs: fmtNumber(model.counts.dog),
    defaultValue:
      "{{count}} items by popularity and margin per unit: {{stars}} stars, {{workhorses}} workhorses, {{challenges}} challenges, {{dogs}} dogs. Switch to Table for the figures.",
  });

  return (
    <ChartCard
      title={t("insights.quadrant.title", "Popularity against margin per unit")}
      description={t("insights.quadrant.description", {
        popularity: fmtPercent(model.popularityThresholdPct / 100),
        margin: fmtMoney(Math.round(model.unitMarginThreshold)),
        defaultValue:
          "Dashed lines split high from low: {{popularity}} of units sold, and the average margin per unit of {{margin}}.",
      })}
    >
      {/* The plot is LTR in both languages (ChartCard), so the corner captions
          are pinned LTR with it — low popularity is always the left half. */}
      <div dir="ltr" className="mb-2 flex justify-between gap-4 ps-16 pe-5 text-xs text-muted-foreground">
        <span>{t("insights.quadrant.challengesDogs", "Challenges / Dogs")}</span>
        <span className="text-end">{t("insights.quadrant.starsWorkhorses", "Stars / Workhorses")}</span>
      </div>
      <div role="img" aria-label={summary} className="h-[420px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              type="number" dataKey="x" domain={[0, "auto"]}
              name={t("insights.profitability.popularity", "Popularity")}
              tickFormatter={(v: number) => fmtPercent(v / 100)}
              tick={CHART_AXIS_TICK} tickLine={false}
            />
            <YAxis
              type="number" dataKey="y" width={64}
              name={t("insights.quadrant.unitMargin", "Margin per unit")}
              tickFormatter={(v: number) => fmtMoney(v, { maxFractionDigits: 0, currency: false })}
              tick={CHART_AXIS_TICK} tickLine={false}
            />
            <ReferenceLine x={model.popularityThresholdPct} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
            <ReferenceLine y={model.unitMarginThreshold} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
            <ReTooltip content={<DotTooltip />} cursor={{ strokeDasharray: "3 3" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {QUADRANT_CLASSES.map((c) => (
              <Scatter
                key={c}
                name={className(c)}
                data={model.dots[c]}
                fill={CLASS_MARK[c].color}
                shape={CLASS_MARK[c].shape}
                legendType={CLASS_MARK[c].shape}
                isAnimationActive={!reduced}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
