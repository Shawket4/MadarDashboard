import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  useDeleteBranchAddonOverride,
  useUpsertBranchAddonOverride,
} from "@/data/api/generated/api";
import type { BranchAddonOverride } from "@/data/api/generated/models";
import { invalidateCatalog } from "./util";
import { egpToPiastres, fmtMoney } from "@/lib/format";
import { getErrorMessage } from "@/data/api/errors";

interface Props {
  branchId: string;
  addonId: string | null;
  addonName: string;
  /** Org default price (piastres) — shown as the inherit placeholder. */
  orgDefaultPrice: number;
  override?: BranchAddonOverride;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Edit a single addon's branch override: branch price + availability. */
export function BranchAddonOverrideDialog({
  branchId,
  addonId,
  addonName,
  orgDefaultPrice,
  override,
  open,
  onOpenChange,
}: Props) {
  const { t } = useTranslation();

  const [branchPrice, setBranchPrice] = useState("");
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    if (!open) return;
    setBranchPrice(override?.price_override == null ? "" : String(override.price_override / 100));
    setAvailable(override?.is_available ?? true);
  }, [open, addonId, override]);

  const onErr = (e: unknown) => toast.error(getErrorMessage(e));
  const done = () => {
    void invalidateCatalog();
    toast.success(t("common.savedChanges", "Changes saved"));
    onOpenChange(false);
  };
  const upsert = useUpsertBranchAddonOverride({ mutation: { onSuccess: done, onError: onErr } });
  const del = useDeleteBranchAddonOverride({ mutation: { onSuccess: done, onError: onErr } });

  const save = () => {
    if (!addonId) return;
    let price_override: number | null = null;
    const v = branchPrice.trim();
    if (v !== "") {
      const n = parseFloat(v);
      if (!Number.isFinite(n) || n < 0) {
        toast.error(t("menu.overrides.invalidPrice", "Enter a valid price"));
        return;
      }
      price_override = egpToPiastres(n);
    }
    upsert.mutate({ data: { branch_id: branchId, addon_item_id: addonId, price_override, is_available: available } });
  };

  const clearOverride = () => {
    if (!addonId) return;
    del.mutate({ params: { branch_id: branchId, addon_item_id: addonId } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("menu.overrides.editTitle", "Branch override")}</DialogTitle>
          <DialogDescription>{addonName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Label>{t("menu.overrides.available", "Available at this branch")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("menu.overrides.availableHintAddon", "Off hides the add-on from this branch.")}
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
              value={branchPrice}
              onChange={(e) => setBranchPrice(e.target.value)}
              placeholder={`${t("menu.overrides.inherits", "Inherits")} ${fmtMoney(orgDefaultPrice)}`}
            />
            <p className="text-xs text-muted-foreground">
              {t("menu.overrides.priceHint", "Leave blank to use the organization price.")}
            </p>
          </div>
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
            <Button type="button" loading={upsert.isPending} onClick={save}>
              {t("common.save", "Save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
