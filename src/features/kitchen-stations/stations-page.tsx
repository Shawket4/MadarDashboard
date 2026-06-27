import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle, ChefHat, Pencil, Plus, Printer, Star, Store, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Page } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { DataTable } from "@/components/app/data-table";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    if (await confirm({ title: t("common.confirmDelete", { name: x.name, defaultValue: `Delete "${x.name}"?` }), destructive: true, confirmLabel: t("common.delete", "Delete") })) {
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
            {row.original.is_default ? <Badge variant="outline" className="border-transparent bg-warning/15 text-warning"><Star className="size-3" /> {t("kitchen.default", "Default")}</Badge> : null}
          </div>
        ),
      },
      {
        accessorKey: "printer_brand",
        header: t("branches.printer", "Printer"),
        cell: ({ row }) => row.original.printer_brand ? (
          <span className="flex items-center gap-1 text-sm capitalize text-muted-foreground"><Printer className="size-3.5" /> {row.original.printer_brand} {row.original.printer_ip ? `· ${row.original.printer_ip}` : ""}</span>
        ) : <span className="text-sm text-muted-foreground">—</span>,
      },
      {
        accessorKey: "is_active",
        header: t("common.status", "Status"),
        cell: ({ row }) => row.original.is_active
          ? <Badge variant="outline" className="border-transparent bg-success/15 text-success"><CheckCircle className="size-3" /> {t("common.active", "Active")}</Badge>
          : <Badge variant="outline"><XCircle className="size-3" /> {t("common.inactive", "Inactive")}</Badge>,
      },
      {
        id: "actions", header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row.original)} aria-label={t("common.edit", "Edit")}><Pencil className="size-4" /></Button>
            <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => void remove(row.original)} aria-label={t("common.delete", "Delete")}><Trash2 className="size-4" /></Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  return (
    <Page>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{t("kitchen.stationsTitle", "Kitchen stations")}</h1>
          <p className="text-sm text-muted-foreground">{t("kitchen.stationsSubtitle", "Kitchen areas with printers; route menu items to them on the Order routing tab.")}</p>
        </div>
        {branchId ? <Button onClick={openNew}><Plus className="size-4" /> {t("kitchen.newStation", "New station")}</Button> : null}
      </div>
      {!branchId ? (
        <EmptyState icon={Store} title={t("kitchen.pickBranch", "Select a branch in the top bar to manage its kitchen")} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{t("kitchen.routingMode", "Where tickets show")}</p>
              <p className="text-xs text-muted-foreground">{t("kitchen.routingModeHint", "Auto = KDS if stations exist, else the till.")}</p>
            </div>
            <div className="ms-auto flex items-center gap-2">
              {mode.data?.effective ? <Badge variant="outline">{t("kitchen.effective", "Now")}: {t(`kitchen.mode.${mode.data.effective}`, mode.data.effective)}</Badge> : null}
              <Select value={mode.data?.mode ?? "auto"} onValueChange={(v) => void onModeChange(v)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">{t("kitchen.mode.auto", "Auto")}</SelectItem>
                  <SelectItem value="kds">{t("kitchen.mode.kds", "KDS screens")}</SelectItem>
                  <SelectItem value="till">{t("kitchen.mode.till", "Till queue")}</SelectItem>
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
