import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { CreditCard, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { DataTable } from "@/components/app/data-table";
import { StatCard } from "@/components/app/stat-card";
import { ExportButton } from "@/components/app/export-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PaymentMethodDialog } from "./payment-method-dialog";
import { iconFor, invalidatePaymentMethods, isSystemMethod, labelOf } from "./util";
import { activatePaymentMethod, deactivatePaymentMethod, useListPaymentMethods } from "@/data/api/generated/api";
import type { OrgPaymentMethod } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { useOrgId } from "@/hooks/use-org-id";
import { usePageSearch } from "@/data/scope/use-page-search";

export function PaymentMethodsPage() {
  const { t, i18n } = useTranslation();
  const orgId = useOrgId();

  const list = useListPaymentMethods({ query: { enabled: !!orgId } });
  const methods = useMemo(() => list.data ?? [], [list.data]);
  const label = (m: OrgPaymentMethod) => labelOf(m, i18n.language);

  const [s, update] = usePageSearch<{ edit: string }>();
  const editId = s.edit ?? null;
  const editing = editId && editId !== "new" ? (methods.find((m) => m.id === editId) ?? null) : null;
  const dlgOpen = editId === "new" || !!editing;

  const toggle = async (m: OrgPaymentMethod) => {
    try { await (m.is_active ? deactivatePaymentMethod(m.id) : activatePaymentMethod(m.id)); void invalidatePaymentMethods(); } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const columns = useMemo<ColumnDef<OrgPaymentMethod>[]>(
    () => [
      {
        accessorKey: "name", header: t("common.name", "Name"),
        cell: ({ row }) => {
          const Icon = iconFor(row.original.icon);
          const color = row.original.color?.startsWith("#") ? row.original.color : "var(--chart-3)";
          return (
            <div className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full text-white" style={{ backgroundColor: color }}><Icon className="size-3.5" /></span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{label(row.original)}</p>
                {isSystemMethod(row.original) ? <p className="text-xs text-muted-foreground">{t("settings.pm.system", "System")}</p> : null}
              </div>
            </div>
          );
        },
      },
      { accessorKey: "is_cash", header: t("common.type", "Type"), cell: ({ row }) => <Badge variant={row.original.is_cash ? "outline" : "secondary"} className={row.original.is_cash ? "border-transparent bg-success/15 text-success" : ""}>{row.original.is_cash ? t("settings.pm.cashBase", "Cash") : t("settings.pm.nonCash", "Non-cash")}</Badge> },
      {
        accessorKey: "is_active", header: t("common.status", "Status"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Switch checked={row.original.is_active} onCheckedChange={() => void toggle(row.original)} />
            <Badge
              variant="outline"
              className={row.original.is_active
                ? "border-transparent bg-success/15 text-success"
                : "border-transparent bg-muted text-muted-foreground"}
            >
              {row.original.is_active
                ? t("common.active", "Active")
                : t("common.inactive", "Inactive")}
            </Badge>
          </div>
        ),
      },
      {
        id: "actions", header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon-sm" onClick={() => update({ edit: row.original.id })}><Pencil className="size-4" /></Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.language, update],
  );

  const handleExport = () => {
    const cols: ExcelColumn<OrgPaymentMethod>[] = [
      { header: t("settings.pm.id", "Identifier"), accessor: (m) => m.name, type: "text", width: 22 },
      { header: t("common.name", "Name"), accessor: (m) => label(m), type: "text", width: 28 },
      { header: t("common.type", "Type"), accessor: (m) => (m.is_cash ? t("settings.pm.cashBase", "Cash") : t("settings.pm.nonCash", "Non-cash")), type: "text", width: 14 },
      { header: t("common.status", "Status"), accessor: (m) => (m.is_active ? t("common.active", "Active") : t("common.inactive", "Inactive")), type: "text", width: 12 },
    ];
    void exportToExcel({ filename: "Madar-PaymentMethods", sheets: [{ name: t("settings.paymentMethods", "Payment Methods"), title: t("settings.paymentMethods", "Payment Methods"), rows: methods as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }] });
  };

  if (!orgId) return <Page><PageHeader title={t("settings.paymentMethods", "Payment Methods")} /><EmptyState icon={CreditCard} title={t("users.pickOrg", "Select an organization")} /></Page>;

  const active = methods.filter((m) => m.is_active).length;

  return (
    <Page>
      <PageHeader
        title={t("settings.paymentMethods", "Payment Methods")}
        description={t("settings.paymentMethodsHint", "Manage payment methods available for checkout.")}
        actions={<><ExportButton onExport={handleExport} disabled={!methods.length} /><Button onClick={() => update({ edit: "new" })}><Plus className="size-4" /> {t("common.add", "Add")}</Button></>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("common.total", "Total")} value={methods.length} loading={list.isLoading} />
        <StatCard label={t("common.active", "Active")} value={active} accent="success" loading={list.isLoading} />
        <StatCard label={t("common.inactive", "Inactive")} value={methods.length - active} accent="warning" loading={list.isLoading} />
        <StatCard label={t("settings.pm.systemMethods", "System methods")} value={methods.filter(isSystemMethod).length} accent="info" loading={list.isLoading} />
      </div>
      <DataTable
        columns={columns}
        data={methods}
        loading={list.isLoading}
        getRowId={(m) => m.id}
        onRowClick={(m) => update({ edit: m.id })}
        searchPlaceholder={t("common.search", "Search…")}
        emptyState={<EmptyState icon={CreditCard} title={t("common.noResults", "No results")} />}
      />
      {dlgOpen ? <PaymentMethodDialog method={editing} open={dlgOpen} onOpenChange={(o) => { if (!o) update({ edit: undefined }); }} /> : null}
    </Page>
  );
}
