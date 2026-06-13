import { useTranslation } from "react-i18next";
import {
  CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart,
  Tooltip as ReTooltip, XAxis, YAxis,
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { fmtMoney, fmtPercent, piastresToEgp } from "@/lib/format";
import type { MenuEngineeringRow } from "@/data/api/generated/models";
import { CLASS_COLOR, popularityThreshold, weightedAvgUnitProfit, type MenuClass } from "./lib";

interface Dot { x: number; y: number; row: MenuEngineeringRow }

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
      <p className="flex justify-between gap-4"><span className="text-muted-foreground">{t("menuEngineering.sales", "Sales")}</span><span className="font-semibold tabular">{fmtMoney(row.sales)}</span></p>
      <p className="flex justify-between gap-4"><span className="text-muted-foreground">{t("menuEngineering.quantity", "Qty")}</span><span className="tabular">{row.quantity_sold}</span></p>
      <p className="flex justify-between gap-4"><span className="text-muted-foreground">{t("menuEngineering.itemProfit", "Item Profit")}</span><span className="font-semibold tabular">{fmtMoney(row.item_profit)}</span></p>
      <p className="flex justify-between gap-4"><span className="text-muted-foreground">{t("menuEngineering.popularity", "Popularity")}</span><span className="tabular">{fmtPercent(row.popularity_pct)}</span></p>
    </div>
  );
}

export function ScatterView({ rows }: { rows: MenuEngineeringRow[] }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const dots: Dot[] = rows.map((r) => ({ x: r.popularity_pct, y: piastresToEgp(r.item_profit), row: r }));
  const popThreshold = popularityThreshold(rows);
  const avgProfitEgp = piastresToEgp(weightedAvgUnitProfit(rows));

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 grid grid-cols-2 px-8 text-xs text-muted-foreground">
          <span>{t("menuEngineering.quadrants.challenges", "Challenges")} / {t("menuEngineering.quadrants.dogs", "Dogs")}</span>
          <span className="text-end">{t("menuEngineering.quadrants.stars", "Stars")} / {t("menuEngineering.quadrants.workhorses", "Workhorses")}</span>
        </div>
        <ResponsiveContainer width="100%" height={420}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" dataKey="x" name={t("menuEngineering.popularity", "Popularity")} tickFormatter={(v) => fmtPercent(v)} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} reversed={isRtl} domain={[0, "auto"]} />
            <YAxis type="number" dataKey="y" name={t("menuEngineering.itemProfit", "Item Profit")} tickFormatter={(v) => `${v.toFixed(0)}`} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} orientation={isRtl ? "right" : "left"} />
            <ReferenceLine x={popThreshold} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
            <ReferenceLine y={avgProfitEgp} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
            <ReTooltip content={<DotTooltip />} />
            <Scatter data={dots}>
              {dots.map((d, i) => <Cell key={i} fill={CLASS_COLOR[d.row.class as MenuClass] ?? "var(--muted-foreground)"} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
          {(["star", "workhorse", "challenge", "dog"] as const).map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: CLASS_COLOR[c] }} />
              {t(`menuEngineering.classes.${c}`, c)}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
