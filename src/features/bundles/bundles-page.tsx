import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { Activity, Archive, Boxes, CheckCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { DataTable } from "@/components/app/data-table";
import { StatCard } from "@/components/app/stat-card";
import { ExportButton } from "@/components/app/export-button";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BundleDialog } from "./bundle-dialog";
import { PerformanceDialog } from "./performance-dialog";
import { invalidateBundles } from "./util";
import { activateBundle, archiveBundle, deleteBundle, useListBundles } from "@/data/api/generated/api";
import type { BundleWithComponents } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { fmtMoney, piastresToEgp } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { useOrgId } from "@/hooks/use-org-id";
import { usePageSearch } from "@/data/scope/use-page-search";

export function BundlesPage() {
  const { t, i18n } = useTranslation();
  const orgId = useOrgId();
  const confirm = useConfirm();

  const list = useListBundles({ org_id: orgId ?? "", page: 1, per_page: 500 }, { query: { enabled: !!orgId } });
  const bundles = useMemo(() => list.data?.data ?? [], [list.data]);
  const tname = (n: { name: string; name_translations?: unknown }) => getTranslatedName(n, i18n.language);

  // Editor / performance dialogs live in the URL (?edit=<id>|new, ?perf=<id>).
  const [s, update] = usePageSearch<{ edit: string; perf: string }>();
  const editId = s.edit ?? null;
  const editing = editId && editId !== "new" ? (bundles.find((b) => b.id === editId) ?? null) : null;
  const dlgOpen = editId === "new" || !!editing;
  const perf = s.perf ? (bundles.find((b) => b.id === s.perf) ?? null) : null;

  const onErr = (e: unknown) => toast.error(getErrorMessage(e));
  const runAction = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); void invalidateBundles(); toast.success(msg); } catch (e) { onErr(e); }
  };
  const remove = async (b: BundleWithComponents) => {
    if (await confirm({ title: t("common.confirmDelete", { name: b.name, defaultValue: `Delete "${b.name}"?` }), destructive: true, confirmLabel: t("common.delete", "Delete") })) {
      void runAction(() => deleteBundle(b.id), t("bundles.deletedToast", "Bundle deleted"));
    }
  };

  const counts = useMemo(() => ({
    active: bundles.filter((b) => b.status === "active").length,
    draft: bundles.filter((b) => b.status === "draft").length,
    archived: bundles.filter((b) => b.status === "archived").length,
  }), [bundles]);

  const columns = useMemo<ColumnDef<BundleWithComponents>[]>(
    () => [
      {
        accessorKey: "name", header: t("bundles.bundleName", "Bundle name"),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-primary/20 bg-primary/10 text-primary">
              {row.original.image_url ? <img src={row.original.image_url} alt="" className="size-full object-cover" /> : <Boxes className="size-4" />}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{tname(row.original)}</p>
              <p className="max-w-xs truncate text-xs text-muted-foreground">{row.original.description || "—"}</p>
            </div>
          </div>
        ),
      },
      {
        id: "components", header: t("bundles.components", "Items"),
        cell: ({ row }) => (
          <div className="flex max-w-sm flex-wrap gap-1">
            {row.original.components.map((c) => (
              <Badge key={c.id} variant="secondary" className="text-xs">{c.item_name} <span className="ms-1 font-bold text-primary">×{c.quantity}</span></Badge>
            ))}
          </div>
        ),
      },
      { accessorKey: "price", header: t("bundles.price", "Price"), cell: ({ row }) => <span className="font-bold tabular">{fmtMoney(row.original.price)}</span> },
      { accessorKey: "computed_cost", header: t("bundles.computedCostLabel", "Recipe cost"), cell: ({ row }) => <span className="text-xs tabular text-muted-foreground">{fmtMoney(row.original.computed_cost)}</span> },
      {
        accessorKey: "status", header: t("common.status", "Status"),
        cell: ({ row }) => {
          const s = row.original.status;
          return <Badge variant={s === "active" ? "secondary" : s === "archived" ? "outline" : "default"}>{t(`bundles.status.${s}`, s)}</Badge>;
        },
      },
      {
        id: "actions", header: "",
        cell: ({ row }) => {
          const b = row.original;
          return (
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon-sm" title={t("bundles.performance.title", "Performance")} onClick={() => update({ perf: b.id })}><Activity className="size-4" /></Button>
              {b.status === "draft" ? <Button variant="ghost" size="icon-sm" className="text-success" title={t("bundles.activate", "Activate")} onClick={() => void runAction(() => activateBundle(b.id), t("bundles.activatedToast", "Bundle activated"))}><CheckCircle className="size-4" /></Button> : null}
              {b.status === "active" ? <Button variant="ghost" size="icon-sm" title={t("bundles.archive", "Archive")} onClick={() => void runAction(() => archiveBundle(b.id), t("bundles.archivedToast", "Bundle archived"))}><Archive className="size-4" /></Button> : null}
              <Button variant="ghost" size="icon-sm" onClick={() => update({ edit: b.id })}><Pencil className="size-4" /></Button>
              <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => void remove(b)}><Trash2 className="size-4" /></Button>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.language, update],
  );

  const handleExport = () => {
    const cols: ExcelColumn<BundleWithComponents>[] = [
      { header: t("bundles.bundleName", "Bundle name"), accessor: (b) => tname(b), type: "text", width: 28 },
      { header: t("bundles.price", "Price"), accessor: (b) => piastresToEgp(b.price), type: "number", width: 14 },
      { header: t("bundles.computedCostLabel", "Recipe cost"), accessor: (b) => piastresToEgp(b.computed_cost), type: "number", width: 14 },
      { header: t("bundles.components", "Items"), accessor: (b) => b.components.map((c) => `${c.item_name} (x${c.quantity})`).join(", "), type: "text", width: 40 },
      { header: t("common.status", "Status"), accessor: (b) => t(`bundles.status.${b.status}`, b.status), type: "text", width: 12 },
    ];
    void exportToExcel({ filename: "Sufrix-Bundles", sheets: [{ name: t("bundles.title", "Bundles"), title: t("bundles.title", "Bundles"), rows: bundles as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }] });
  };

  if (!orgId) {
    return <Page><PageHeader title={t("bundles.title", "Bundles")} /><EmptyState icon={Boxes} title={t("recipes.pickOrg", "Select an organization")} /></Page>;
  }

  return (
    <Page>
      <PageHeader
        title={t("bundles.title", "Bundles")}
        description={t("bundles.subtitle", "Combo deals that group items at a special price")}
        actions={<><ExportButton onExport={handleExport} disabled={!bundles.length} /><Button onClick={() => update({ edit: "new" })}><Plus className="size-4" /> {t("bundles.new", "New bundle")}</Button></>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("common.total", "Total")} value={bundles.length} loading={list.isLoading} />
        <StatCard label={t("bundles.status.active", "Active")} value={counts.active} accent="success" loading={list.isLoading} />
        <StatCard label={t("bundles.status.draft", "Draft")} value={counts.draft} accent="info" loading={list.isLoading} />
        <StatCard label={t("bundles.status.archived", "Archived")} value={counts.archived} loading={list.isLoading} />
      </div>

      <DataTable
        columns={columns}
        data={bundles}
        loading={list.isLoading}
        getRowId={(b) => b.id}
        onRowClick={(b) => update({ edit: b.id })}
        searchPlaceholder={t("common.search", "Search…")}
        emptyState={<EmptyState icon={Boxes} title={t("bundles.empty", "No bundles yet")} description={t("bundles.emptyHint", "Create your first combo deal to boost average order value.")} />}
      />

      {dlgOpen ? <BundleDialog orgId={orgId} bundle={editing} open={dlgOpen} onOpenChange={(o) => { if (!o) update({ edit: undefined }); }} /> : null}
      {perf ? <PerformanceDialog bundle={perf} onClose={() => update({ perf: undefined })} /> : null}
    </Page>
  );
}
