import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtPercent } from "@/lib/format";
import type { AddonCost, SkuCost } from "@/data/api/generated/models";

/** food_cost_pct traffic light: green <30%, amber 30–40%, red >40%. */
export function FoodCostChip({ pct }: { pct: number }) {
  const Icon = pct < 0.3 ? CheckCircle2 : pct <= 0.4 ? AlertTriangle : AlertCircle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-semibold tabular",
        pct < 0.3 ? "bg-success/10 text-success" : pct <= 0.4 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive",
      )}
    >
      <Icon className="size-3 shrink-0" />
      {fmtPercent(pct)}
    </span>
  );
}

/** Warning icon for cost_missing rows, deep-linking to that item/add-on in recipes. */
export function CostMissingLink({ itemId, addonId }: { itemId?: string; addonId?: string }) {
  const { t } = useTranslation();
  const search = itemId ? { item: itemId } : addonId ? { addon: addonId } : undefined;
  return (
    <Link
      to="/menu/recipes"
      search={search as never}
      onClick={(e) => e.stopPropagation()}
      title={t("menu.costMissingFix", "Some ingredient costs are missing — open recipes to fix")}
      className="inline-flex items-center text-warning hover:text-warning/80"
    >
      <AlertTriangle className="size-3.5" />
    </Link>
  );
}

/** Cost / margin cell for a menu item — one line per SKU (size). */
export function ItemCostCell({ skus }: { skus: SkuCost[] }) {
  if (skus.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="space-y-0.5">
      {skus.map((sku) => (
        <div key={sku.size_label} className="flex items-center gap-1.5 text-xs">
          {skus.length > 1 ? <span className="text-muted-foreground">{sku.size_label}</span> : null}
          <span className="tabular">{fmtMoney(sku.cost)}</span>
          {sku.food_cost_pct != null ? <FoodCostChip pct={sku.food_cost_pct} /> : null}
          {sku.cost_missing ? <CostMissingLink itemId={sku.menu_item_id} /> : null}
        </div>
      ))}
    </div>
  );
}

/** Cost / margin cell for an addon item. */
export function AddonCostCell({ cost }: { cost: AddonCost | undefined }) {
  if (!cost) return <span className="text-xs text-muted-foreground">—</span>;
  const foodCostPct = cost.cost != null && cost.price > 0 ? cost.cost / cost.price : null;
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="tabular">{fmtMoney(cost.cost)}</span>
      {foodCostPct != null ? <FoodCostChip pct={foodCostPct} /> : null}
      {cost.cost_missing ? <CostMissingLink addonId={cost.addon_item_id} /> : null}
    </div>
  );
}
