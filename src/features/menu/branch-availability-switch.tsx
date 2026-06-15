import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import {
  useDeleteBranchAddonOverride,
  useDeleteBranchMenuOverride,
  useUpsertBranchAddonOverride,
  useUpsertBranchMenuOverride,
} from "@/data/api/generated/api";
import type { BranchAddonOverride, BranchMenuOverride } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";

import { invalidateCatalog } from "./util";

/**
 * Lightweight inline "Available at this branch" toggle, shown on the Add-ons and
 * Menu Items admin cards when a single branch is scoped. It upserts/clears the
 * branch override's `is_available` flag without opening the full override dialog:
 *
 *  - toggling OFF upserts the override with `is_available: false`, preserving any
 *    existing branch price (and item size prices);
 *  - toggling back ON deletes the override entirely when availability was the only
 *    thing it carried, otherwise upserts `is_available: true` to keep the price.
 *
 * "Available" is the inherited default — no override means the org catalog shows.
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
  const upsert = useUpsertBranchAddonOverride({ mutation: { onSuccess: onDone, onError: onErr } });
  const del = useDeleteBranchAddonOverride({ mutation: { onSuccess: onDone, onError: onErr } });
  const busy = upsert.isPending || del.isPending;
  const available = override?.is_available ?? true;

  const onChange = (on: boolean) => {
    if (on) {
      // Re-enabling: drop the override when it only held availability, otherwise
      // keep the branch price and just flip the flag back on.
      if (override == null || override.price_override == null) {
        del.mutate({ params: { branch_id: branchId, addon_item_id: addonId } });
      } else {
        upsert.mutate({
          data: {
            branch_id: branchId,
            addon_item_id: addonId,
            price_override: override.price_override,
            is_available: true,
          },
        });
      }
    } else {
      upsert.mutate({
        data: {
          branch_id: branchId,
          addon_item_id: addonId,
          price_override: override?.price_override ?? null,
          is_available: false,
        },
      });
    }
  };

  return (
    <AvailabilityRow label={t("menu.overrides.available", "Available at this branch")} checked={available} disabled={busy} onChange={onChange} />
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
  const upsert = useUpsertBranchMenuOverride({ mutation: { onSuccess: onDone, onError: onErr } });
  const del = useDeleteBranchMenuOverride({ mutation: { onSuccess: onDone, onError: onErr } });
  const busy = upsert.isPending || del.isPending;
  const available = override?.is_available ?? true;

  const onChange = (on: boolean) => {
    const hasPrice = override != null && (override.price_override != null || (override.sizes?.length ?? 0) > 0);
    if (on) {
      // Re-enabling: drop the override when availability was all it held; keep
      // any branch base/size prices otherwise (omit `sizes` to leave them intact).
      if (!hasPrice) {
        del.mutate({ params: { branch_id: branchId, menu_item_id: menuItemId } });
      } else {
        upsert.mutate({
          data: {
            branch_id: branchId,
            menu_item_id: menuItemId,
            price_override: override?.price_override ?? null,
            is_available: true,
          },
        });
      }
    } else {
      upsert.mutate({
        data: {
          branch_id: branchId,
          menu_item_id: menuItemId,
          price_override: override?.price_override ?? null,
          is_available: false,
        },
      });
    }
  };

  return (
    <AvailabilityRow label={t("menu.overrides.available", "Available at this branch")} checked={available} disabled={busy} onChange={onChange} />
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
