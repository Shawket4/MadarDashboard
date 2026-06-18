import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle, DollarSign, Pencil, Percent, Plus, Tag, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Page } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { DataTable } from "@/components/app/data-table";
import { StatCard } from "@/components/app/stat-card";
import { ExportButton } from "@/components/app/export-button";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DiscountDialog } from "./discount-dialog";
import { invalidateDiscounts } from "./util";
import { deleteDiscount, updateDiscount, useListDiscounts } from "@/data/api/generated/api";
import type { Discount } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { fmtMoney, piastresToEgp } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { useOrgId } from "@/hooks/use-org-id";
import { usePageSearch } from "@/data/scope/use-page-search";

export function DiscountsPage() {
  const { t, i18n } = useTranslation();
  const orgId = useOrgId();
  const confirm = useConfirm();

  const list = useListDiscounts({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const discounts = useMemo(() => list.data ?? [], [list.data]);
  const tname = (d: Discount) => getTranslatedName(d, i18n.language);

  const [s, update] = usePageSearch<{ edit: string }>();
  const editId = s.edit ?? null;
  const editing = editId && editId !== "new" ? (discounts.find((d) => d.id === editId) ?? null) : null;
  const dlgOpen = editId === "new" || !!editing;

  const onErr = (e: unknown) => toast.error(getErrorMessage(e));
  const valueLabel = (d: Discount) => (d.dtype === "percentage" ? `${d.value}%` : fmtMoney(d.value));

  const toggleActive = async (d: Discount) => {
    try { await updateDiscount(d.id, { is_active: !d.is_active }); void invalidateDiscounts(); } catch (e) { onErr(e); }
  };
  const remove = async (d: Discount) => {
    if (await confirm({ title: t("common.confirmDelete", { name: d.name, defaultValue: `Delete "${d.name}"?` }), destructive: true, confirmLabel: t("common.delete", "Delete") })) {
      try { await deleteDiscount(d.id); void invalidateDiscounts(); toast.success(t("discounts.deletedToast", "Discount deleted")); } catch (e) { onErr(e); }
    }
  };

  const columns = useMemo<ColumnDef<Discount>[]>(
    () => [
      {
        accessorKey: "name", header: t("discounts.discountName", "Discount name"),
        cell: ({ row }) => {
          const pct = row.original.dtype === "percentage";
          return (
            <div className="flex items-center gap-3">
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", pct ? "bg-info/10 text-info" : "bg-success/10 text-success")}>
                {pct ? <Percent className="size-3.5" /> : <DollarSign className="size-3.5" />}
              </span>
              <span className="text-sm font-semibold">{tname(row.original)}</span>
            </div>
          );
        },
      },
      { accessorKey: "dtype", header: t("common.type", "Type"), cell: ({ row }) => <Badge variant="outline">{row.original.dtype === "percentage" ? t("discounts.percentage", "Percentage") : t("discounts.fixed", "Fixed amount")}</Badge> },
      { accessorKey: "value", header: t("discounts.value", "Value"), cell: ({ row }) => <span className="font-semibold tabular">{valueLabel(row.original)}</span> },
      {
        accessorKey: "is_active", header: t("common.status", "Status"),
        cell: ({ row }) => (
          <button type="button" onClick={(e) => { e.stopPropagation(); void toggleActive(row.original); }}>
            {row.original.is_active
              ? <Badge variant="outline" className="border-transparent bg-success/15 text-success"><CheckCircle className="size-3" /> {t("common.active", "Active")}</Badge>
              : <Badge variant="outline"><XCircle className="size-3" /> {t("common.inactive", "Inactive")}</Badge>}
          </button>
        ),
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
    [t, i18n.language, update],
  );

  const handleExport = () => {
    const cols: ExcelColumn<Discount>[] = [
      { header: t("discounts.discountName", "Discount name"), accessor: (d) => tname(d), type: "text", width: 28 },
      { header: t("common.type", "Type"), accessor: (d) => (d.dtype === "percentage" ? t("discounts.percentage", "Percentage") : t("discounts.fixed", "Fixed amount")), type: "text", width: 16 },
      { header: t("discounts.value", "Value"), accessor: (d) => (d.dtype === "percentage" ? d.value : piastresToEgp(d.value)), type: "number", width: 14 },
      { header: t("common.status", "Status"), accessor: (d) => (d.is_active ? t("common.active", "Active") : t("common.inactive", "Inactive")), type: "text", width: 12 },
    ];
    void exportToExcel({ filename: "Sufrix-Discounts", sheets: [{ name: t("discounts.title", "Discounts"), title: t("discounts.title", "Discounts"), rows: discounts as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }] });
  };

  if (!orgId) return <Page><div className="space-y-1.5"><h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t("discounts.title", "Discounts")}</h1></div><EmptyState icon={Tag} title={t("discounts.pickOrg", "Select an organization")} /></Page>;

  const active = discounts.filter((d) => d.is_active).length;
  const pct = discounts.filter((d) => d.dtype === "percentage").length;
  const fixed = discounts.filter((d) => d.dtype === "fixed").length;

  return (
    <Page>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t("discounts.title", "Discounts")}</h1>
          <p className="text-sm text-muted-foreground">{t("discounts.subtitle", "Percentage and fixed-amount discounts")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ExportButton onExport={handleExport} disabled={!discounts.length} />
          <Button onClick={() => update({ edit: "new" })}><Plus className="size-4" /> {t("discounts.new", "New discount")}</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("common.total", "Total")} value={discounts.length} loading={list.isLoading} />
        <StatCard label={t("common.active", "Active")} value={active} accent="success" loading={list.isLoading} />
        <StatCard label={t("discounts.percentage", "Percentage")} value={pct} accent="info" loading={list.isLoading} />
        <StatCard label={t("discounts.fixed", "Fixed amount")} value={fixed} accent="warning" loading={list.isLoading} />
      </div>
      <DataTable
        columns={columns}
        data={discounts}
        loading={list.isLoading}
        getRowId={(d) => d.id}
        onRowClick={(d) => update({ edit: d.id })}
        searchPlaceholder={t("common.search", "Search…")}
        emptyState={<EmptyState icon={Tag} title={t("discounts.empty", "No discounts yet")} description={t("discounts.emptyHint", "Create your first discount to use at checkout.")} />}
      />
      {dlgOpen ? <DiscountDialog orgId={orgId} discount={editing} open={dlgOpen} onOpenChange={(o) => { if (!o) update({ edit: undefined }); }} /> : null}
    </Page>
  );
}
