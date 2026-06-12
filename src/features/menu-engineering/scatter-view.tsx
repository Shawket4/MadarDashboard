import { useTranslation } from "react-i18next";
import {
  CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart,
  Tooltip as ReTooltip, XAxis, YAxis, Cell,
} from "recharts";
import { Card, CardContent } from "@/shared/ui/card";
import { fmtMoney, fmtPercent } from "@/shared/lib/format";
import { piastresToEgp } from "@/shared/lib/format";
import type { MenuEngineeringRow } from "@/shared/api/generated/models";
import { CLASS_COLOR, popularityThreshold, weightedAvgUnitProfit, type MenuClass } from "./lib";

interface Dot {
  x: number; // popularity_pct (0..1)
  y: number; // item_profit in EGP
  row: MenuEngineeringRow;
}

function DotTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Dot }> }) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  const { row } = payload[0].payload;
  return (
    <div className="bg-popover border border-border rounded-xl shadow-lg p-3 text-xs space-y-1 min-w-[180px]">
      <p className="font-bold text-sm">
        {row.item_name}
        {row.size_label !== "one_size" && <span className="text-muted-foreground"> · {row.size_label}</span>}
      </p>
      <p className="flex justify-between gap-4"><span className="text-muted-foreground">{t("menuEngineering.sales")}</span><span className="tabular font-semibold">{fmtMoney(row.sales)}</span></p>
      <p className="flex justify-between gap-4"><span className="text-muted-foreground">{t("menuEngineering.quantity")}</span><span className="tabular">{row.quantity_sold}</span></p>
      <p className="flex justify-between gap-4"><span className="text-muted-foreground">{t("menuEngineering.itemProfit")}</span><span className="tabular font-semibold">{fmtMoney(row.item_profit)}</span></p>
      <p className="flex justify-between gap-4"><span className="text-muted-foreground">{t("menuEngineering.popularity")}</span><span className="tabular">{fmtPercent(row.popularity_pct)}</span></p>
    </div>
  );
}

export function ScatterView({ rows }: { rows: MenuEngineeringRow[] }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  // Cost-missing rows are excluded server-side — every row is classified.
  const dots: Dot[] = rows.map((r) => ({
    x: r.popularity_pct,
    y: piastresToEgp(r.item_profit),
    row: r,
  }));

  const popThreshold = popularityThreshold(rows);
  const avgProfitEgp = piastresToEgp(weightedAvgUnitProfit(rows));

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 text-xs text-muted-foreground mb-2 px-8">
          <span>{t("menuEngineering.quadrants.challenges")} / {t("menuEngineering.quadrants.dogs")}</span>
          <span className="text-end">{t("menuEngineering.quadrants.stars")} / {t("menuEngineering.quadrants.workhorses")}</span>
        </div>
        <ResponsiveContainer width="100%" height={420}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              dataKey="x"
              name={t("menuEngineering.popularity")}
              tickFormatter={(v) => fmtPercent(v)}
              tick={{ fontSize: 11 }}
              reversed={isRtl}
              domain={[0, "auto"]}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={t("menuEngineering.itemProfit")}
              tickFormatter={(v) => `${v.toFixed(0)}`}
              tick={{ fontSize: 11 }}
              orientation={isRtl ? "right" : "left"}
            />
            <ReferenceLine x={popThreshold} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
            <ReferenceLine y={avgProfitEgp} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
            <ReTooltip content={<DotTooltip />} />
            <Scatter data={dots}>
              {dots.map((d, i) => (
                <Cell key={i} fill={CLASS_COLOR[d.row.class as MenuClass]} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
          {(["star", "workhorse", "challenge", "dog"] as const).map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: CLASS_COLOR[c] }} />
              {t(`menuEngineering.classes.${c}`)}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
