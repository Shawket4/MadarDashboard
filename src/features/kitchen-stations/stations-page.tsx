import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { ChefHat, Pencil, Plus, Printer, Star, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { StatusPill } from "@/components/app/status-pill";
import { SectionHeader } from "@/components/app/section-header";
import { EmptyState } from "@/components/app/empty-state";
import { DataTable } from "@/components/app/data-table";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StationDialog } from "./station-dialog";
import { deleteStation, setRoutingMode, useGetRoutingMode, useListStations } from "@/data/api/generated/api";
import type { KitchenStation } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useScope } from "@/data/scope/use-scope";
import { invalidateRouting, invalidateStations } from "./util";

export function StationsPage() {
  const { t } = useTranslation();
  const scope = useScope();
  const branchId = scope.branchId;
  const confirm = useConfirm();

  const list = useListStations({ branch_id: branchId ?? "" }, { query: { enabled: !!branchId } });
  const mode = useGetRoutingMode({ branch_id: branchId ?? "" }, { query: { enabled: !!branchId } });
  const stations = useMemo(() => list.data ?? [], [list.data]);

  const [editing, setEditing] = useState<KitchenStation | null>(null);
  const [dlgOpen, setDlgOpen] = useState(false);
  const openNew = () => { setEditing(null); setDlgOpen(true); };
  const openEdit = (x: KitchenStation) => { setEditing(x); setDlgOpen(true); };

  const remove = async (x: KitchenStation) => {
    if (await confirm({ title: t("common.confirmDelete", { name: x.name, defaultValue: `Delete "${x.name}"?` }), description: t("kitchen.deleteStationConsequence", "Items routed to this station fall back to their category or the default station. Its printer settings are removed."), destructive: true, confirmLabel: t("common.delete", "Delete") })) {
      try { await deleteStation(x.id); toast.success(t("kitchen.stationDeleted", "Station deleted")); void invalidateStations(); }
      catch (e) { toast.error(getErrorMessage(e)); }
    }
  };

  const onModeChange = async (value: string) => {
    if (!branchId) return;
    try {
      await setRoutingMode({ branch_id: branchId, mode: value === "auto" ? null : value });
      toast.success(t("kitchen.modeUpdated", "Routing mode updated"));
      void invalidateRouting();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const columns = useMemo<ColumnDef<KitchenStation>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("kitchen.stationName", "Name"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{row.original.name}</span>
            {row.original.is_default ? <StatusPill tone="accent" size="sm" icon={Star}>{t("kitchen.default", "Default")}</StatusPill> : null}
          </div>
        ),
      },
      {
        accessorKey: "printer_brand",
        header: t("branches.printer", "Printer"),
        cell: ({ row }) => row.original.printer_brand ? (
          <span className="flex items-center gap-1.5 text-sm capitalize text-muted-foreground"><Printer className="size-3.5" aria-hidden /> {row.original.printer_brand}{row.original.printer_ip ? <> · <bdi className="font-mono tabular-nums">{row.original.printer_ip}</bdi></> : null}</span>
        ) : <span className="text-sm text-muted-foreground">—</span>,
      },
      {
        accessorKey: "is_active",
        header: t("common.status", "Status"),
        cell: ({ row }) => row.original.is_active
          ? <StatusPill tone="success">{t("common.active", "Active")}</StatusPill>
          : <StatusPill tone="neutral">{t("common.inactive", "Inactive")}</StatusPill>,
      },
    ],
    [t],
  );

  return (
    <Page>
      <PageHeader
        title={t("kitchen.stationsTitle", "Kitchen stations")}
        subtitle={t("kitchen.stationsSubtitle", "Kitchen areas with printers; route menu items to them on the Order routing tab.")}
        actions={branchId ? <Button onClick={openNew}><Plus className="size-4" /> {t("kitchen.newStation", "New station")}</Button> : null}
      />
      {!branchId ? (
        <EmptyState icon={Store} title={t("kitchen.pickBranch", "Select a branch in the top bar to manage its kitchen")} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card px-4 py-3 sm:px-5">
            <SectionHeader
              className="min-w-0 flex-1 basis-60"
              title={t("kitchen.routingMode", "Where tickets show")}
              description={t("kitchen.routingModeHint", "Auto = KDS if stations exist, else the POS queue.")}
            />
            <div className="flex flex-wrap items-center gap-2">
              {mode.data?.effective ? <StatusPill tone="info">{t("kitchen.effective", "Now")}: {t(`kitchen.mode.${mode.data.effective}`, mode.data.effective)}</StatusPill> : null}
              <Select value={mode.data?.mode ?? "auto"} onValueChange={(v) => void onModeChange(v)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">{t("kitchen.mode.auto", "Auto")}</SelectItem>
                  <SelectItem value="kds">{t("kitchen.mode.kds", "KDS screens")}</SelectItem>
                  <SelectItem value="till">{t("kitchenStations.routing.till", "POS queue")}</SelectItem>
                  <SelectItem value="both">{t("kitchen.mode.both", "Both")}</SelectItem>
                  <SelectItem value="off">{t("kitchen.mode.off", "Off (no kitchen)")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DataTable
            columns={columns}
            data={stations}
            loading={list.isLoading}
            error={list.error}
            onRetry={() => void list.refetch()}
            rowActions={(x) => (
              <>
                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(x)} aria-label={t("common.edit", "Edit")}><Pencil className="size-4" /></Button>
                <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => void remove(x)} aria-label={t("common.delete", "Delete")}><Trash2 className="size-4" /></Button>
              </>
            )}
            getRowId={(x) => x.id}
            onRowClick={openEdit}
            searchPlaceholder={t("common.search", "Search…")}
            emptyState={<EmptyState icon={ChefHat} title={t("kitchen.noStations", "No stations yet")} description={t("kitchen.noStationsHint", "Add stations like Grill or Bar, then route items to them.")} action={<Button onClick={openNew}><Plus className="size-4" /> {t("kitchen.newStation", "New station")}</Button>} />}
          />
          <StationDialog branchId={branchId} station={editing} open={dlgOpen} onOpenChange={setDlgOpen} />
        </>
      )}
    </Page>
  );
}
