import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2, CheckCircle, Pencil, Plus, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { DataTable } from "@/components/app/data-table";
import { StatCard } from "@/components/app/stat-card";
import { ExportButton } from "@/components/app/export-button";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrgDialog } from "./org-dialog";
import { invalidateOrgs } from "./util";
import { deleteOrg, useListOrgs } from "@/data/api/generated/api";
import type { Org } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { usePageSearch } from "@/data/scope/use-page-search";

export function OrgsPage() {
  const { t } = useTranslation();
  const confirm = useConfirm();

  const list = useListOrgs();
  const orgs = useMemo(() => list.data ?? [], [list.data]);

  const [s, update] = usePageSearch<{ edit: string }>();
  const editId = s.edit ?? null;
  const editing = editId && editId !== "new" ? (orgs.find((o) => o.id === editId) ?? null) : null;
  const dlgOpen = editId === "new" || !!editing;

  const remove = async (o: Org) => {
    if (await confirm({ title: t("common.confirmDelete", { name: o.name, defaultValue: `Delete "${o.name}"?` }), destructive: true, confirmLabel: t("common.delete", "Delete") })) {
      try { await deleteOrg(o.id); void invalidateOrgs(); toast.success(t("orgs.deletedToast", "Organization deleted")); } catch (e) { toast.error(getErrorMessage(e)); }
    }
  };

  const columns = useMemo<ColumnDef<Org>[]>(
    () => [
      {
        accessorKey: "name", header: t("common.name", "Name"),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.logo_url
              ? <img src={row.original.logo_url} alt="" className="size-8 shrink-0 rounded-lg object-cover" />
              : <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">{row.original.name.slice(0, 2).toUpperCase()}</span>}
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{row.original.name}</p><p className="truncate font-mono text-xs text-muted-foreground">{row.original.slug}</p></div>
          </div>
        ),
      },
      { accessorKey: "currency_code", header: t("orgs.currency", "Currency"), cell: ({ row }) => <Badge variant="outline" className="font-mono">{row.original.currency_code}</Badge> },
      { accessorKey: "tax_rate", header: t("orgs.taxRate", "Tax Rate (%)"), cell: ({ row }) => <span className="font-mono text-sm">{row.original.tax_rate}%</span> },
      {
        accessorKey: "is_active", header: t("common.status", "Status"),
        cell: ({ row }) => row.original.is_active
          ? <Badge variant="outline" className="border-transparent bg-success/15 text-success"><CheckCircle className="size-3" /> {t("common.active", "Active")}</Badge>
          : <Badge variant="outline"><XCircle className="size-3" /> {t("common.inactive", "Inactive")}</Badge>,
      },
      {
        id: "actions", header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon-sm" onClick={() => update({ edit: row.original.id })}><Pencil className="size-4" /></Button>
            <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => void remove(row.original)}><Trash2 className="size-4" /></Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, update],
  );

  const handleExport = () => {
    const cols: ExcelColumn<Org>[] = [
      { header: t("common.name", "Name"), accessor: (o) => o.name, type: "text", width: 28 },
      { header: t("orgs.slug", "Slug"), accessor: (o) => o.slug, type: "text", width: 20 },
      { header: t("orgs.currency", "Currency"), accessor: (o) => o.currency_code, type: "text", width: 12 },
      { header: t("orgs.taxRate", "Tax Rate (%)"), accessor: (o) => o.tax_rate, type: "number", width: 12 },
      { header: t("common.status", "Status"), accessor: (o) => (o.is_active ? t("common.active", "Active") : t("common.inactive", "Inactive")), type: "text", width: 12 },
    ];
    void exportToExcel({ filename: "Sufrix-Organizations", sheets: [{ name: t("orgs.title", "Organizations"), title: t("orgs.title", "Organizations"), rows: orgs as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }] });
  };

  const avgTax = orgs.length ? `${(orgs.reduce((a, o) => a + o.tax_rate, 0) / orgs.length).toFixed(1)}%` : "—";

  return (
    <Page>
      <PageHeader
        title={t("orgs.title", "Organizations")}
        description={t("orgs.subtitle", "Manage all coffee brands and franchises")}
        actions={<><ExportButton onExport={handleExport} disabled={!orgs.length} /><Button onClick={() => update({ edit: "new" })}><Plus className="size-4" /> {t("common.new", "New")}</Button></>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("common.total", "Total")} value={orgs.length} loading={list.isLoading} />
        <StatCard label={t("common.active", "Active")} value={orgs.filter((o) => o.is_active).length} accent="success" loading={list.isLoading} />
        <StatCard label={t("common.inactive", "Inactive")} value={orgs.filter((o) => !o.is_active).length} accent="warning" loading={list.isLoading} />
        <StatCard label={t("orgs.avgTax", "Avg Tax")} value={avgTax} accent="info" loading={list.isLoading} />
      </div>
      <DataTable
        columns={columns}
        data={orgs}
        loading={list.isLoading}
        getRowId={(o) => o.id}
        onRowClick={(o) => update({ edit: o.id })}
        searchPlaceholder={t("common.search", "Search…")}
        emptyState={<EmptyState icon={Building2} title={t("common.noResults", "No results")} />}
      />
      {dlgOpen ? <OrgDialog org={editing} open={dlgOpen} onOpenChange={(o) => { if (!o) update({ edit: undefined }); }} /> : null}
    </Page>
  );
}
