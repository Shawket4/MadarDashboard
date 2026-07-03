import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  deletePriceOverride,
  getGetStudioQueryOptions,
  putPriceOverride,
} from "@/data/api/generated/api";
import type { BranchMenuOverride } from "@/data/api/generated/models";
import { invalidateCatalog } from "./util";
import { egpToPiastres, fmtMoney } from "@/lib/format";
import { getErrorMessage } from "@/data/api/errors";

interface Props {
  branchId: string;
  itemId: string | null;
  itemName: string;
  /** The item's current override at this branch, if any (legacy view read). */
  override?: BranchMenuOverride;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Parse an EGP text field → piastres, or null when blank. Returns `false` on invalid. */
const parseEgp = (raw: string): number | null | false => {
  const v = raw.trim();
  if (v === "") return null;
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? egpToPiastres(n) : false;
};

/**
 * Edit a single item's branch override on the MERGED override table
 * (`menu-price-overrides`): one branch-scoped row per SIZE carrying price
 * and/or availability (blank price = inherit; "available" = inherit). Saving
 * REPLACES the item's branch rows; per-size branch availability is now
 * expressible (post-unification), item-level toggles fan out to every size.
 */
export function BranchOverrideDialog({ branchId, itemId, itemName, override: _override, open, onOpenChange }: Props) {
  const { t } = useTranslation();

  // The Studio aggregate: size ids/labels/catalog prices + this branch's
  // current override rows (availability.branches).
  const studioQ = useQuery({
    ...getGetStudioQueryOptions(itemId ?? ""),
    enabled: open && !!itemId,
  });
  const studio = studioQ.data;
  const sizes = useMemo(() => studio?.sizes ?? [], [studio?.sizes]);
  const branchRows = useMemo(
    () =>
      new Map(
        (studio?.availability.branches.find((b) => b.branch_id === branchId)?.sizes ?? []).map(
          (s) => [s.size_id, s],
        ),
      ),
    [studio, branchId],
  );

  const [available, setAvailable] = useState(true);
  const [sizeInputs, setSizeInputs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  // (Re)seed the form whenever it opens for an item.
  useEffect(() => {
    if (!open || !studio) return;
    const m: Record<string, string> = {};
    let avail = true;
    for (const s of studio.sizes) {
      const row = branchRows.get(s.id);
      if (row?.price != null) m[s.id] = String(row.price / 100);
      if (row?.is_available === false) avail = false;
    }
    setSizeInputs(m);
    setAvailable(avail);
  }, [open, itemId, studio, branchRows]);

  const onErr = (e: unknown) => toast.error(getErrorMessage(e));
  const done = () => {
    void invalidateCatalog();
    toast.success(t("common.savedChanges", "Changes saved"));
    onOpenChange(false);
  };

  const rowBase = (sizeId: string) => ({
    scope: "branch" as const,
    branch_id: branchId,
    target_type: "menu_item_size" as const,
    target_id: sizeId,
  });

  const save = async () => {
    if (!itemId || !studio) return;
    const desired: { sizeId: string; price: number | null }[] = [];
    for (const s of sizes) {
      const p = parseEgp(sizeInputs[s.id] ?? "");
      if (p === false) {
        toast.error(t("menu.overrides.invalidPrice", "Enter a valid price"));
        return;
      }
      desired.push({ sizeId: s.id, price: p });
    }
    setBusy(true);
    try {
      for (const d of desired) {
        const meaningful = d.price != null || !available;
        if (meaningful) {
          await putPriceOverride({
            ...rowBase(d.sizeId),
            price: d.price,
            is_available: available ? null : false,
          });
        } else if (branchRows.has(d.sizeId)) {
          await deletePriceOverride({ ...rowBase(d.sizeId) });
        }
      }
      done();
    } catch (e) {
      onErr(e);
    } finally {
      setBusy(false);
    }
  };

  const clearOverride = async () => {
    if (!itemId) return;
    setBusy(true);
    try {
      for (const sizeId of branchRows.keys()) {
        await deletePriceOverride({ ...rowBase(sizeId) });
      }
      done();
    } catch (e) {
      onErr(e);
    } finally {
      setBusy(false);
    }
  };

  const hasOverride = branchRows.size > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("menu.overrides.editTitle", "Branch override")}</DialogTitle>
          <DialogDescription>{itemName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Label>{t("menu.overrides.available", "Available at this branch")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("menu.overrides.availableHint", "Off hides the item from this branch's menu.")}
              </p>
            </div>
            <Switch checked={available} onCheckedChange={setAvailable} />
          </div>

          <div className="space-y-2">
            <Label>{t("menu.overrides.sizePrices", "Per-size branch prices (EGP)")}</Label>
            {sizes.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-sm capitalize">{s.label.replace(/_/g, " ")}</span>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={sizeInputs[s.id] ?? ""}
                  onChange={(e) => setSizeInputs((m) => ({ ...m, [s.id]: e.target.value }))}
                  placeholder={`${t("menu.overrides.inherits", "Inherits")} ${fmtMoney(s.price)}`}
                />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              {t("menu.overrides.priceHint", "Leave blank to use the organization price.")}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {hasOverride ? (
            <Button type="button" variant="outline" className="text-destructive" loading={busy} onClick={() => void clearOverride()}>
              {t("menu.overrides.clear", "Clear override")}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button type="button" loading={busy} disabled={busy || (open && !!itemId && studioQ.isLoading)} onClick={() => void save()}>
              {t("common.save", "Save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
