import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { MapPin, Pencil, Plus, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Page } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { DataTable } from "@/components/app/data-table";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const list = useListZones({ branch_id: branchId ?? "" }, { query: { enabled: !!branchId } });

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

  const openNew = () => { setEditing(null); setDlgOpen(true); };
  const openEdit = (z: DeliveryZone) => { setEditing(z); setDlgOpen(true); };

  const remove = async (z: DeliveryZone) => {
    if (!branchId) return;
    if (
      await confirm({
        title: t("common.confirmDelete", { name: z.name, defaultValue: `Delete "${z.name}"?` }),
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
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-info/10 text-sm font-bold tabular-nums text-info">
              {row.original.zoneNumber}
            </span>
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {`${t("delivery.zoneWord", "Zone")} ${row.original.zoneNumber}`}
              </span>
              {row.original.name && row.original.name !== `${t("delivery.zoneWord", "Zone")} ${row.original.zoneNumber}` ? (
                <span className="block truncate text-xs text-muted-foreground">{row.original.name}</span>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "max_road_distance_meters",
        header: t("delivery.maxDistance", "Max distance"),
        cell: ({ row }) => (
          <span className="tabular">
            {fmtNumber(row.original.max_road_distance_meters / 1000, { maximumFractionDigits: 1 })}{" "}
            {t("delivery.kmUnit", "km")}
          </span>
        ),
      },
      {
        accessorKey: "fee",
        header: t("delivery.zoneFeeShort", "Fee"),
        cell: ({ row }) => <span className="font-semibold tabular">{fmtMoney(row.original.fee)}</span>,
      },
      {
        accessorKey: "is_active",
        header: t("common.status", "Status"),
        cell: ({ row }) =>
          row.original.is_active ? (
            <Badge variant="outline" className="border-transparent bg-success/15 text-success">
              {t("common.active", "Active")}
            </Badge>
          ) : (
            <Badge variant="outline">{t("common.inactive", "Inactive")}</Badge>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row.original)} aria-label={t("common.edit", "Edit")}>
              <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => void remove(row.original)} aria-label={t("common.delete", "Delete")}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, branchId],
  );

  return (
    <Page>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">{t("delivery.zonesTitle", "Delivery zones")}</h1>
          <p className="text-sm text-muted-foreground">{t("delivery.zonesSubtitle", "Distance-based delivery rings and their pricing for this branch.")}</p>
        </div>
        {branchId ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button onClick={openNew}><Plus className="size-4" /> {t("delivery.newZone", "New zone")}</Button>
          </div>
        ) : null}
      </div>
      {!branchId ? (
        <EmptyState
          icon={Store}
          title={t("delivery.pickBranch", "Select a branch in the top bar to manage its delivery zones")}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={numbered}
            loading={list.isLoading}
            getRowId={(z) => z.id}
            onRowClick={openEdit}
            searchPlaceholder={t("common.search", "Search…")}
            emptyState={
              <EmptyState
                icon={MapPin}
                title={t("delivery.noZones", "No delivery zones yet")}
                description={t("delivery.noZonesHint", "Add rings from closest to farthest to quote delivery fees.")}
                action={
                  <Button onClick={openNew}>
                    <Plus className="size-4" /> {t("delivery.newZone", "New zone")}
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
    </Page>
  );
}
