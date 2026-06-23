import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ChefHat, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BranchInventoryItem, OrgIngredient } from "@/data/api/generated/models";
import { addToBranchStock, updateBranchStock, useListMovements } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { fmtDateTime, fmtMoney, fmtNumber, fmtUnit } from "@/lib/format";
import { cn } from "@/lib/utils";
import { invalidateInventory } from "./lib";

// Branch cost (actual WAC) takes precedence over the org standard cost.
function displayCost(branchItem: BranchInventoryItem | null, orgItem: OrgIngredient | null) {
  return branchItem?.cost_per_unit ?? orgItem?.cost_per_unit ?? null;
}

interface Props {
  item: OrgIngredient | null;
  branchId: string | null;
  branchItem: BranchInventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onLogWaste: () => void;
}

/** Item detail: stock at the current branch (inline adjust) + stock history. */
export function ItemDrawer({ item, branchId, branchItem, open, onOpenChange, onEdit, onLogWaste }: Props) {
  const { t } = useTranslation();
  const [stock, setStock] = useState("");
  const [parMin, setParMin] = useState("");
  const [parMax, setParMax] = useState("");
  const [savingAdjust, setSavingAdjust] = useState(false);

  useEffect(() => {
    if (open) {
      setStock(branchItem ? String(branchItem.current_stock) : "");
      // Prefer par_min if set, fall back to legacy reorder_threshold
      setParMin(branchItem
        ? branchItem.par_min != null ? String(branchItem.par_min) : String(branchItem.reorder_threshold)
        : "");
      setParMax(branchItem?.par_max != null ? String(branchItem.par_max) : "");
    }
  }, [open, branchItem]);

  const movements = useListMovements(
    branchId ?? "",
    { org_ingredient_id: item?.id, per_page: 50 },
    { query: { enabled: open && !!branchId && !!item } },
  );

  const saveAdjust = async () => {
    if (!branchId || !item) return;
    const stockVal = stock.trim() === "" ? null : parseFloat(stock);
    const parMinVal = parMin.trim() === "" ? null : parseFloat(parMin);
    const parMaxVal = parMax.trim() === "" ? null : parseFloat(parMax);
    setSavingAdjust(true);
    try {
      if (branchItem) {
        await updateBranchStock(branchId, branchItem.id, { current_stock: stockVal, par_min: parMinVal, par_max: parMaxVal });
      } else {
        await addToBranchStock(branchId, { org_ingredient_id: item.id, current_stock: stockVal, par_min: parMinVal, par_max: parMaxVal });
      }
      await invalidateInventory();
      toast.success(t("common.savedChanges", "Changes saved"));
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSavingAdjust(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {item?.name}
            {item ? <Badge variant="secondary">{t(`inventory.catalog.cat_${item.category}`, item.category)}</Badge> : null}
          </SheetTitle>
          <SheetDescription>
            {item ? (
              <>
                {branchItem?.cost_per_unit != null
                  ? t("inventory.catalog.branchCost", "Branch cost")
                  : t("inventory.catalog.standardCost", "Standard cost")}
                {": "}
                <span className="tabular">{fmtMoney(displayCost(branchItem, item))}</span>
                {item.supplier_name ? <> · {item.supplier_name}</> : null}
              </>
            ) : null}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4">
          {/* Stock at current branch + inline adjust */}
          {branchId ? (
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-sm font-medium">{t("inventory.stockSettings", "Stock settings")}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">{t("inventory.catalog.onHand", "On hand")} ({fmtUnit(item?.unit)})</Label>
                  <Input type="number" step="0.0001" value={stock} onChange={(e) => setStock(e.target.value)} className="h-8 tabular" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("inventory.catalog.parMin", "Min par (reorder point)")}</Label>
                  <Input type="number" step="0.0001" min="0" placeholder="—" value={parMin} onChange={(e) => setParMin(e.target.value)} className="h-8 tabular" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("inventory.catalog.parMax", "Max par (order-up-to)")}</Label>
                  <Input type="number" step="0.0001" min="0" placeholder="—" value={parMax} onChange={(e) => setParMax(e.target.value)} className="h-8 tabular" />
                </div>
              </div>
              <Button size="sm" loading={savingAdjust} onClick={() => void saveAdjust()}>{t("common.save", "Save")}</Button>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              {t("inventory.pickBranch", "Select a branch to manage its stock")}
            </p>
          )}

          {/* Stock history */}
          {branchId ? (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">{t("inventory.stockHistory", "Stock history")}</p>
              {movements.isLoading ? (
                <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
              ) : (movements.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("inventory.movements.noMovements", "No movements yet")}</p>
              ) : (
                <ul className="space-y-2 pb-4">
                  {(movements.data ?? []).map((m) => (
                    <li key={m.id} className="flex items-start justify-between gap-3 border-b pb-2 text-sm last:border-0">
                      <div className="min-w-0">
                        <p className="font-medium">{t(`inventory.movements.types.${m.movement_type}`, m.movement_type)}</p>
                        <p className="text-xs text-muted-foreground tabular">{fmtDateTime(m.created_at)}</p>
                        {m.note ? <p className="text-xs text-muted-foreground">{m.note}</p> : null}
                      </div>
                      <div className="shrink-0 text-end tabular">
                        <span className={cn(m.quantity < 0 ? "text-destructive" : "text-success")}>
                          {m.quantity > 0 ? "+" : ""}{fmtNumber(m.quantity)} {fmtUnit(m.unit)}
                        </span>
                        {m.balance_after != null ? <p className="text-xs text-muted-foreground">{fmtNumber(m.balance_after)}</p> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </ScrollArea>

        <SheetFooter className="flex-row flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="size-4" /> {t("common.edit", "Edit")}
          </Button>
          {branchId ? (
            <Button variant="outline" size="sm" onClick={onLogWaste}>
              <Trash2 className="size-4" /> {t("inventory.waste.record", "Record waste")}
            </Button>
          ) : null}
          <Link to="/menu/recipes" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            <ChefHat className="size-4" /> {t("inventory.viewRecipes", "View recipes")}
          </Link>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
