import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { MapPin, Pencil, Plus, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PaneHeader } from "@/features/settings/pane-header";
import { StatusPill } from "@/components/app/status-pill";
import { EmptyState } from "@/components/app/empty-state";
import { DataTable } from "@/components/app/data-table";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { ZoneDialog } from "./zone-dialog";
import { deleteZone, useListZones } from "@/data/api/generated/api";
import type { DeliveryZone } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { fmtMoney, fmtNumber } from "@/lib/format";
import { useScope } from "@/data/scope/use-scope";
import { invalidateZones } from "./util";

/** A zone with its display-only ring number, derived from distance sort order. */
type NumberedZone = DeliveryZone & { zoneNumber: number };

export function ZonesPage() {
  const { t } = useTranslation();
  const scope = useScope();
  const branchId = scope.branchId;
  const confirm = useConfirm();

  const list = useListZones(
    { branch_id: branchId ?? "" },
    { query: { enabled: !!branchId } },
  );

  // Order by max road distance ascending (closest ring first) and auto-number them
  // "Zone 1", "Zone 2", … The number is derived from sort order — never stored.
  const zones = useMemo(() => list.data ?? [], [list.data]);
  const numbered = useMemo<NumberedZone[]>(
    () =>
      [...zones]
        .sort((a, b) => a.max_road_distance_meters - b.max_road_distance_meters)
        .map((z, i) => ({ ...z, zoneNumber: i + 1 })),
    [zones],
  );

  const [editing, setEditing] = useState<DeliveryZone | null>(null);
  const [dlgOpen, setDlgOpen] = useState(false);

  const openNew = () => {
    setEditing(null);
    setDlgOpen(true);
  };
  const openEdit = (z: DeliveryZone) => {
    setEditing(z);
    setDlgOpen(true);
  };

  const remove = async (z: DeliveryZone) => {
    if (!branchId) return;
    if (
      await confirm({
        title: t("delivery.deleteZoneTitle", {
          name: z.name,
          defaultValue: `Delete the ${z.name} zone?`,
        }),
        description: t(
          "delivery.deleteZoneHint",
          "Addresses in this ring fall to the next zone out, or can no longer order delivery if it was the last one. This can't be undone.",
        ),
        destructive: true,
        confirmLabel: t("common.delete", "Delete"),
      })
    ) {
      try {
        await deleteZone(z.id, { branch_id: branchId });
        toast.success(t("delivery.zoneDeleted", "Zone deleted"));
        void invalidateZones();
      } catch (e) {
        toast.error(getErrorMessage(e));
      }
    }
  };

  const columns = useMemo<ColumnDef<NumberedZone>[]>(
    () => [
      {
        accessorKey: "zoneNumber",
        header: t("delivery.zone", "Zone"),
        meta: { label: t("delivery.zone", "Zone"), phone: "title" },
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary font-mono text-sm font-semibold tabular-nums text-muted-foreground">
              {row.original.zoneNumber}
            </span>
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {`${t("delivery.zoneWord", "Zone")} ${row.original.zoneNumber}`}
              </span>
              {row.original.name &&
              row.original.name !==
                `${t("delivery.zoneWord", "Zone")} ${row.original.zoneNumber}` ? (
                <span className="block truncate text-xs text-muted-foreground">
                  {row.original.name}
                </span>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "max_road_distance_meters",
        header: t("delivery.maxDistance", "Max distance"),
        meta: {
          label: t("delivery.maxDistance", "Max distance"),
          numeric: true,
        },
        cell: ({ row }) => (
          <span>
            {fmtNumber(row.original.max_road_distance_meters / 1000, {
              maximumFractionDigits: 1,
            })}{" "}
            {t("delivery.kmUnit", "km")}
          </span>
        ),
      },
      {
        accessorKey: "fee",
        header: t("delivery.zoneFeeShort", "Fee"),
        meta: { label: t("delivery.zoneFeeShort", "Fee"), numeric: true },
        cell: ({ row }) => fmtMoney(row.original.fee),
      },
      {
        accessorKey: "is_active",
        header: t("common.status", "Status"),
        meta: { label: t("common.status", "Status") },
        cell: ({ row }) =>
          row.original.is_active ? (
            <StatusPill tone="success">
              {t("common.active", "Active")}
            </StatusPill>
          ) : (
            <StatusPill tone="neutral">
              {t("common.inactive", "Inactive")}
            </StatusPill>
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, branchId],
  );

  return (
    <div className="space-y-3">
      <PaneHeader
        title={t("delivery.zonesTitle", "Delivery zones")}
        description={t(
          "delivery.zonesSubtitle",
          "Distance-based delivery rings and their pricing for this branch.",
        )}
        actions={
          branchId ? (
            <Button onClick={openNew}>
              <Plus className="size-4" /> {t("delivery.newZone", "New zone")}
            </Button>
          ) : null
        }
      />
      {!branchId ? (
        <EmptyState
          icon={Store}
          title={t(
            "delivery.pickBranch",
            "Select a branch in the top bar to manage its delivery zones",
          )}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={numbered}
            loading={list.isLoading}
            error={list.error}
            onRetry={() => void list.refetch()}
            hideViewOptions
            getRowId={(z) => z.id}
            onRowClick={openEdit}
            rowActions={(z) => (
              <>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openEdit(z)}
                  aria-label={t("common.edit", "Edit")}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive"
                  onClick={() => void remove(z)}
                  aria-label={t("common.delete", "Delete")}
                >
                  <Trash2 className="size-4" />
                </Button>
              </>
            )}
            emptyState={
              <EmptyState
                icon={MapPin}
                title={t("delivery.noZones", "No delivery zones yet")}
                description={t(
                  "delivery.noZonesHint",
                  "Add rings from closest to farthest to quote delivery fees.",
                )}
                action={
                  <Button onClick={openNew}>
                    <Plus className="size-4" />{" "}
                    {t("delivery.newZone", "New zone")}
                  </Button>
                }
              />
            }
          />
          <ZoneDialog
            branchId={branchId}
            zone={editing}
            zones={zones}
            open={dlgOpen}
            onOpenChange={setDlgOpen}
            onSaved={() => void invalidateZones()}
          />
        </>
      )}
    </div>
  );
}
