import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Minus, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import type { StudioAggregate } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { fmtMoney, fmtNumber, fmtPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMenuItemPreview, type PreviewResponse, type ServiceMode } from "../../recipe/modeling-api";
import {
  EMPTY_SELECTION,
  pickedIn,
  toPreviewBody,
  toPreviewGroups,
  toggleOptional,
  togglePick,
  type PreviewSelection,
} from "./preview-model";

const DEBOUNCE_MS = 300;

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

const plain = (p: number) => fmtMoney(p, { currency: false, fractionDigits: 0 });

/** "150 + 55 + 30 = 235" (× quantity when > 1). */
export function priceLine(price: PreviewResponse["price"], quantity: number): string {
  const parts = [price.base, ...price.options.filter((o) => o.price_delta !== 0).map((o) => o.price_delta)].map(plain);
  const sum = parts.join(" + ");
  const lhs = quantity > 1 ? `(${sum}) × ${quantity}` : sum;
  return `${lhs} = ${plain(price.total)}`;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

function Row({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start">
      <span className="w-28 shrink-0 pt-1 text-xs font-medium text-muted-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

/**
 * "What the POS shows and deducts": a read-only dry run of the server resolver
 * (`POST /menu-items/{id}/preview`) over the SAVED item. Every Studio save
 * invalidates `/menu-items…` keys, so the preview re-runs after recipe/size/group saves.
 */
export function PreviewPanel({ studio }: { studio: StudioAggregate }) {
  const { t } = useTranslation();
  const [sel, setSel] = useState<PreviewSelection>(EMPTY_SELECTION);
  const [defaults, setDefaults] = useState<Record<string, string>>({});

  const groups = useMemo(() => toPreviewGroups(studio), [studio]);
  const sizes = useMemo(
    () => [...studio.sizes].filter((s) => s.is_active).sort((a, b) => a.sort - b.sort),
    [studio.sizes],
  );
  const optionals = useMemo(() => studio.options.filter((o) => o.is_active), [studio.options]);

  const body = useMemo(() => toPreviewBody(sel, groups, defaults), [sel, groups, defaults]);
  const debounced = useDebounced(body, DEBOUNCE_MS);
  const q = useMenuItemPreview(studio.id, debounced);
  const data = q.data;

  useEffect(() => {
    if (!data) return;
    setDefaults((prev) => (JSON.stringify(prev) === JSON.stringify(data.defaults) ? prev : data.defaults));
  }, [data]);

  const service = (mode: ServiceMode) => setSel((s) => ({ ...s, service: mode }));

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div className="space-y-2.5">
        {sizes.length > 0 ? (
          <Row label={t("modeling.preview.size", "Size")}>
            {sizes.map((s) => (
              <Chip
                key={s.id}
                active={(sel.size ?? data?.size_label) === s.label}
                onClick={() => setSel((x) => ({ ...x, size: s.label }))}
              >
                {s.label}
              </Chip>
            ))}
          </Row>
        ) : null}
        {groups.map((g) => {
          const picked = pickedIn(sel, g.id, defaults);
          return (
            <Row key={g.id} label={g.name} required={g.required}>
              {g.options.map((o) => (
                <Chip key={o.id} active={picked.includes(o.id)} onClick={() => setSel((x) => togglePick(x, g, o.id, defaults))}>
                  {o.name}
                  {o.price ? ` +${plain(o.price)}` : ""}
                  {defaults[g.id] === o.id ? (
                    <span className="ms-1 text-xs opacity-70">{t("modeling.preview.default", "(default)")}</span>
                  ) : null}
                </Chip>
              ))}
            </Row>
          );
        })}
        {optionals.length > 0 ? (
          <Row label={t("modeling.preview.itemOptions", "Item options")}>
            {optionals.map((o) => (
              <Chip key={o.id} active={sel.optionals.includes(o.id)} onClick={() => setSel((x) => toggleOptional(x, o.id))}>
                {o.name}
                {o.price ? ` +${plain(o.price)}` : ""}
              </Chip>
            ))}
          </Row>
        ) : null}
        <Row label={t("modeling.preview.service", "Service")}>
          <Chip active={sel.service === "takeaway"} onClick={() => service("takeaway")}>
            {t("modeling.preview.takeaway", "Takeaway")}
          </Chip>
          <Chip active={sel.service === "dine_in"} onClick={() => service("dine_in")}>
            {t("modeling.preview.dineIn", "Dine-in")}
          </Chip>
        </Row>
        <Row label={t("modeling.preview.quantity", "Quantity")}>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7"
              aria-label={t("modeling.preview.decrease", "Decrease")}
              disabled={sel.quantity <= 1}
              onClick={() => setSel((x) => ({ ...x, quantity: Math.max(1, x.quantity - 1) }))}
            >
              <Minus className="size-3.5" />
            </Button>
            <span className="w-6 text-center text-sm tabular-nums">{sel.quantity}</span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7"
              aria-label={t("modeling.preview.increase", "Increase")}
              onClick={() => setSel((x) => ({ ...x, quantity: x.quantity + 1 }))}
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
        </Row>
      </div>

      <div className="space-y-3 border-t pt-4 text-sm">
        {q.isError && !data ? (
          <p role="alert" className="text-destructive">
            {t("modeling.preview.error", "Couldn't run the preview: {{error}}", { error: getErrorMessage(q.error) })}
          </p>
        ) : !data ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-xs font-medium text-muted-foreground">{t("modeling.preview.price", "Price")}</span>
              <span className="font-medium tabular-nums" data-testid="preview-price-line">
                {priceLine(data.price, data.quantity)}
              </span>
              {q.isFetching ? <Spinner className="size-3.5" /> : null}
            </div>
            <div className="flex flex-col gap-1.5 sm:flex-row">
              <span className="w-28 shrink-0 text-xs font-medium text-muted-foreground">{t("modeling.preview.deducts", "Deducts")}</span>
              {data.deductions.length === 0 ? (
                <span className="text-muted-foreground">{t("modeling.preview.noDeductions", "Nothing is deducted")}</span>
              ) : (
                <ul className="flex-1 space-y-1">
                  {data.deductions.map((d, i) => (
                    <li
                      key={`${d.ingredient_id ?? d.name}-${i}`}
                      data-skipped={d.skipped || undefined}
                      className={cn("flex flex-wrap items-baseline gap-x-2", d.skipped && "text-muted-foreground")}
                    >
                      <span className={cn(d.skipped && "line-through")}>
                        {d.name} · {fmtNumber(d.quantity)} {t(`units.${d.unit}`, d.unit)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t(`modeling.preview.source.${d.source}`, d.source)}
                        {d.note ? ` · ${d.note}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-xs font-medium text-muted-foreground">{t("modeling.preview.cost", "Cost")}</span>
              <span className="tabular-nums">
                {fmtMoney(data.cost.total)}
                {data.cost.cost_missing ? ` (${t("modeling.preview.costPartial", "partial, some costs missing")})` : ""}
                {data.cost.margin_pct != null
                  ? ` · ${t("modeling.preview.margin", "margin {{pct}}", { pct: fmtPercent(data.cost.margin_pct) })}`
                  : ""}
              </span>
            </div>
            {data.warnings.length > 0 ? (
              <ul className="space-y-1.5">
                {data.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    <Badge variant="outline" className="font-mono">{w.rule}</Badge>
                    <span>{w.message}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">{t("modeling.preview.noIssues", "No issues found")}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
