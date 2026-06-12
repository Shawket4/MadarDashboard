import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Hourglass, PackageCheck } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/shared/ui/dialog";
import { runBulk } from "@/shared/lib/bulk-runner";
import {
  updateBranchStock, createAdjustment, listMenuItems, getMenuItem, listBranchStock,
} from "@/shared/api/generated/api";
import { fmtUnit } from "@/shared/lib/format";
import type { Branch } from "@/shared/types";
import type { BranchInventoryItem } from "@/shared/api/generated/models";

// ─────────────────────────────────────────────────────────────────────────────
// Receive delivery / quick restock — qty per selected row, then a bounded
// fan-out of stock PATCH + "add" adjustment so the audit trail stays intact.
// ─────────────────────────────────────────────────────────────────────────────
export function ReceiveDeliveryDialog({
  open,
  onClose,
  rows,
  branchId,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  rows: BranchInventoryItem[];
  branchId: string;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const [qty, setQty] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);

  const entries = rows
    .map((r) => ({ row: r, received: parseFloat(qty[r.id] ?? "") }))
    .filter((e) => Number.isFinite(e.received) && e.received > 0);

  const apply = async () => {
    setRunning(true);
    try {
      const { ok, failed } = await runBulk(entries, async ({ row, received }) => {
        await updateBranchStock(branchId, row.id, { current_stock: row.current_stock + received });
        await createAdjustment(branchId, {
          branch_inventory_id: row.id,
          adjustment_type: "add",
          quantity: received,
          note: t("inventory.stock.deliveryNote"),
        });
      });
      if (failed.length > 0) {
        toast.error(t("inventory.stock.deliverySummaryFailed", { ok: ok.length, failed: failed.length }));
      } else {
        toast.success(t("inventory.stock.deliverySummary", { count: ok.length }));
      }
      onDone();
      onClose();
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{t("inventory.stock.receiveDelivery")}</DialogTitle></DialogHeader>
        <DialogBody>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.ingredient_name}</p>
                  <p className="text-xs text-muted-foreground tabular">
                    {Number(r.current_stock).toFixed(3)} {fmtUnit(r.unit)}
                  </p>
                </div>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  className="w-28 h-9"
                  placeholder={`+ ${fmtUnit(r.unit)}`}
                  value={qty[r.id] ?? ""}
                  onChange={(e) => setQty((q) => ({ ...q, [r.id]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="button" disabled={entries.length === 0} loading={running} onClick={apply} className="gap-1">
            <PackageCheck size={14} /> {t("inventory.stock.receiveN", { count: entries.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Depletion forecast — servings until stock-out per ingredient, derived from
// recipe usage: min(current_stock / quantity_used) over every recipe line.
// ─────────────────────────────────────────────────────────────────────────────
interface ForecastRow {
  ingredient: BranchInventoryItem;
  servings: number;
  limitedBy: string; // item name driving the minimum
}

export function DepletionForecastPanel({
  orgId,
  stock,
}: {
  orgId: string;
  stock: BranchInventoryItem[];
}) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<ForecastRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const compute = async () => {
      setLoading(true);
      try {
        const items = await listMenuItems({ org_id: orgId });
        const byIngredient = new Map<string, { servings: number; limitedBy: string }>();
        await runBulk(
          items,
          async (item) => {
            const full = await getMenuItem(item.id);
            for (const line of full.recipes ?? []) {
              if (!line.org_ingredient_id || line.quantity_used <= 0) continue;
              const s = stock.find((x) => x.org_ingredient_id === line.org_ingredient_id);
              if (!s) continue;
              const servings = Math.floor(s.current_stock / line.quantity_used);
              const prev = byIngredient.get(line.org_ingredient_id);
              if (!prev || servings < prev.servings) {
                byIngredient.set(line.org_ingredient_id, { servings, limitedBy: item.name });
              }
            }
          },
          { concurrency: 4 },
        );
        if (cancelled) return;
        const next: ForecastRow[] = [];
        for (const [ingId, info] of byIngredient) {
          const ingredient = stock.find((x) => x.org_ingredient_id === ingId);
          if (ingredient) next.push({ ingredient, servings: info.servings, limitedBy: info.limitedBy });
        }
        next.sort((a, b) => a.servings - b.servings);
        setRows(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void compute();
    return () => {
      cancelled = true;
    };
    // recompute when the stock snapshot changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, stock]);

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm font-bold flex items-center gap-2 mb-1">
          <Hourglass size={14} /> {t("inventory.stock.forecastTitle")}
        </p>
        <p className="text-xs text-muted-foreground mb-3">{t("inventory.stock.forecastHint")}</p>
        {loading || rows === null ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9 rounded-lg" />)}</div>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3">{t("inventory.stock.forecastEmpty")}</p>
        ) : (
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {rows.slice(0, 20).map((r) => (
              <div key={r.ingredient.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-1.5 text-sm">
                <span className="truncate">{r.ingredient.ingredient_name}</span>
                <span className="tabular text-xs text-muted-foreground truncate">
                  {t("inventory.stock.forecastServings", { count: r.servings, item: r.limitedBy })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Transfer-from-alert: find the sibling branch with the largest surplus of an
// ingredient so a transfer can be prefilled in one click.
// ─────────────────────────────────────────────────────────────────────────────
export interface TransferSuggestion {
  org_ingredient_id: string;
  source_branch_id: string;
  source_branch_name: string;
  quantity: number;
}

export async function suggestTransferSource(
  branches: Branch[],
  currentBranchId: string,
  item: BranchInventoryItem,
): Promise<TransferSuggestion | null> {
  const others = branches.filter((b) => b.id !== currentBranchId && b.is_active);
  let best: { branch: Branch; surplus: number } | null = null;
  await runBulk(
    others,
    async (branch) => {
      const rows = await listBranchStock(branch.id);
      const match = rows.find((r) => r.org_ingredient_id === item.org_ingredient_id);
      if (!match) return;
      const surplus = match.current_stock - match.reorder_threshold;
      if (surplus > 0 && (!best || surplus > best.surplus)) best = { branch, surplus };
    },
    { concurrency: 4 },
  );
  if (!best) return null;
  const b = best as { branch: Branch; surplus: number };
  const needed = Math.max(item.reorder_threshold - item.current_stock, 0);
  return {
    org_ingredient_id: item.org_ingredient_id,
    source_branch_id: b.branch.id,
    source_branch_name: b.branch.name,
    // suggest covering the shortfall without dragging the donor below its threshold
    quantity: Math.round(Math.min(b.surplus, needed > 0 ? needed : b.surplus) * 1000) / 1000,
  };
}
