import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ChevronDown, ChevronUp, X } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

import { exportOrders, useGetBranch } from "@/data/api/generated/api";
import type { ExportOrdersParams } from "@/data/api/generated/models";
import { useAppStore } from "@/data/stores/app.store";
import { getErrorMessage } from "@/data/api/errors";
import { exportToExcel } from "@/lib/excel";
import { cn } from "@/lib/utils";

import { PRESETS } from "./export/presets";
import { buildSheets } from "./export/build-sheets";
import { buildMeta } from "./export/build-meta";
import { buildFilename } from "./export/build-filename";
import type { Grain, PresetId } from "./export/types";

const ALL_GRAINS: Grain[] = ["order", "line_item", "payment", "deduction"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ExportOrdersParams;
  totalApprox?: number;
}

export function OrderExportDialog({ open, onOpenChange, filters, totalApprox = 0 }: Props) {
  const { t, i18n } = useTranslation();
  const side = i18n.dir() === "rtl" ? "left" : "right";
  const orgLogo = useAppStore((s) => s.selectedOrgLogo);

  const { data: branch } = useGetBranch(filters.branch_id ?? "", {
    query: { enabled: open && !!filters.branch_id },
  });
  const branchName = branch?.name ?? "";

  const [preset, setPreset] = useState<PresetId>("accountant_daily");
  const [grains, setGrains] = useState<Grain[]>(["order"]);
  const [customFilename, setCustomFilename] = useState("");
  const [busy, setBusy] = useState(false);
  const [customizeExpanded, setCustomizeExpanded] = useState(false);

  useEffect(() => {
    if (open) {
      setPreset("accountant_daily");
      setGrains(["order"]);
      setCustomFilename("");
      setBusy(false);
      setCustomizeExpanded(false);
    }
  }, [open]);

  const activePreset = useMemo(() => PRESETS.find((p) => p.id === preset)!, [preset]);
  const mergedFilters = useMemo<ExportOrdersParams>(
    () => ({ ...filters, ...activePreset.filterOverrides }),
    [filters, activePreset],
  );

  const branchSlug = branchName
    ? branchName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    : "branch";
  const defaultFilename = buildFilename({
    presetId: preset,
    branchSlug,
    from: mergedFilters.from ?? null,
    to: mergedFilters.to ?? null,
  });

  const handlePreset = (id: PresetId) => {
    setPreset(id);
    const spec = PRESETS.find((p) => p.id === id);
    if (spec) setGrains(spec.grains);
  };

  const toggleGrain = (g: Grain) =>
    setGrains((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const handleExport = async () => {
    if (!filters.branch_id) {
      toast.error(t("ordersExport.selectBranchError", "Please select a branch first"));
      return;
    }
    if (grains.length === 0) {
      toast.error(t("ordersExport.noGrainsSelected", "Select at least one sheet to export"));
      return;
    }
    setBusy(true);
    try {
      const res = await exportOrders(mergedFilters);
      if (!res.data || res.data.length === 0) {
        toast.error(t("ordersExport.noOrders", "No orders to export"));
        return;
      }
      const sheets = buildSheets(res.data, grains, t, i18n.language);
      const meta = buildMeta({
        branchName,
        from: mergedFilters.from ?? null,
        to: mergedFilters.to ?? null,
        payment: mergedFilters.payment_method ?? null,
        status: mergedFilters.status ?? null,
        t,
      });
      await exportToExcel({
        filename: customFilename || defaultFilename,
        sheets,
        meta,
        logoUrl: orgLogo || undefined,
      });
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <SheetContent side={side} showCloseButton={false} className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="flex-row items-center justify-between gap-2 border-b">
          <div className="min-w-0">
            <SheetTitle>{t("ordersExport.title", "Export orders")}</SheetTitle>
            <SheetDescription>{t("ordersExport.subtitle", "Pick a preset and download a styled Excel report")}</SheetDescription>
          </div>
          <SheetClose asChild>
            <Button variant="ghost" size="icon-sm" disabled={busy} aria-label={t("common.close", "Close")}>
              <X className="size-4" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
          {/* Presets */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("ordersExport.presets.title", "Export presets")}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PRESETS.map((p) => {
                const Icon = p.icon;
                const selected = preset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePreset(p.id)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 text-start transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      selected ? "border-primary bg-primary/5 ring-1 ring-ring" : "hover:bg-accent/50",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-lg",
                        selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 space-y-0.5">
                      <span className="block text-sm font-semibold">{t(p.i18nKey, p.id)}</span>
                      <span className="block text-xs leading-normal text-muted-foreground">{t(p.description, "")}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Customize sheets */}
          <section className="space-y-3">
            <button
              type="button"
              onClick={() => setCustomizeExpanded((v) => !v)}
              className="flex items-center gap-1.5 rounded text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              {t("ordersExport.customizeBtn", "Customize export sheets")}
              {customizeExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
            {customizeExpanded ? (
              <Card className="border-dashed bg-muted/20 py-0">
                <CardContent className="space-y-3 p-4">
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {ALL_GRAINS.map((g) => (
                      <label
                        key={g}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border bg-background p-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
                          preset === "custom" ? "cursor-pointer hover:bg-accent/50" : "opacity-70",
                        )}
                      >
                        <Checkbox
                          checked={grains.includes(g)}
                          onCheckedChange={() => toggleGrain(g)}
                          disabled={preset !== "custom"}
                        />
                        <span className="text-sm font-medium">{t(`ordersExport.grains.${g}`, g)}</span>
                      </label>
                    ))}
                  </div>
                  {preset !== "custom" ? (
                    <p className="flex items-center gap-1 text-xs text-warning">
                      <AlertTriangle className="size-3" />
                      {t("ordersExport.lockedGrainsHint", "Select the 'Custom' preset to toggle sheets.")}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </section>

          {/* Filters summary */}
          <Card className="border-0 bg-muted/30 py-0">
            <CardContent className="space-y-3 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("ordersExport.filtersSummary", "Applied filters")}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <SummaryItem label={t("orders.branch", "Branch")} value={branchName || "—"} />
                <SummaryItem
                  label={t("common.date", "Date")}
                  value={
                    mergedFilters.from && mergedFilters.to
                      ? `${mergedFilters.from.slice(0, 10)} → ${mergedFilters.to.slice(0, 10)}`
                      : t("orders.allTime", "All time")
                  }
                />
                <SummaryItem
                  label={t("orders.payment", "Payment")}
                  value={
                    mergedFilters.payment_method
                      ? t(`payments.${mergedFilters.payment_method}`, mergedFilters.payment_method)
                      : t("orders.allPayments", "All payments")
                  }
                />
                <SummaryItem
                  label={t("common.status", "Status")}
                  value={
                    mergedFilters.status
                      ? t(`orderStatus.${mergedFilters.status}`, mergedFilters.status)
                      : t("orders.allStatuses", "All statuses")
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Filename */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">{t("ordersExport.filename", "File name")}</Label>
            <Input
              placeholder={defaultFilename}
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">{t("ordersExport.filenameHint", "Leave blank to use the default name.")}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <p className="text-xs text-muted-foreground">{t("ordersExport.rowEstimate", { count: totalApprox, defaultValue: `~${totalApprox} rows` })}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button onClick={handleExport} loading={busy} disabled={grains.length === 0 || !filters.branch_id}>
              {t("ordersExport.exportButton", "Export Excel")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
