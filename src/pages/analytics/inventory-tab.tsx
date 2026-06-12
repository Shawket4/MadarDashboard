import { useTranslation } from "react-i18next";
import { Package } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { EmptyState } from "@/shared/ui/empty-state";
import { Progress } from "@/shared/ui/progress";
import { Badge } from "@/shared/ui/badge";
import { useBranchStock as useBranchStockReport } from "@/shared/api/generated/api";
import { exportToExcel } from "@/shared/lib/excel";
import type { StockRow } from "@/shared/types";
import { ChartCard } from "./chart-card";



export function InventoryTab({ branchId }: { branchId: string }) {
  const { t, i18n } = useTranslation(); /* eslint-disable-next-line @typescript-eslint/no-unused-vars */ void i18n.language;
  const { data: report, isLoading } = useBranchStockReport(branchId, { query: { enabled: !!branchId } });

  const handleExport = () => {
    if (!report) return;
    exportToExcel({
      filename: "Stock-Levels",
      sheets: [{
        name: "Stock",
        title: t("analytics.stockLevels"),
        columns: [
          { key: "name", header: t("recipes.ingredient"), accessor: (s: StockRow) => s.ingredient_name, width: 28 },
          { key: "unit", header: "Unit", accessor: (s: StockRow) => s.unit, width: 10 },
          { key: "stock", header: t("inventory.stock.currentStock"), accessor: (s: StockRow) => Number(s.current_stock), type: "number", width: 14 },
          { key: "threshold", header: t("inventory.stock.reorderAt"), accessor: (s: StockRow) => Number(s.reorder_threshold), type: "number", width: 14 },
          { key: "low", header: t("common.status"), accessor: (s: StockRow) => s.below_reorder ? t("inventory.stock.low") : t("inventory.stock.ok"), width: 12 },
        ],
        rows: report.items,
      }],
    });
  };

  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (!report || report.items.length === 0) return <EmptyState icon={Package} title={t("analytics.noData")} />;

  return (
    <div className="space-y-4">
      <ChartCard title={t("analytics.stockLevels")} onExport={handleExport}>
        <div className="space-y-3 max-h-[520px] overflow-y-auto">
          {report.items.map((r) => {
            const pct = r.reorder_threshold > 0 ? Math.min(100, (Number(r.current_stock) / (Number(r.reorder_threshold) * 2)) * 100) : 100;
            return (
              <div key={r.branch_inventory_id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{r.ingredient_name}</span>
                  <div className="flex items-center gap-2">
                    {r.below_reorder && <Badge variant="destructive" className="text-xs">{t("inventory.stock.low")}</Badge>}
                    <span className="tabular text-xs">{Number(r.current_stock).toFixed(2)} / {Number(r.reorder_threshold).toFixed(2)} {r.unit}</span>
                  </div>
                </div>
                <Progress value={pct} className={r.below_reorder ? "[&>div]:bg-destructive" : ""} />
              </div>
            );
          })}
        </div>
      </ChartCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
