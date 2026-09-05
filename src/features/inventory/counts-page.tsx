import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardList, PlusCircle, X } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OrgIngredient, Stocktake } from "@/data/api/generated/models";
import { createStocktake, useListCatalog, useListIngredientCategories, useListStocktakes } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { useOrgId } from "@/hooks/use-org-id";
import { useScope } from "@/data/scope/use-scope";
import { fmtDateTime } from "@/lib/format";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { cn } from "@/lib/utils";
import { Combobox } from "@/components/app/combobox";
import { CountEditor } from "./count-editor";
import { VarianceReportDialog } from "./variance-report-dialog";
import { STOCKTAKE_STATUS_STYLES, invalidateInventory, isOpenStocktake, needsFirstCount } from "./lib";

type ScopeType = "full" | "category" | "items";

/**
 * Stock counts — the front door of inventory. A branch is counted from the
 * org catalog alone: no per-branch setup, no "tracked" list. The first
 * finalized count is what brings a branch's numbers to life.
 */
export function CountsPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const { branchId, scopeBranchId, isAllBranches } = useScope();
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const [scopeType, setScopeType] = useState<ScopeType>("full");
  const [scopeCategory, setScopeCategory] = useState("");
  const [scopeItems, setScopeItems] = useState<string[]>([]);
  const [starting, setStarting] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

  const stocktakes = useListStocktakes(scopeBranchId, { query: { enabled: !!scopeBranchId } });
  const categories = useListIngredientCategories(orgId ?? "", { query: { enabled: scopeDialogOpen && !!orgId } });
  const catalog = useListCatalog(orgId ?? "", { query: { enabled: scopeDialogOpen && !!orgId } });
  const openCount = useMemo(() => (stocktakes.data ?? []).find((s) => isOpenStocktake(s.status)) ?? null, [stocktakes.data]);
  const history = useMemo(() => (stocktakes.data ?? []).filter((s) => !isOpenStocktake(s.status)), [stocktakes.data]);
  const firstRun = !!branchId && !openCount && !stocktakes.isLoading && needsFirstCount(stocktakes.data);

  const catalogOptions = useMemo(
    () => (catalog.data ?? []).map((i: OrgIngredient) => ({ value: i.id, label: i.name, hint: i.category_name })),
    [catalog.data],
  );

  const openScopeDialog = () => {
    setScopeType("full");
    setScopeCategory("");
    setScopeItems([]);
    setScopeDialogOpen(true);
  };

  const start = async () => {
    if (!branchId) return;
    setStarting(true);
    try {
      await createStocktake(branchId, {
        note: null,
        category_id: scopeType === "category" && scopeCategory ? scopeCategory : null,
        org_ingredient_ids: scopeType === "items" && scopeItems.length > 0 ? scopeItems : null,
      });
      await invalidateInventory();
      toast.success(t("inventory.stocktakes.started", "Started"));
      setScopeDialogOpen(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setStarting(false);
    }
  };

  const scopeLabel = (s: Stocktake) => {
    const kind = (s.scope as { kind?: string } | undefined)?.kind ?? "full";
    if (kind === "category") return t("inventory.stocktakes.scopeCategoryShort", "By category");
    if (kind === "items") return t("inventory.stocktakes.scopeItemsShort", "Selected items");
    return t("inventory.stocktakes.scopeFullShort", "Whole branch");
  };

  const columns = useMemo<ColumnDef<Stocktake>[]>(() => [
    {
      accessorKey: "started_at",
      header: t("inventory.stocktakes.started", "Started"),
      cell: ({ row }) => <span className="tabular">{fmtDateTime(row.original.started_at)}</span>,
    },
    ...(isAllBranches
      ? ([{
          accessorKey: "branch_name",
          header: t("shifts.branch", "Branch"),
          cell: ({ row }) => <span>{row.original.branch_name ?? "—"}</span>,
        }] as ColumnDef<Stocktake>[])
      : []),
    {
      id: "scope",
      header: t("inventory.stocktakes.scope", "Scope"),
      cell: ({ row }) => (
        <span className="text-sm">
          {scopeLabel(row.original)}
          {row.original.total_items != null ? (
            <span className="text-muted-foreground tabular"> · {row.original.counted_items ?? 0}/{row.original.total_items}</span>
          ) : null}
        </span>
      ),
    },
    {
      accessorKey: "started_by_name",
      header: t("inventory.transfers.by", "By"),
      cell: ({ row }) => row.original.started_by_name ?? "—",
    },
    {
      accessorKey: "status",
      header: t("inventory.stocktakes.status", "Status"),
      cell: ({ row }) => (
        <Badge variant="secondary" className={cn(STOCKTAKE_STATUS_STYLES[row.original.status] ?? "")}>
          {t(`inventory.stocktakes.st_${row.original.status}`, row.original.status)}
        </Badge>
      ),
    },
    {
      accessorKey: "finalized_at",
      header: t("inventory.stocktakes.finalized", "Finalized"),
      cell: ({ row }) => <span className="tabular">{fmtDateTime(row.original.finalized_at)}</span>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) =>
        row.original.status === "finalized" ? (
          <div className="text-end">
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setReportId(row.original.id); }}>
              {t("inventory.stocktakes.viewReport", "View report")}
            </Button>
          </div>
        ) : null,
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, isAllBranches]);

  const handleExport = () => {
    const cols: ExcelColumn<Stocktake>[] = [
      { header: t("inventory.stocktakes.started", "Started"), accessor: (s) => s.started_at, type: "dateTime", width: 20 },
      { header: t("inventory.transfers.by", "By"), accessor: (s) => s.started_by_name ?? "—", type: "text", width: 20 },
      { header: t("inventory.stocktakes.scope", "Scope"), accessor: (s) => scopeLabel(s), type: "text", width: 16 },
      { header: t("inventory.stocktakes.status", "Status"), accessor: (s) => t(`inventory.stocktakes.st_${s.status}`, s.status), type: "text", width: 14 },
      { header: t("inventory.stocktakes.finalized", "Finalized"), accessor: (s) => s.finalized_at ?? "", type: "dateTime", width: 20 },
      { header: t("inventory.transfers.note", "Note"), accessor: (s) => s.note ?? "", type: "text", width: 30 },
    ];
    void exportToExcel({ filename: "Madar-Stocktakes", sheets: [{ name: t("inventory.stocktakes.title", "Stock counts"), title: t("inventory.stocktakes.title", "Stock counts"), rows: history as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }] });
  };

  return (
    <Page>
      <PageHeader
        title={t("inventory.stocktakes.title", "Stock counts")}
        description={t("inventory.stocktakes.subtitle", "Count the shelf; everything else follows from the count.")}
        actions={
          <div className="flex shrink-0 items-center gap-2">
            <ExportButton onExport={handleExport} disabled={!history.length} />
            {branchId && !openCount ? (
              <Button onClick={openScopeDialog}>
                <PlusCircle className="size-4" />
                {t("inventory.stocktakes.start", "Start a count")}
              </Button>
            ) : null}
          </div>
        }
      />

      {!branchId ? (
        <p className="text-sm text-muted-foreground">{t("inventory.stocktakes.pickBranchToCount", "Select a branch to start a count. The list below shows every branch's counts.")}</p>
      ) : null}

      {firstRun ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="font-semibold">{t("inventory.stocktakes.firstRunTitle", "This branch has never been counted")}</p>
              <p className="max-w-prose text-sm text-muted-foreground">
                {t("inventory.stocktakes.firstRunHint", "Start with a whole-branch count. Every ingredient in your catalog is listed; count what is on the shelf and finalize. Low stock, valuation and usage all start from here.")}
              </p>
            </div>
            <Button size="lg" onClick={openScopeDialog}>
              <ClipboardList className="size-4" />
              {t("inventory.stocktakes.startFirst", "Count this branch")}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {branchId && openCount ? (
        <CountEditor
          stocktakeId={openCount.id}
          onFinalized={(id) => setReportId(id)}
          onCancelled={() => void invalidateInventory()}
        />
      ) : null}

      <DataTable
        columns={columns}
        data={branchId ? history : (stocktakes.data ?? [])}
        loading={stocktakes.isLoading}
        getRowId={(s) => s.id}
        onRowClick={(s) => s.status === "finalized" && setReportId(s.id)}
        emptyState={<EmptyState icon={ClipboardList} title={t("inventory.stocktakes.noStocktakes", "No counts yet")} description={t("inventory.stocktakes.startHint", "Start a count to bring this branch's stock to life.")} />}
      />

      <VarianceReportDialog stocktakeId={reportId} open={!!reportId} onOpenChange={(o) => !o && setReportId(null)} />

      <Dialog open={scopeDialogOpen} onOpenChange={setScopeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("inventory.stocktakes.scopeTitle", "What do you want to count?")}</DialogTitle>
            <DialogDescription>{t("inventory.stocktakes.scopeHint", "A whole-branch count lists every ingredient in your catalog. A targeted count is faster and leaves everything else untouched.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={scopeType} onValueChange={(v) => setScopeType(v as ScopeType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="full">{t("inventory.stocktakes.scopeFull", "Whole branch — every ingredient")}</SelectItem>
                <SelectItem value="category">{t("inventory.stocktakes.scopeCategory", "One category")}</SelectItem>
                <SelectItem value="items">{t("inventory.stocktakes.scopeItems", "Specific ingredients")}</SelectItem>
              </SelectContent>
            </Select>
            {scopeType === "category" ? (
              <Select value={scopeCategory} onValueChange={setScopeCategory}>
                <SelectTrigger><SelectValue placeholder={t("inventory.catalog.category", "Category")} /></SelectTrigger>
                <SelectContent>
                  {(categories.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name} <span className="text-muted-foreground">({c.ingredient_count})</span></SelectItem>)}
                </SelectContent>
              </Select>
            ) : null}
            {scopeType === "items" ? (
              <Combobox
                options={catalogOptions.filter((o) => !scopeItems.includes(o.value))}
                value={null}
                onChange={(id) => { if (id && !scopeItems.includes(id)) setScopeItems((prev) => [...prev, id]); }}
                placeholder={t("inventory.stocktakes.addItem", "Add an item…")}
              />
            ) : null}
            {scopeType === "items" && scopeItems.length > 0 ? (
              <ul className="space-y-1">
                {scopeItems.map((id) => {
                  const name = catalogOptions.find((o) => o.value === id)?.label ?? id;
                  return (
                    <li key={id} className="flex items-center justify-between rounded border px-2 py-1 text-sm">
                      <span>{name}</span>
                      <Button variant="ghost" size="icon-sm" aria-label={t("common.remove", "Remove")} onClick={() => setScopeItems((prev) => prev.filter((x) => x !== id))}><X className="size-3.5" /></Button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScopeDialogOpen(false)}>{t("common.cancel", "Cancel")}</Button>
            <Button
              loading={starting}
              disabled={(scopeType === "category" && !scopeCategory) || (scopeType === "items" && scopeItems.length === 0)}
              onClick={() => void start()}
            >
              {t("inventory.stocktakes.startCount", "Start count")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
