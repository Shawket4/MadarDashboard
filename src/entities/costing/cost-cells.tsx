import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { fmtMoney, fmtPercent } from "@/shared/lib/format";
import type { AddonCost, SkuCost } from "@/shared/api/generated/models";

/** food_cost_pct traffic light: green <30%, amber 30–40%, red >40%. */
export function FoodCostChip({ pct }: { pct: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-semibold tabular",
        pct < 0.3
          ? "bg-success/10 text-success"
          : pct <= 0.4
            ? "bg-warning/10 text-warning"
            : "bg-destructive/10 text-destructive",
      )}
    >
      {fmtPercent(pct)}
    </span>
  );
}

/** Warning icon for cost_missing rows, linking to the recipe editor. */
export function CostMissingLink() {
  const { t } = useTranslation();
  return (
    <Link
      to="/menu/recipes"
      onClick={(e) => e.stopPropagation()}
      title={t("menu.costMissingFix")}
      className="inline-flex items-center text-warning hover:text-warning/80"
    >
      <AlertTriangle size={14} />
    </Link>
  );
}

/**
 * Cost / margin cell for a menu item — one line per SKU (size), since
 * costing is per (menu_item_id, size_label).
 */
export function ItemCostCell({ skus }: { skus: SkuCost[] }) {
  if (skus.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <div className="space-y-0.5">
      {skus.map((sku) => (
        <div key={sku.size_label} className="flex items-center gap-1.5 text-xs">
          {skus.length > 1 && <span className="text-muted-foreground">{sku.size_label}</span>}
          <span className="tabular">{fmtMoney(sku.cost)}</span>
          {sku.food_cost_pct != null && <FoodCostChip pct={sku.food_cost_pct} />}
          {sku.cost_missing && <CostMissingLink />}
        </div>
      ))}
    </div>
  );
}

/** Cost / margin cell for an addon item. */
export function AddonCostCell({ cost }: { cost: AddonCost | undefined }) {
  if (!cost) return <span className="text-muted-foreground text-xs">—</span>;
  const foodCostPct =
    cost.cost != null && cost.price > 0 ? cost.cost / cost.price : null;
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="tabular">{fmtMoney(cost.cost)}</span>
      {foodCostPct != null && <FoodCostChip pct={foodCostPct} />}
      {cost.cost_missing && <CostMissingLink />}
    </div>
  );
}
