import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import {
  deletePriceOverride,
  getStudio,
  putPriceOverride,
} from "@/data/api/generated/api";
import type { BranchAddonOverride, BranchMenuOverride } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";

import { invalidateCatalog } from "./util";

/**
 * Lightweight inline "Available at this branch" toggle, shown on the Add-ons and
 * Menu Items admin cards when a single branch is scoped. Post-unification it
 * writes the MERGED override table (`menu-price-overrides`):
 *
 *  - an add-on is a modifier OPTION (same stable id) → one branch-scoped row;
 *  - an item's availability is per SIZE → one branch-scoped row per size (ids
 *    from the Studio aggregate, fetched on toggle);
 *  - toggling OFF upserts `is_available: false` (keeping any branch price);
 *    toggling ON deletes price-less rows, else keeps the price and clears the
 *    flag. "Available" is the inherited default — no row = the org catalog.
 */

function useToggleHelpers() {
  const { t } = useTranslation();
  const onErr = (e: unknown) => toast.error(getErrorMessage(e));
  const onDone = () => {
    void invalidateCatalog();
    toast.success(t("common.savedChanges", "Changes saved"));
  };
  return { onErr, onDone, t };
}

export function BranchAddonAvailabilitySwitch({
  branchId,
  addonId,
  override,
}: {
  branchId: string;
  addonId: string;
  override?: BranchAddonOverride;
}) {
  const { onErr, onDone, t } = useToggleHelpers();
  const [busy, setBusy] = useState(false);
  const available = override?.is_available ?? true;

  const base = {
    scope: "branch" as const,
    branch_id: branchId,
    target_type: "modifier_option" as const,
    target_id: addonId,
  };

  const onChange = async (on: boolean) => {
    setBusy(true);
    try {
      if (on && override?.price_override == null) {
        await deletePriceOverride({ ...base });
      } else {
        await putPriceOverride({
          ...base,
          price: override?.price_override ?? null,
          is_available: on ? null : false,
        });
      }
      onDone();
    } catch (e) {
      onErr(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AvailabilityRow label={t("menu.overrides.available", "Available at this branch")} checked={available} disabled={busy} onChange={(on) => void onChange(on)} />
  );
}

export function BranchMenuItemAvailabilitySwitch({
  branchId,
  menuItemId,
  override,
}: {
  branchId: string;
  menuItemId: string;
  override?: BranchMenuOverride;
}) {
  const { onErr, onDone, t } = useToggleHelpers();
  const [busy, setBusy] = useState(false);
  const available = override?.is_available ?? true;

  const onChange = async (on: boolean) => {
    setBusy(true);
    try {
      // Availability is per SIZE in the merged table — resolve the item's size
      // ids + current branch rows from the Studio aggregate, then write one row
      // per size (mirrors the legacy item-level semantics).
      const studio = await getStudio(menuItemId);
      const branchRows = new Map(
        (studio.availability.branches.find((b) => b.branch_id === branchId)?.sizes ?? []).map(
          (s) => [s.size_id, s],
        ),
      );
      for (const size of studio.sizes) {
        const row = branchRows.get(size.id);
        const base = {
          scope: "branch" as const,
          branch_id: branchId,
          target_type: "menu_item_size" as const,
          target_id: size.id,
        };
        if (on && row?.price == null) {
          // Availability was all the row held (or there is no row) — clear it.
          if (row) await deletePriceOverride({ ...base });
        } else {
          await putPriceOverride({
            ...base,
            price: row?.price ?? null,
            is_available: on ? null : false,
          });
        }
      }
      onDone();
    } catch (e) {
      onErr(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AvailabilityRow label={t("menu.overrides.available", "Available at this branch")} checked={available} disabled={busy} onChange={(on) => void onChange(on)} />
  );
}

function AvailabilityRow({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}
