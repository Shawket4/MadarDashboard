import { useEffect, useState } from "react";
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
  getGetMenuItemQueryOptions,
  useDeleteBranchMenuOverride,
  useUpsertBranchMenuOverride,
} from "@/data/api/generated/api";
import type { BranchMenuOverride, BranchSizeOverrideInput } from "@/data/api/generated/models";
import { invalidateCatalog } from "./util";
import { egpToPiastres, fmtMoney } from "@/lib/format";
import { getErrorMessage } from "@/data/api/errors";

interface Props {
  branchId: string;
  itemId: string | null;
  itemName: string;
  /** The item's current override at this branch, if any. */
  override?: BranchMenuOverride;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const toEgpInput = (piastres: number | null | undefined): string =>
  piastres == null ? "" : String(piastres / 100);

/** Parse an EGP text field → piastres, or null when blank. Returns `false` on invalid. */
const parseEgp = (raw: string): number | null | false => {
  const v = raw.trim();
  if (v === "") return null;
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? egpToPiastres(n) : false;
};

/**
 * Edit a single item's branch override: branch base price, availability, and
 * per-size branch prices. The size list always reflects the full intended state
 * (blank = inherit), so saving REPLACES the item's size overrides.
 */
export function BranchOverrideDialog({ branchId, itemId, itemName, override, open, onOpenChange }: Props) {
  const { t } = useTranslation();

  const itemQuery = useQuery({
    ...getGetMenuItemQueryOptions(itemId ?? ""),
    enabled: open && !!itemId,
  });
  const full = itemQuery.data;
  const sizes = full?.sizes ?? [];

  const [branchBase, setBranchBase] = useState("");
  const [available, setAvailable] = useState(true);
  const [sizeInputs, setSizeInputs] = useState<Record<string, string>>({});

  // (Re)seed the form whenever it opens for an item.
  useEffect(() => {
    if (!open) return;
    setBranchBase(toEgpInput(override?.price_override));
    setAvailable(override?.is_available ?? true);
    const m: Record<string, string> = {};
    for (const s of override?.sizes ?? []) m[s.size_label] = String(s.price_override / 100);
    setSizeInputs(m);
  }, [open, itemId, override]);

  const onErr = (e: unknown) => toast.error(getErrorMessage(e));
  const done = () => {
    void invalidateCatalog();
    toast.success(t("common.savedChanges", "Changes saved"));
    onOpenChange(false);
  };
  const upsert = useUpsertBranchMenuOverride({ mutation: { onSuccess: done, onError: onErr } });
  const del = useDeleteBranchMenuOverride({ mutation: { onSuccess: done, onError: onErr } });

  const save = () => {
    if (!itemId) return;
    const base = parseEgp(branchBase);
    if (base === false) {
      toast.error(t("menu.overrides.invalidPrice", "Enter a valid price"));
      return;
    }
    const sizeList: BranchSizeOverrideInput[] = [];
    for (const s of sizes) {
      const p = parseEgp(sizeInputs[s.label] ?? "");
      if (p === false) {
        toast.error(t("menu.overrides.invalidPrice", "Enter a valid price"));
        return;
      }
      if (p !== null) sizeList.push({ size_label: s.label, price_override: p });
    }
    upsert.mutate({
      data: { branch_id: branchId, menu_item_id: itemId, price_override: base, is_available: available, sizes: sizeList },
    });
  };

  const clearOverride = () => {
    if (!itemId) return;
    del.mutate({ params: { branch_id: branchId, menu_item_id: itemId } });
  };

  const busy = upsert.isPending || del.isPending;

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

          <div className="space-y-1">
            <Label>{t("menu.overrides.branchPrice", "Branch price (EGP)")}</Label>
            <Input
              type="number"
              step="any"
              min="0"
              value={branchBase}
              onChange={(e) => setBranchBase(e.target.value)}
              placeholder={full ? `${t("menu.overrides.inherits", "Inherits")} ${fmtMoney(full.base_price)}` : "—"}
            />
            <p className="text-xs text-muted-foreground">
              {t("menu.overrides.priceHint", "Leave blank to use the organization price.")}
            </p>
          </div>

          {sizes.length > 0 ? (
            <div className="space-y-2">
              <Label>{t("menu.overrides.sizePrices", "Per-size branch prices (EGP)")}</Label>
              {sizes.map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 text-sm capitalize">{s.label.replace(/_/g, " ")}</span>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    value={sizeInputs[s.label] ?? ""}
                    onChange={(e) => setSizeInputs((m) => ({ ...m, [s.label]: e.target.value }))}
                    placeholder={`${t("menu.overrides.inherits", "Inherits")} ${fmtMoney(s.price_override)}`}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {override ? (
            <Button type="button" variant="outline" className="text-destructive" loading={del.isPending} onClick={clearOverride}>
              {t("menu.overrides.clear", "Clear override")}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button type="button" loading={upsert.isPending} disabled={busy || (open && !!itemId && itemQuery.isLoading)} onClick={save}>
              {t("common.save", "Save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
