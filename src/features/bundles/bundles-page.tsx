import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { Activity, Archive, Boxes, CheckCircle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { DataTable } from "@/components/app/data-table";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { ExportButton } from "@/components/app/export-button";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BundleDialog } from "./bundle-dialog";
import { PerformanceDialog } from "./performance-dialog";
import { invalidateBundles } from "./util";
import { activateBundle, archiveBundle, deleteBundle, getListBundlesQueryOptions, listBundles, useListBundles } from "@/data/api/generated/api";
import type { BundleStatus, BundleWithComponents } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { fmtMoney, piastresToEgp } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";
import { useDebounced } from "@/lib/use-debounced";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { useOrgId } from "@/hooks/use-org-id";
import { usePageSearch } from "@/data/scope/use-page-search";

const ALL = "__all__";
const PER_PAGE = 20;

export function BundlesPage() {
  const { t, i18n } = useTranslation();
  const orgId = useOrgId();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const enabled = !!orgId;

  const [search, setSearch] = useState("");
  const searchQ = useDebounced(search, 300);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [sort, setSort] = useState("created_desc");
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => { setPageIndex(0); }, [searchQ, statusFilter, sort]);

  const params = useMemo(
    () => ({
      org_id: orgId ?? "",
      search: searchQ || undefined,
      status: statusFilter === ALL ? undefined : (statusFilter as BundleStatus),
      // The backend default IS created_desc, so omit it to keep the warmed
      // prefetch cache key (no `sort`) identical to this page's first query.
      sort: sort === "created_desc" ? undefined : sort,
      page: pageIndex + 1,
      per_page: PER_PAGE,
    }),
    [orgId, searchQ, statusFilter, sort, pageIndex],
  );

  const list = useListBundles(params, { query: { enabled, placeholderData: keepPreviousData } });
  const bundles = useMemo(() => list.data?.data ?? [], [list.data]);
  const pageCount = list.data?.total_pages ?? 0;

  // Accurate totals regardless of the current page (server counts).
  const activeCount = useListBundles({ org_id: orgId ?? "", status: "active", per_page: 1 }, { query: { enabled } });
  const draftCount = useListBundles({ org_id: orgId ?? "", status: "draft", per_page: 1 }, { query: { enabled } });
  const archivedCount = useListBundles({ org_id: orgId ?? "", status: "archived", per_page: 1 }, { query: { enabled } });
  const counts = {
    active: activeCount.data?.total ?? 0,
    draft: draftCount.data?.total ?? 0,
    archived: archivedCount.data?.total ?? 0,
  };
  const totalCount = counts.active + counts.draft + counts.archived;

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

  const prefetchNext = () => {
    if (pageIndex + 1 >= pageCount) return;
    void queryClient.prefetchQuery(getListBundlesQueryOptions({ ...params, page: pageIndex + 2 }));
  };

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
      { accessorKey: "computed_cost", header: t("bundles.computedCostLabel", "Recipe cost"), cell: ({ row }) => <span className="text-xs tabular text-muted-foreground">{row.original.cost_missing ? "—" : fmtMoney(row.original.computed_cost)}</span> },
      {
        accessorKey: "status", header: t("common.status", "Status"),
        cell: ({ row }) => {
          const st = row.original.status;
          return <Badge variant={st === "active" ? "secondary" : st === "archived" ? "outline" : "default"}>{t(`bundles.status.${st}`, st)}</Badge>;
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

  const handleExport = async () => {
    try {
      // Export the full (unpaginated) set, honouring the active search/status.
      const all = await listBundles({ org_id: orgId ?? "", search: searchQ || undefined, status: statusFilter === ALL ? undefined : (statusFilter as BundleStatus), page: 1, per_page: 1000 });
      const cols: ExcelColumn<BundleWithComponents>[] = [
        { header: t("bundles.bundleName", "Bundle name"), accessor: (b) => tname(b), type: "text", width: 28 },
        { header: t("bundles.price", "Price"), accessor: (b) => piastresToEgp(b.price), type: "number", width: 14 },
        { header: t("bundles.computedCostLabel", "Recipe cost"), accessor: (b) => (b.cost_missing ? undefined : piastresToEgp(b.computed_cost)), type: "number", width: 14 },
        { header: t("bundles.components", "Items"), accessor: (b) => b.components.map((c) => `${c.item_name} (x${c.quantity})`).join(", "), type: "text", width: 40 },
        { header: t("common.status", "Status"), accessor: (b) => t(`bundles.status.${b.status}`, b.status), type: "text", width: 12 },
      ];
      await exportToExcel({ filename: "Madar-Bundles", sheets: [{ name: t("bundles.title", "Bundles"), title: t("bundles.title", "Bundles"), rows: all.data as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }] });
    } catch (e) {
      onErr(e);
    }
  };

  if (!orgId) {
    return <Page><PageHeader title={t("bundles.title", "Bundles")} /><EmptyState icon={Boxes} title={t("recipes.pickOrg", "Select an organization")} /></Page>;
  }

  return (
    <Page>
      <PageHeader
        title={t("bundles.title", "Bundles")}
        description={t("bundles.subtitle", "Combo deals that group items at a special price")}
        actions={<><ExportButton onExport={handleExport} disabled={totalCount === 0} /><Button onClick={() => update({ edit: "new" })}><Plus className="size-4" /> {t("bundles.new", "New bundle")}</Button></>}
      />

      <LedgerStrip
        items={[
          { key: "total", label: t("common.total", "Total"), value: totalCount, accent: "primary", loading: activeCount.isLoading },
          { key: "active", label: t("bundles.status.active", "Active"), value: counts.active, accent: "success", loading: activeCount.isLoading },
          { key: "draft", label: t("bundles.status.draft", "Draft"), value: counts.draft, accent: "info", loading: draftCount.isLoading },
          { key: "archived", label: t("bundles.status.archived", "Archived"), value: counts.archived, accent: "neutral", loading: archivedCount.isLoading },
        ] satisfies LedgerItem[]}
      />

      <DataTable
        columns={columns}
        data={bundles}
        loading={list.isLoading || (list.isFetching && !list.data)}
        getRowId={(b) => b.id}
        onRowClick={(b) => update({ edit: b.id })}
        manualPagination
        pageCount={pageCount}
        pagination={{ pageIndex, pageSize: PER_PAGE }}
        onPaginationChange={(updater) => {
          const next = typeof updater === "function" ? updater({ pageIndex, pageSize: PER_PAGE }) : updater;
          setPageIndex(next.pageIndex);
        }}
        onPrefetchNext={prefetchNext}
        toolbar={
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("common.search", "Search…")} className="h-9 ps-8" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-auto min-w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("bundles.allStatuses", "All statuses")}</SelectItem>
                <SelectItem value="active">{t("bundles.status.active", "Active")}</SelectItem>
                <SelectItem value="draft">{t("bundles.status.draft", "Draft")}</SelectItem>
                <SelectItem value="archived">{t("bundles.status.archived", "Archived")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-9 w-auto min-w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="created_desc">{t("bundles.sortNewest", "Newest")}</SelectItem>
                <SelectItem value="created_asc">{t("bundles.sortOldest", "Oldest")}</SelectItem>
                <SelectItem value="name_asc">{t("bundles.sortNameAsc", "Name (A–Z)")}</SelectItem>
                <SelectItem value="name_desc">{t("bundles.sortNameDesc", "Name (Z–A)")}</SelectItem>
                <SelectItem value="price_asc">{t("bundles.sortPriceAsc", "Price (low–high)")}</SelectItem>
                <SelectItem value="price_desc">{t("bundles.sortPriceDesc", "Price (high–low)")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        emptyState={<EmptyState icon={Boxes} title={t("bundles.empty", "No bundles yet")} description={t("bundles.emptyHint", "Create your first combo deal to boost average order value.")} />}
      />

      {dlgOpen ? <BundleDialog orgId={orgId} bundle={editing} open={dlgOpen} onOpenChange={(o) => { if (!o) update({ edit: undefined }); }} /> : null}
      {perf ? <PerformanceDialog bundle={perf} onClose={() => update({ perf: undefined })} /> : null}
    </Page>
  );
}
