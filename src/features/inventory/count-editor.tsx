import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfirm } from "@/components/app/confirm-dialog";
import type { ItemCountInput } from "@/data/api/generated/models";
import { cancelStocktake, finalizeStocktake, upsertItems, useGetStocktake } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { fmtMoney, fmtNumber, fmtTime, fmtUnit } from "@/lib/format";
import { cn } from "@/lib/utils";
import { VARIANCE_REASONS, invalidateInventory, isVarianceFlagged } from "./lib";

interface Props {
  stocktakeId: string;
  onFinalized: (id: string) => void;
  onCancelled: () => void;
}

/** Active stock-count editor: enter counts, live variance flagging + reason gate. */
export function CountEditor({ stocktakeId, onFinalized, onCancelled }: Props) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const stocktake = useGetStocktake(stocktakeId, { query: { enabled: !!stocktakeId } });
  const data = stocktake.data;
  const threshold = data?.variance_threshold_pct ?? 10;

  const [counts, setCounts] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [onlyCounted, setOnlyCounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const hydrated = useRef(false);
  const savingRef = useRef(false);

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

  const buildPayload = useCallback((): ItemCountInput[] => {
    if (!data) return [];
    return data.items
      .map((it) => {
        const raw = counts[it.org_ingredient_id];
        if (raw == null || raw.trim() === "") return null;
        const qty = parseFloat(raw);
        if (!Number.isFinite(qty)) return null;
        return {
          org_ingredient_id: it.org_ingredient_id,
          counted_qty: qty,
          variance_reason: reasons[it.org_ingredient_id] || null,
        } as ItemCountInput;
      })
      .filter((x): x is ItemCountInput => x !== null);
  }, [data, counts, reasons]);

  const save = useCallback(async (): Promise<boolean> => {
    if (savingRef.current) return true;
    const items = buildPayload();
    if (items.length === 0) return true;
    savingRef.current = true;
    setSaving(true);
    try {
      await upsertItems(stocktakeId, { items });
      return true;
    } catch (e) {
      toast.error(getErrorMessage(e));
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [buildPayload, stocktakeId]);

  // Debounced autosave whenever the manager edits counts / reasons.
  useEffect(() => {
    if (!hydrated.current) return;
    const tmr = setTimeout(() => void save(), 1200);
    return () => clearTimeout(tmr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts, reasons]);

  const rows = useMemo(() => {
    let items = data?.items ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((it) => it.ingredient_name.toLowerCase().includes(q));
    }
    if (onlyCounted) items = items.filter((it) => (counts[it.org_ingredient_id] ?? "").trim() !== "");
    return items;
  }, [data, search, onlyCounted, counts]);

  const stats = useMemo(() => {
    let net = 0;
    let countedCount = 0;
    for (const it of data?.items ?? []) {
      const raw = counts[it.org_ingredient_id];
      if (raw == null || raw.trim() === "") continue;
      const counted = parseFloat(raw);
      if (!Number.isFinite(counted)) continue;
      countedCount++;
      if (it.unit_cost != null) net += (counted - it.expected_qty) * it.unit_cost;
    }
    return { net, countedCount, total: data?.items.length ?? 0 };
  }, [data, counts]);

  const missingReasons = useMemo(() => {
    if (!data) return [] as string[];
    return data.items
      .filter((it) => {
        const raw = counts[it.org_ingredient_id];
        if (raw == null || raw.trim() === "") return false;
        const counted = parseFloat(raw);
        if (!Number.isFinite(counted)) return false;
        return isVarianceFlagged(it.expected_qty, counted, threshold) && !reasons[it.org_ingredient_id];
      })
      .map((it) => it.ingredient_name);
  }, [data, counts, reasons, threshold]);

  const finalize = async () => {
    if (missingReasons.length > 0) {
      toast.error(t("inventory.stocktakes.finalizeBlocked", "Add a reason to every flagged item before finalizing"));
      return;
    }
    setFinalizing(true);
    try {
      const ok = await save();
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

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{t("inventory.stocktakes.title", "Stocktakes")}</span>
            <Badge variant="secondary" className="bg-info/10 text-info">{t("inventory.stocktakes.inProgress", "In progress")}</Badge>
            {data ? <span className="text-sm text-muted-foreground tabular">{fmtTime(data.started_at)}</span> : null}
            {saving ? <span className="text-xs text-muted-foreground">{t("common.saving", "Saving…")}</span> : null}
          </div>
          <span className="text-sm text-muted-foreground">
            {t("inventory.stocktakes.progress", { done: stats.countedCount, total: stats.total, defaultValue: `${stats.countedCount}/${stats.total} done` })}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("common.search", "Search")} className="h-9 ps-8" />
          </div>
          <Button variant={onlyCounted ? "default" : "outline"} size="sm" onClick={() => setOnlyCounted((v) => !v)}>
            {t("inventory.stocktakes.showOnlyCounted", "Show only counted")}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("inventory.stocktakes.ingredient", "Ingredient")}</TableHead>
                <TableHead className="text-end">{t("inventory.stocktakes.expected", "Expected")}</TableHead>
                <TableHead className="text-end">{t("inventory.stocktakes.counted", "Counted")}</TableHead>
                <TableHead className="text-end">{t("inventory.stocktakes.difference", "Difference")}</TableHead>
                <TableHead className="text-end">{t("inventory.stocktakes.value", "Value")}</TableHead>
                <TableHead>{t("inventory.stocktakes.reason", "Reason")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((it) => {
                const id = it.org_ingredient_id;
                const raw = counts[id] ?? "";
                const counted = raw.trim() === "" ? null : parseFloat(raw);
                const hasCount = counted != null && Number.isFinite(counted);
                const diff = hasCount ? counted - it.expected_qty : null;
                const value = hasCount && it.unit_cost != null ? diff! * it.unit_cost : null;
                const flagged = hasCount && isVarianceFlagged(it.expected_qty, counted, threshold);
                const needsReason = flagged && !reasons[id];
                return (
                  <TableRow key={id} className={cn(flagged && "bg-warning/5")}>
                    <TableCell className="flex items-center gap-2">
                      {it.ingredient_name}
                      {flagged ? <AlertTriangle className="size-3.5 text-warning" /> : null}
                    </TableCell>
                    <TableCell className="text-end tabular">{fmtNumber(it.expected_qty)} {fmtUnit(it.unit)}</TableCell>
                    <TableCell className="text-end">
                      <Input
                        type="number" step="0.0001" min="0"
                        value={raw}
                        onChange={(e) => setCounts((prev) => ({ ...prev, [id]: e.target.value }))}
                        className="ms-auto h-8 w-24 tabular"
                      />
                    </TableCell>
                    <TableCell className={cn("text-end tabular", diff != null && diff < 0 ? "text-destructive" : diff != null && diff > 0 ? "text-success" : "text-muted-foreground")}>
                      {hasCount ? `${diff! > 0 ? "+" : ""}${fmtNumber(diff!)}` : t("inventory.stocktakes.notCounted", "not counted")}
                    </TableCell>
                    <TableCell className="text-end tabular">{value != null ? fmtMoney(value) : "—"}</TableCell>
                    <TableCell>
                      {flagged ? (
                        <Select value={reasons[id] ?? ""} onValueChange={(v) => setReasons((prev) => ({ ...prev, [id]: v }))}>
                          <SelectTrigger className={cn("h-8 w-40", needsReason && "border-destructive")}>
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
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{t("inventory.stocktakes.netDifference", "Net difference")}</span>
          <span className={cn("tabular font-semibold", stats.net < 0 ? "text-destructive" : stats.net > 0 ? "text-success" : "")}>{fmtMoney(stats.net)}</span>
        </div>
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          {t("inventory.stocktakes.salesWarning", "Sales keep deducting while you count — finalizing sets stock to your counts.")}
        </p>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => void cancel()}>{t("inventory.stocktakes.cancel", "Cancel stocktake")}</Button>
          <Button loading={finalizing} disabled={missingReasons.length > 0} onClick={() => void finalize()}>
            {t("inventory.stocktakes.reviewFinalize", "Review & finalize")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
