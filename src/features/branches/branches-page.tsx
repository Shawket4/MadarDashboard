import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle, GitBranch, MapPin, Pencil, Phone, Plus, Printer, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { DataTable } from "@/components/app/data-table";
import { StatCard } from "@/components/app/stat-card";
import { ExportButton } from "@/components/app/export-button";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BranchDialog } from "./branch-dialog";
import { invalidateBranches } from "./util";
import { deleteBranch, useListBranches } from "@/data/api/generated/api";
import type { Branch } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { useOrgId } from "@/hooks/use-org-id";
import { usePageSearch } from "@/data/scope/use-page-search";

export function BranchesPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const confirm = useConfirm();

  const list = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const branches = useMemo(() => list.data ?? [], [list.data]);

  const [s, update] = usePageSearch<{ edit: string }>();
  const editId = s.edit ?? null;
  const editing = editId && editId !== "new" ? (branches.find((b) => b.id === editId) ?? null) : null;
  const dlgOpen = editId === "new" || !!editing;

  const remove = async (b: Branch) => {
    if (await confirm({ title: t("common.confirmDelete", { name: b.name, defaultValue: `Delete "${b.name}"?` }), destructive: true, confirmLabel: t("common.delete", "Delete") })) {
      try { await deleteBranch(b.id); void invalidateBranches(); toast.success(t("branches.deletedToast", "Branch deleted")); } catch (e) { toast.error(getErrorMessage(e)); }
    }
  };

  const columns = useMemo<ColumnDef<Branch>[]>(
    () => [
      {
        accessorKey: "name", header: t("common.name", "Name"),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><GitBranch className="size-3.5" /></span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{row.original.name}</p>
              {row.original.address ? <p className="flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="size-2.5" /> {row.original.address}</p> : null}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "phone", header: t("branches.phone", "Phone"),
        cell: ({ row }) => row.original.phone ? <span dir="ltr" className="flex items-center gap-1 font-mono text-sm"><Phone className="size-2.5" />{row.original.phone}</span> : <span className="text-sm text-muted-foreground">—</span>,
      },
      {
        accessorKey: "printer_brand", header: t("branches.printer", "Printer"),
        cell: ({ row }) => row.original.printer_brand ? (
          <div className="flex items-center gap-1.5">
            <Printer className="size-3 text-muted-foreground" />
            <div><p className="text-xs font-semibold capitalize">{row.original.printer_brand}</p><p dir="ltr" className="font-mono text-xs text-muted-foreground">{row.original.printer_ip}:{row.original.printer_port}</p></div>
          </div>
        ) : <span className="text-xs text-muted-foreground">{t("branches.noPrinter", "No printer")}</span>,
      },
      {
        accessorKey: "is_active", header: t("common.status", "Status"),
        cell: ({ row }) => row.original.is_active
          ? <Badge variant="outline" className="border-transparent bg-success/10 text-success"><CheckCircle className="size-3" /> {t("common.active", "Active")}</Badge>
          : <Badge variant="outline"><XCircle className="size-3" /> {t("common.inactive", "Inactive")}</Badge>,
      },
      {
        id: "actions", header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon-sm" aria-label={t("common.edit", "Edit")} onClick={() => update({ edit: row.original.id })}><Pencil className="size-4" /></Button>
            <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label={t("common.delete", "Delete")} onClick={() => void remove(row.original)}><Trash2 className="size-4" /></Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, update],
  );

  const handleExport = () => {
    const cols: ExcelColumn<Branch>[] = [
      { header: t("common.name", "Name"), accessor: (b) => b.name, type: "text", width: 28 },
      { header: t("branches.address", "Address"), accessor: (b) => b.address ?? "—", type: "text", width: 32 },
      { header: t("branches.phone", "Phone"), accessor: (b) => b.phone ?? "—", type: "text", width: 18 },
      { header: t("branches.timezone", "Timezone"), accessor: (b) => b.timezone, type: "text", width: 18 },
      { header: t("branches.printer", "Printer"), accessor: (b) => (b.printer_brand ? `${b.printer_brand} @ ${b.printer_ip}:${b.printer_port}` : "—"), type: "text", width: 26 },
      { header: t("common.status", "Status"), accessor: (b) => (b.is_active ? t("common.active", "Active") : t("common.inactive", "Inactive")), type: "text", width: 12 },
    ];
    void exportToExcel({ filename: "Madar-Branches", sheets: [{ name: t("branches.title", "Branches"), title: t("branches.title", "Branches"), rows: branches as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }] });
  };

  if (!orgId) return <Page><PageHeader title={t("branches.title", "Branches")} /><EmptyState icon={GitBranch} title={t("branches.pickOrg", "Select an organization")} description={t("branches.pickOrgDescription", "Choose an organization from the sidebar to view and manage its branches.")} /></Page>;

  return (
    <Page>
      <PageHeader
        title={t("branches.title", "Branches")}
        description={t("branches.subtitle", "Manage your branch locations and printer config")}
        actions={<><ExportButton onExport={handleExport} disabled={!branches.length} /><Button onClick={() => update({ edit: "new" })}><Plus className="size-4" /> {t("common.new", "New")}</Button></>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("common.total", "Total")} value={branches.length} loading={list.isLoading} />
        <StatCard label={t("common.active", "Active")} value={branches.filter((b) => b.is_active).length} accent="success" loading={list.isLoading} />
        <StatCard label={t("branches.withPrinter", "With Printer")} value={branches.filter((b) => b.printer_brand).length} accent="info" loading={list.isLoading} />
        <StatCard label={t("common.inactive", "Inactive")} value={branches.filter((b) => !b.is_active).length} accent="warning" loading={list.isLoading} />
      </div>
      {list.isError ? (
        <EmptyState icon={GitBranch} title={t("branches.loadError", "Couldn't load branches")} description={t("common.tryRefresh", "Try refreshing the page.")} />
      ) : (
        <DataTable
          columns={columns}
          data={branches}
          loading={list.isLoading}
          getRowId={(b) => b.id}
          onRowClick={(b) => update({ edit: b.id })}
          searchPlaceholder={t("common.search", "Search…")}
          emptyState={<EmptyState icon={GitBranch} title={t("common.noResults", "No results")} />}
        />
      )}
      {dlgOpen ? <BranchDialog orgId={orgId} branch={editing} open={dlgOpen} onOpenChange={(o) => { if (!o) update({ edit: undefined }); }} /> : null}
    </Page>
  );
}
