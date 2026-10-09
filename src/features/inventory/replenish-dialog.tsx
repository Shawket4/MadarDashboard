import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PackageSearch } from "lucide-react";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { Branch, TransferLineInput, TransferLocation } from "@/data/api/generated/models";
import { useReplenishment } from "@/data/api/generated/api";
import { fmtNumber, fmtUnit } from "@/lib/format";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: Branch;
  /** Selling branches this warehouse can fill. */
  branches: TransferLocation[];
  /** Hands the picked lines to the transfer dialog as a draft. */
  onPick: (branchId: string, lines: TransferLineInput[]) => void;
}

/**
 * What a branch is low on, and what this warehouse can send it: the branch's
 * shortfall to its max level, less what's already coming, capped by the
 * warehouse's unclaimed stock (the backend's rule, madar_inventory::replenish).
 */
export function ReplenishDialog({ open, onOpenChange, warehouse, branches, onPick }: Props) {
  const { t } = useTranslation();
  const [branchId, setBranchId] = useState("");
  const [qty, setQty] = useState<Record<string, string>>({});
  const [on, setOn] = useState<Record<string, boolean>>({});
  const seededFor = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setBranchId(branches.length === 1 ? branches[0].id : "");
    seededFor.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const rows = useReplenishment(warehouse.id, { branch_id: branchId }, { query: { enabled: open && !!branchId } });
  useEffect(() => {
    // Seed once per branch picked: a background refetch keeps the person's edits.
    if (!rows.data || seededFor.current === branchId) return;
    seededFor.current = branchId;
    setQty(Object.fromEntries(rows.data.map((r) => [r.org_ingredient_id, r.suggested > 0 ? String(r.suggested) : ""])));
    setOn(Object.fromEntries(rows.data.map((r) => [r.org_ingredient_id, r.suggested > 0])));
  }, [rows.data, branchId]);

  const picked = useMemo(
    () =>
      (rows.data ?? [])
        .filter((r) => on[r.org_ingredient_id] && parseFloat(qty[r.org_ingredient_id] ?? "") > 0)
        .map((r) => ({ org_ingredient_id: r.org_ingredient_id, quantity: parseFloat(qty[r.org_ingredient_id]) })),
    [rows.data, on, qty],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("inventory.transfers.replenishTitle", "Replenish a branch")}</DialogTitle>
          <DialogDescription>
            {t("inventory.transfers.replenishHint", { warehouse: warehouse.name, defaultValue: `Items the branch is low on, and what ${warehouse.name} can send to bring it back to its max level.` })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("inventory.transfers.to", "To")}</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger><SelectValue placeholder={t("inventory.transfers.pickBranch", "Pick a branch")} /></SelectTrigger>
              <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {!branchId ? null : rows.isLoading ? (
            <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : rows.error ? (
            <ErrorState onRetry={() => void rows.refetch()} />
          ) : !rows.data?.length ? (
            <EmptyState
              icon={PackageSearch}
              title={t("inventory.transfers.nothingLow", "Nothing is low here")}
              description={t("inventory.transfers.nothingLowHint", "Only items with a low-stock level that the branch is at or under show up.")}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="w-8 py-2" />
                    <th className="py-2 text-start font-medium">{t("inventory.transfers.ingredient", "Ingredient")}</th>
                    <th className="py-2 text-end font-medium">{t("inventory.transfers.branchOnHand", "At branch")}</th>
                    <th className="py-2 text-end font-medium">{t("inventory.transfers.coming", "Coming")}</th>
                    <th className="py-2 text-end font-medium">{t("inventory.transfers.inWarehouse", "Can send")}</th>
                    <th className="py-2 text-end font-medium">{t("inventory.transfers.send", "Send")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.data.map((r) => (
                    <tr key={r.org_ingredient_id} className="border-b last:border-0">
                      <td className="py-2">
                        <Checkbox
                          checked={!!on[r.org_ingredient_id]}
                          onCheckedChange={(v) => setOn((p) => ({ ...p, [r.org_ingredient_id]: v === true }))}
                          aria-label={r.ingredient_name}
                        />
                      </td>
                      <td className="py-2">
                        <span className="font-medium">{r.ingredient_name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {t("inventory.transfers.parRange", { min: fmtNumber(r.par_min), max: fmtNumber(r.par_max ?? r.par_min), defaultValue: `Level ${fmtNumber(r.par_min)}–${fmtNumber(r.par_max ?? r.par_min)}` })}
                        </span>
                      </td>
                      <td className="tabular py-2 text-end">{fmtNumber(r.on_hand)} {fmtUnit(r.unit)}</td>
                      <td className="tabular py-2 text-end text-muted-foreground">{fmtNumber(r.in_transit + r.open_inbound)}</td>
                      <td className="tabular py-2 text-end">{fmtNumber(r.available)}</td>
                      <td className="py-2 text-end">
                        <Input
                          type="number" inputMode="decimal" min="0" step="0.001" className="tabular ms-auto h-8 w-24"
                          value={qty[r.org_ingredient_id] ?? ""}
                          onChange={(e) => setQty((p) => ({ ...p, [r.org_ingredient_id]: e.target.value }))}
                          aria-label={t("inventory.transfers.send", "Send")}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button disabled={!picked.length} onClick={() => onPick(branchId, picked)}>
            {t("inventory.transfers.reviewTransfer", { count: picked.length, defaultValue: `Review transfer (${picked.length})` })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
