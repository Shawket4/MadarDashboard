import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { DataTable } from "@/components/app/data-table";
import { StatCard } from "@/components/app/stat-card";
import { ExportButton } from "@/components/app/export-button";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/app/status-pill";
import { RowAction } from "@/features/users/row-action";
import { OrgDialog } from "./org-dialog";
import { invalidateOrgs } from "./util";
import { deleteOrg, useListOrgs } from "@/data/api/generated/api";
import type { Org } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { useExportLogo } from "@/hooks/use-export-logo";
import { usePageSearch } from "@/data/scope/use-page-search";

import { formatRate, fractionToPercent } from "./tax-rate";
export function OrgsPage() {
  const { t } = useTranslation();
  const confirm = useConfirm();

  // `/orgs` is unpaginated, so the table already holds every organization the
  // caller can see and the export has nothing extra to fetch.
  const list = useListOrgs();
  const orgs = useMemo(() => list.data ?? [], [list.data]);

  const logoUrl = useExportLogo();
  const [exporting, setExporting] = useState(false);

  const [s, update] = usePageSearch<{ edit: string }>();
  const editId = s.edit ?? null;
  const editing = editId && editId !== "new" ? (orgs.find((o) => o.id === editId) ?? null) : null;
  const dlgOpen = editId === "new" || !!editing;

  const remove = async (o: Org) => {
    if (await confirm({ title: t("orgs.deleteTitle", { name: o.name, defaultValue: `Delete ${o.name}?` }), description: t("orgs.deleteDescription", "Every branch, user and menu under this organization is removed. This cannot be undone."), destructive: true, confirmLabel: t("common.delete", "Delete") })) {
      try { await deleteOrg(o.id); void invalidateOrgs(); toast.success(t("orgs.deletedToast", "Organization deleted")); } catch (e) { toast.error(getErrorMessage(e)); }
    }
  };

  const columns = useMemo<ColumnDef<Org>[]>(
    () => [
      {
        accessorKey: "name", header: t("common.name", "Name"), meta: { label: t("common.name", "Name"), phone: "title" },
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.logo_url
              ? <img src={row.original.logo_url} alt="" className="size-8 shrink-0 rounded-lg object-cover" />
              : <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-xs font-bold text-muted-foreground">{row.original.name.slice(0, 2).toUpperCase()}</span>}
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{row.original.name}</p><p className="truncate font-mono text-xs text-muted-foreground">{row.original.slug}</p></div>
          </div>
        ),
      },
      { accessorKey: "currency_code", header: t("orgs.currency", "Currency"), meta: { label: t("orgs.currency", "Currency") }, cell: ({ row }) => <Badge variant="secondary" className="font-mono">{row.original.currency_code}</Badge> },
      { accessorKey: "tax_rate", header: t("orgs.taxRate", "Tax Rate (%)"), meta: { label: t("orgs.taxRate", "Tax Rate (%)"), numeric: true }, cell: ({ row }) => <span>{formatRate(row.original.tax_rate)}</span> },
      {
        accessorKey: "custom_branding",
        header: t("orgs.customBranding", "Custom branding"),
        meta: { label: t("orgs.customBranding", "Custom branding") },
        cell: ({ row }) =>
          row.original.custom_branding ? (
            <StatusPill tone="info">{t("common.on", "On")}</StatusPill>
          ) : (
            <span className="text-xs text-muted-foreground">{t("common.off", "Off")}</span>
          ),
      },
      {
        accessorKey: "is_active", header: t("common.status", "Status"),
        meta: { label: t("common.status", "Status") },
        cell: ({ row }) => row.original.is_active
          ? <StatusPill tone="success">{t("common.active", "Active")}</StatusPill>
          : <StatusPill tone="neutral">{t("common.inactive", "Inactive")}</StatusPill>,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, update],
  );

  const handleExport = async () => {
    const cols: ExcelColumn<Org>[] = [
      { header: t("common.name", "Name"), accessor: (o) => o.name, type: "text", width: 28 },
      { header: t("orgs.slug", "Slug"), accessor: (o) => o.slug, type: "text", width: 20 },
      { header: t("orgs.currency", "Currency"), accessor: (o) => o.currency_code, type: "text", width: 12 },
      { header: t("orgs.taxRate", "Tax Rate (%)"), accessor: (o) => fractionToPercent(o.tax_rate), type: "number", width: 12 },
      { header: t("common.status", "Status"), accessor: (o) => (o.is_active ? t("common.active", "Active") : t("common.inactive", "Inactive")), type: "text", width: 12 },
    ];
    setExporting(true);
    try {
      await exportToExcel({ filename: "Madar-Organizations", logoUrl, sheets: [{ name: t("orgs.title", "Organizations"), title: t("orgs.title", "Organizations"), rows: orgs as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }] });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  // tax_rate is stored as a FRACTION (0.14 = 14%), which is already the 0..1
  // ratio StatCard's percent format wants. This used to divide by 100 as well,
  // on the belief that the column held a percentage — the same belief that made
  // the settings field unusable.
  const avgTaxRatio = orgs.length ? orgs.reduce((a, o) => a + o.tax_rate, 0) / orgs.length : null;

  return (
    <Page>
      <PageHeader
        title={t("orgs.title", "Organizations")}
        description={t("orgs.subtitle", "Manage all coffee brands and franchises")}
        actions={<><ExportButton onExport={handleExport} loading={exporting} disabled={!orgs.length} /><Button onClick={() => update({ edit: "new" })}><Plus className="size-4" /> {t("common.new", "New")}</Button></>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("common.total", "Total")} value={orgs.length} loading={list.isLoading} />
        <StatCard label={t("common.active", "Active")} value={orgs.filter((o) => o.is_active).length} loading={list.isLoading} />
        <StatCard label={t("common.inactive", "Inactive")} value={orgs.filter((o) => !o.is_active).length} loading={list.isLoading} />
        <StatCard label={t("orgs.avgTax", "Avg Tax")} value={avgTaxRatio ?? "—"} formatType="percent" loading={list.isLoading} />
      </div>
      <DataTable
          columns={columns}
          data={orgs}
          loading={list.isLoading}
          error={list.error}
          onRetry={() => void list.refetch()}
          rowActions={(r) => (
            <>
              <RowAction label={t("common.edit", "Edit")} onClick={() => update({ edit: r.id })}><Pencil className="size-4" /></RowAction>
              <RowAction destructive label={t("common.delete", "Delete")} onClick={() => void remove(r)}><Trash2 className="size-4" /></RowAction>
            </>
          )}
          getRowId={(o) => o.id}
          onRowClick={(o) => update({ edit: o.id })}
          searchPlaceholder={t("common.search", "Search…")}
          emptyState={<EmptyState icon={Building2} title={t("orgs.empty", "Organizations you add appear here")} />}
        />
      {dlgOpen ? <OrgDialog org={editing} open={dlgOpen} onOpenChange={(o) => { if (!o) update({ edit: undefined }); }} /> : null}
    </Page>
  );
}
