import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ChefHat, ClipboardList, Pencil, Trash2 } from "lucide-react";
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
import type { BranchStockRow, OrgIngredient } from "@/data/api/generated/models";
import { setParLevels, useListMovements } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { fmtDateTime, fmtMoney, fmtNumber, fmtUnit } from "@/lib/format";
import { cn } from "@/lib/utils";
import { invalidateInventory } from "./lib";

interface Props {
  item: OrgIngredient | null;
  branchId: string | null;
  stockRow: BranchStockRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onLogWaste: () => void;
  onCount: () => void;
}

/**
 * Ingredient detail at the selected branch. On hand is read-only: it is the
 * ledger's number. The way to correct it is to count the item.
 */
export function ItemDrawer({ item, branchId, stockRow, open, onOpenChange, onEdit, onLogWaste, onCount }: Props) {
  const { t } = useTranslation();
  const [parMin, setParMin] = useState("");
  const [parMax, setParMax] = useState("");
  const [savingPar, setSavingPar] = useState(false);

  useEffect(() => {
    if (open) {
      setParMin(stockRow?.par_min != null ? String(stockRow.par_min) : "");
      setParMax(stockRow?.par_max != null ? String(stockRow.par_max) : "");
    }
  }, [open, stockRow]);

  const movements = useListMovements(
    branchId ?? "",
    { org_ingredient_id: item?.id, per_page: 50 },
    { query: { enabled: open && !!branchId && !!item } },
  );

  const savePar = async () => {
    if (!branchId || !item) return;
    const par_min = parMin.trim() === "" ? null : parseFloat(parMin);
    const par_max = parMax.trim() === "" ? null : parseFloat(parMax);
    setSavingPar(true);
    try {
      await setParLevels(branchId, item.id, { par_min, par_max });
      await invalidateInventory();
      toast.success(t("common.savedChanges", "Changes saved"));
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSavingPar(false);
    }
  };

  const cost = stockRow?.cost_per_unit ?? item?.cost_per_unit ?? null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {item?.name}
            {item ? <Badge variant="secondary">{item.category_name}</Badge> : null}
          </SheetTitle>
          <SheetDescription>
            {item ? (
              <>
                {stockRow?.has_activity && stockRow.cost_per_unit != null
                  ? t("inventory.catalog.branchCost", "Branch cost")
                  : t("inventory.catalog.standardCost", "Standard cost")}
                {": "}
                <span className="tabular">{fmtMoney(cost)}</span>
                {item.supplier_name ? <> · {item.supplier_name}</> : null}
              </>
            ) : null}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4">
          {branchId ? (
            <div className="space-y-4">
              {/* Book stock — read-only, from the ledger */}
              <div className="rounded-lg border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("inventory.catalog.onHand", "On hand")}</p>
                <p className={cn("text-2xl font-semibold tabular", (stockRow?.on_hand ?? 0) < 0 && "text-destructive")}>
                  {fmtNumber(stockRow?.on_hand ?? 0)} <span className="text-base font-normal text-muted-foreground">{fmtUnit(item?.unit)}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stockRow?.last_counted_at
                    ? t("inventory.catalog.lastCounted", { when: fmtDateTime(stockRow.last_counted_at), defaultValue: `Last counted ${fmtDateTime(stockRow.last_counted_at)}` })
                    : t("inventory.catalog.neverCountedHint", "Never counted at this branch. Count it to set the real figure.")}
                </p>
                <Button size="sm" className="mt-3" onClick={onCount}>
                  <ClipboardList className="size-4" /> {t("inventory.catalog.countThisItem", "Count this item")}
                </Button>
              </div>

              {/* Par levels */}
              <div className="space-y-2 rounded-lg border p-3">
                <p className="text-sm font-medium">{t("inventory.catalog.reorderLevels", "Reorder levels")}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">{t("inventory.catalog.parMin", "Reorder point")} ({fmtUnit(item?.unit)})</Label>
                    <Input type="number" step="0.0001" min="0" placeholder="—" value={parMin} onChange={(e) => setParMin(e.target.value)} className="h-9 tabular" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("inventory.catalog.parMax", "Order up to")}</Label>
                    <Input type="number" step="0.0001" min="0" placeholder="—" value={parMax} onChange={(e) => setParMax(e.target.value)} className="h-9 tabular" />
                  </div>
                </div>
                <Button size="sm" variant="outline" loading={savingPar} onClick={() => void savePar()}>{t("common.save", "Save")}</Button>
              </div>

              {/* Stock history */}
              <div>
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
                          <p className="text-xs text-muted-foreground">{fmtNumber(m.balance_after)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              {t("inventory.pickBranch", "Select a branch to manage its stock")}
            </p>
          )}
        </ScrollArea>

        <SheetFooter className="flex-row flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="size-4" /> {t("common.edit", "Edit")}
          </Button>
          {branchId ? (
            <Button variant="outline" size="sm" onClick={onLogWaste} disabled={(stockRow?.on_hand ?? 0) <= 0}>
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
