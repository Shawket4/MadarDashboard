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
  deletePriceOverride,
  putPriceOverride,
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
  const [busy, setBusy] = useState(false);

  // Merged override table (unified model): an add-on is a modifier OPTION by
  // the same stable id — one branch-scoped row carries price + availability.
  const rowBase = () => ({
    scope: "branch" as const,
    branch_id: branchId,
    target_type: "modifier_option" as const,
    target_id: addonId ?? "",
  });

  const save = async () => {
    if (!addonId) return;
    let price: number | null = null;
    const v = branchPrice.trim();
    if (v !== "") {
      const n = parseFloat(v);
      if (!Number.isFinite(n) || n < 0) {
        toast.error(t("menu.overrides.invalidPrice", "Enter a valid price"));
        return;
      }
      price = egpToPiastres(n);
    }
    setBusy(true);
    try {
      if (price == null && available) {
        // Nothing to override — clear any existing row (inherit the org catalog).
        if (override) await deletePriceOverride(rowBase());
      } else {
        await putPriceOverride({
          ...rowBase(),
          price,
          is_available: available ? null : false,
        });
      }
      done();
    } catch (e) {
      onErr(e);
    } finally {
      setBusy(false);
    }
  };

  const clearOverride = async () => {
    if (!addonId) return;
    setBusy(true);
    try {
      await deletePriceOverride(rowBase());
      done();
    } catch (e) {
      onErr(e);
    } finally {
      setBusy(false);
    }
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
            <Button type="button" loading={busy} onClick={() => void save()}>
              {t("common.save", "Save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
