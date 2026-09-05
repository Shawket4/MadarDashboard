import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ClipboardList, Plus, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/app/combobox";
import { EmptyState } from "@/components/app/empty-state";
import { SegmentedControl } from "@/components/app/segmented-control";
import { useConfirm } from "@/components/app/confirm-dialog";
import type { OrgIngredient, StocktakeItem } from "@/data/api/generated/models";
import { cancelStocktake, finalizeStocktake, upsertItems, useGetStocktake, useListCatalog } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { useOrgId } from "@/hooks/use-org-id";
import { fmtMoney, fmtNumber, fmtTime, fmtUnit } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  VARIANCE_REASONS, buildCountPayload, invalidateInventory, isVarianceFlagged, missingReasons, parseCount,
} from "./lib";

interface Props {
  stocktakeId: string;
  onFinalized: (id: string) => void;
  onCancelled: () => void;
}

type Filter = "all" | "uncounted" | "counted" | "flagged";

/** A row the manager can count: a snapshot item, or a found item added locally. */
type Row = Pick<
  StocktakeItem,
  "org_ingredient_id" | "ingredient_name" | "unit" | "category_id" | "category_name" | "opening_qty" | "book_qty" | "unit_cost" | "is_new"
>;

/**
 * The count editor: every catalog ingredient in scope, counted against live
 * book stock. Autosave is queued so a keystroke can never race a save, and
 * finalize flushes the queue first, so the server always judges the numbers
 * on screen.
 */
export function CountEditor({ stocktakeId, onFinalized, onCancelled }: Props) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const orgId = useOrgId();
  // Book stock keeps moving while the count is open (sales, deliveries), so
  // the baseline is refreshed periodically — the same figure finalize will use.
  const stocktake = useGetStocktake(stocktakeId, { query: { enabled: !!stocktakeId, refetchInterval: 30_000 } });
  const data = stocktake.data;
  const threshold = data?.variance_threshold_pct ?? 10;
  const scopeKind = (data?.scope as { kind?: string } | undefined)?.kind ?? "full";
  const catalog = useListCatalog(orgId ?? "", { query: { enabled: !!orgId && scopeKind !== "full" } });

  const [counts, setCounts] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [extras, setExtras] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [filter, setFilter] = useState<Filter>("all");
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const hydrated = useRef(false);
  const inFlight = useRef<Promise<boolean> | null>(null);
  const dirty = useRef(false);
  const latest = useRef({ counts, reasons, rowIds: [] as string[] });

  useEffect(() => {
    if (data && !hydrated.current) {
      const c: Record<string, string> = {};
      const r: Record<string, string> = {};
      for (const it of data.items) {
        if (it.counted_qty != null) c[it.org_ingredient_id] = String(it.counted_qty);
        if (it.variance_reason) r[it.org_ingredient_id] = it.variance_reason;
      }
      setCounts(c);
      setReasons(r);
      hydrated.current = true;
    }
  }, [data]);

  // Snapshot rows plus any found items not yet persisted by a save.
  const rows: Row[] = useMemo(() => {
    const items = data?.items ?? [];
    const known = new Set(items.map((i) => i.org_ingredient_id));
    return [...items, ...extras.filter((e) => !known.has(e.org_ingredient_id))];
  }, [data, extras]);

  useEffect(() => {
    latest.current = { counts, reasons, rowIds: rows.map((r) => r.org_ingredient_id) };
  }, [counts, reasons, rows]);

  /** Send the latest local state. Serialised: a save in flight is awaited first. */
  const flush = useCallback(async (): Promise<boolean> => {
    if (inFlight.current) {
      await inFlight.current;
    }
    if (!dirty.current) return true;
    dirty.current = false;
    const { counts: c, reasons: r, rowIds } = latest.current;
    const items = buildCountPayload(rowIds, c, r);
    if (items.length === 0) return true;
    setSaving(true);
    const p = upsertItems(stocktakeId, { items })
      .then(() => true)
      .catch((e: unknown) => {
        dirty.current = true;
        toast.error(getErrorMessage(e));
        return false;
      })
      .finally(() => {
        setSaving(false);
        inFlight.current = null;
      });
    inFlight.current = p;
    return p;
  }, [stocktakeId]);

  // Debounced autosave whenever the manager edits counts / reasons.
  useEffect(() => {
    if (!hydrated.current) return;
    dirty.current = true;
    const tmr = setTimeout(() => void flush(), 1200);
    return () => clearTimeout(tmr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts, reasons]);

  const categories = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rows) m.set(r.category_id, r.category_name);
    return Array.from(m.entries());
  }, [rows]);

  const visible = useMemo(() => {
    let list = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((it) => it.ingredient_name.toLowerCase().includes(q));
    }
    if (category !== "all") list = list.filter((it) => it.category_id === category);
    if (filter !== "all") {
      list = list.filter((it) => {
        const counted = parseCount(counts[it.org_ingredient_id]);
        if (filter === "counted") return counted != null;
        if (filter === "uncounted") return counted == null;
        return counted != null && isVarianceFlagged(it.book_qty, counted, threshold);
      });
    }
    return list;
  }, [rows, search, category, filter, counts, threshold]);

  const stats = useMemo(() => {
    let net = 0;
    let countedCount = 0;
    for (const it of rows) {
      const counted = parseCount(counts[it.org_ingredient_id]);
      if (counted == null) continue;
      countedCount++;
      if (it.unit_cost != null) net += (counted - it.book_qty) * it.unit_cost;
    }
    return { net, countedCount, total: rows.length };
  }, [rows, counts]);

  const missing = useMemo(() => missingReasons(rows, counts, reasons, threshold), [rows, counts, reasons, threshold]);

  const addableOptions = useMemo(() => {
    const present = new Set(rows.map((r) => r.org_ingredient_id));
    return (catalog.data ?? [])
      .filter((c: OrgIngredient) => !present.has(c.id))
      .map((c: OrgIngredient) => ({ value: c.id, label: c.name, hint: c.category_name }));
  }, [catalog.data, rows]);

  const addFoundItem = (id: string) => {
    const ing = (catalog.data ?? []).find((c) => c.id === id);
    if (!ing) return;
    setExtras((prev) => [
      ...prev,
      {
        org_ingredient_id: ing.id,
        ingredient_name: ing.name,
        unit: ing.unit,
        category_id: ing.category_id,
        category_name: ing.category_name,
        opening_qty: 0,
        book_qty: 0,
        unit_cost: ing.cost_per_unit ?? null,
        is_new: true,
      },
    ]);
  };

  const finalize = async () => {
    if (missing.length > 0) {
      toast.error(t("inventory.stocktakes.finalizeBlocked", "Add a reason to every flagged item before finalizing"));
      return;
    }
    setFinalizing(true);
    try {
      dirty.current = true;
      const ok = await flush();
      if (!ok) return;
      await finalizeStocktake(stocktakeId);
      await invalidateInventory();
      onFinalized(stocktakeId);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setFinalizing(false);
    }
  };

  const cancel = async () => {
    if (await confirm({
      title: t("inventory.stocktakes.cancel", "Cancel stocktake"),
      description: t("inventory.stocktakes.cancelConfirm", "Cancel this open stocktake?"),
      destructive: true,
      confirmLabel: t("inventory.stocktakes.cancel", "Cancel stocktake"),
    })) {
      try {
        await cancelStocktake(stocktakeId);
        await invalidateInventory();
        onCancelled();
      } catch (e) {
        toast.error(getErrorMessage(e));
      }
    }
  };

  const newCount = rows.filter((r) => r.is_new).length;

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{t("inventory.stocktakes.openCount", "Open count")}</span>
            <Badge variant="secondary" className="bg-info/10 text-info">{t("inventory.stocktakes.inProgress", "In progress")}</Badge>
            {data ? <span className="text-sm text-muted-foreground tabular">{fmtTime(data.started_at)}</span> : null}
            {saving ? <span className="text-xs text-muted-foreground">{t("common.saving", "Saving…")}</span> : null}
          </div>
          <span className="text-sm text-muted-foreground tabular">
            {t("inventory.stocktakes.progress", { done: stats.countedCount, total: stats.total, defaultValue: `${stats.countedCount}/${stats.total} done` })}
          </span>
        </div>
        {newCount > 0 ? (
          <p className="flex items-start gap-1.5 rounded-md border border-info/30 bg-info/5 p-2 text-xs">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-info" />
            {t("inventory.stocktakes.newHereHint", { count: newCount, defaultValue: `${newCount} ingredients have never been counted or moved at this branch. Counting them is what starts tracking them here.` })}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("common.search", "Search")} className="h-9 ps-8" />
          </div>
          {categories.length > 1 ? (
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("inventory.stocktakes.allCategories", "All categories")}</SelectItem>
                {categories.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : null}
          <SegmentedControl<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: t("common.all", "All") },
              { value: "uncounted", label: t("inventory.stocktakes.filterUncounted", "To count") },
              { value: "counted", label: t("inventory.stocktakes.filterCounted", "Counted") },
              { value: "flagged", label: t("inventory.stocktakes.filterFlagged", "Flagged") },
            ]}
          />
          {scopeKind !== "full" ? (
            <div className="w-full sm:w-56">
              <Combobox
                options={addableOptions}
                value={null}
                onChange={addFoundItem}
                placeholder={t("inventory.stocktakes.addItem", "Add an item…")}
              />
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {rows.length === 0 && !stocktake.isLoading ? (
          <EmptyState
            icon={ClipboardList}
            title={t("inventory.stocktakes.nothingToCount", "Nothing to count yet")}
            description={t("inventory.stocktakes.nothingToCountHint", "This organization has no ingredients in its catalog. Add ingredients first, then count them here.")}
            action={<Link to="/inventory/ingredients" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}><Plus className="size-4" />{t("inventory.catalog.newItem", "New ingredient")}</Link>}
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("inventory.stocktakes.ingredient", "Ingredient")}</TableHead>
                  <TableHead className="text-end">{t("inventory.stocktakes.bookStock", "Book stock")}</TableHead>
                  <TableHead className="text-end">{t("inventory.stocktakes.counted", "Counted")}</TableHead>
                  <TableHead className="text-end">{t("inventory.stocktakes.difference", "Difference")}</TableHead>
                  <TableHead className="text-end">{t("inventory.stocktakes.value", "Value")}</TableHead>
                  <TableHead>{t("inventory.stocktakes.reason", "Reason")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((it) => {
                  const id = it.org_ingredient_id;
                  const raw = counts[id] ?? "";
                  const counted = parseCount(raw);
                  const diff = counted != null ? counted - it.book_qty : null;
                  const value = diff != null && it.unit_cost != null ? diff * it.unit_cost : null;
                  const flagged = counted != null && isVarianceFlagged(it.book_qty, counted, threshold);
                  const needsReason = flagged && !reasons[id];
                  const moved = Math.abs(it.book_qty - it.opening_qty) > 1e-9;
                  return (
                    <TableRow key={id} className={cn(flagged && "bg-warning/5")}>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{it.ingredient_name}</span>
                          {it.is_new ? <Badge variant="secondary" className="bg-info/10 text-info">{t("inventory.stocktakes.newHere", "New here")}</Badge> : null}
                          {flagged ? <AlertTriangle className="size-3.5 text-warning" /> : null}
                        </div>
                        <p className="text-xs text-muted-foreground">{it.category_name}</p>
                      </TableCell>
                      <TableCell className="text-end tabular">
                        {fmtNumber(it.book_qty)} {fmtUnit(it.unit)}
                        {moved ? (
                          <p className="text-xs text-muted-foreground">
                            {t("inventory.stocktakes.atStart", { qty: fmtNumber(it.opening_qty), defaultValue: `was ${fmtNumber(it.opening_qty)} at start` })}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-end">
                        <Input
                          type="number" inputMode="decimal" step="0.001" min="0"
                          value={raw}
                          aria-label={`${t("inventory.stocktakes.counted", "Counted")} ${it.ingredient_name}`}
                          onChange={(e) => setCounts((prev) => ({ ...prev, [id]: e.target.value }))}
                          className="ms-auto h-10 w-28 text-base tabular"
                        />
                      </TableCell>
                      <TableCell className={cn("text-end tabular", diff != null && diff < 0 ? "text-destructive" : diff != null && diff > 0 ? "text-success" : "text-muted-foreground")}>
                        {diff != null ? `${diff > 0 ? "+" : ""}${fmtNumber(diff)}` : t("inventory.stocktakes.notCounted", "not counted")}
                      </TableCell>
                      <TableCell className="text-end tabular">{value != null ? fmtMoney(value) : "—"}</TableCell>
                      <TableCell>
                        {flagged ? (
                          <Select value={reasons[id] ?? ""} onValueChange={(v) => setReasons((prev) => ({ ...prev, [id]: v }))}>
                            <SelectTrigger className={cn("h-10 w-44", needsReason && "border-destructive")}>
                              <SelectValue placeholder={t("inventory.stocktakes.reason", "Reason")} />
                            </SelectTrigger>
                            <SelectContent>
                              {VARIANCE_REASONS.map((r) => <SelectItem key={r} value={r}>{t(`inventory.varianceReasons.${r}`, r)}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {visible.length === 0 && rows.length > 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-6 text-center text-muted-foreground">{t("common.noResults", "No results found")}</TableCell></TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          {t("inventory.stocktakes.salesWarning", "Book stock keeps moving while you count. Finalizing compares your counts with book stock at that moment, so sales during the count are not treated as shrinkage.")}
        </p>

        <div className="sticky bottom-0 -mx-6 -mb-6 flex flex-wrap items-center justify-between gap-3 border-t bg-card px-6 py-3">
          <div className="text-sm">
            <span className="font-medium">{t("inventory.stocktakes.netDifference", "Net difference")}</span>{" "}
            <span className={cn("tabular font-semibold", stats.net < 0 ? "text-destructive" : stats.net > 0 ? "text-success" : "")}>{fmtMoney(stats.net)}</span>
            {missing.length > 0 ? (
              <span className="ms-3 text-warning">{t("inventory.stocktakes.needReason", { count: missing.length, defaultValue: `${missing.length} need a reason` })}</span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void cancel()}>{t("inventory.stocktakes.cancel", "Cancel stocktake")}</Button>
            <Button loading={finalizing} disabled={missing.length > 0 || rows.length === 0} onClick={() => void finalize()}>
              {t("inventory.stocktakes.reviewFinalize", "Review & finalize")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
