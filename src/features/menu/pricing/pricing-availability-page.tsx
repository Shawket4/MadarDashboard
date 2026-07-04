import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CornerDownRight,
  CupSoda,
  Eye,
  EyeOff,
  Search,
  Store,
  Tag,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Page } from "@/components/app/page";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  deletePriceOverride,
  putPriceOverride,
  useGetStudio,
  useListAddonCatalog,
  useListBranchAddonOverrides,
  useListBranches,
  useListChannelAddonOverrides,
  useListMenuCatalog,
} from "@/data/api/generated/api";
import type {
  AddonItem,
  BranchAddonOverride,
  ChannelAddonOverride,
  MenuItemWithCosts,
  PriceOverrideRequest,
  SizeOut,
  SizeOverrideOut,
} from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, fmtMoney, piastresToEgp } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";
import { cn } from "@/lib/utils";
import { useDebounced } from "@/lib/use-debounced";
import { useOrgId } from "@/hooks/use-org-id";
import { useScope } from "@/data/scope/use-scope";
import { invalidatePricingOverrides } from "./util";

// ── Scope columns ─────────────────────────────────────────────────────────────

const PER_PAGE = 24;

/** The four delivery channels expressible as `branch_channel` overrides. */
type Channel = "in_mall" | "outside" | "umbrella" | "pickup";
const CHANNELS: Channel[] = ["in_mall", "outside", "umbrella", "pickup"];

/**
 * The editable scope columns, left→right. `catalog` is a read-only reference
 * column. `in_store` is the `branch` scope (channel null); the four channels are
 * `branch_channel`. This screen only ever writes `branch` + `branch_channel`, so
 * the org-wide `channel` scope from CONTRACT §3 is treated as absent throughout.
 */
type ScopeCol =
  | { kind: "catalog" }
  | { kind: "in_store" }
  | { kind: "channel"; channel: Channel };

const EDITABLE_COLS: ScopeCol[] = [
  { kind: "in_store" },
  ...CHANNELS.map((channel) => ({ kind: "channel" as const, channel })),
];
const ALL_COLS: ScopeCol[] = [{ kind: "catalog" }, ...EDITABLE_COLS];

/** i18n key + fixed English fallback for a column header. */
function colLabel(col: ScopeCol): { key: string; fallback: string } {
  switch (col.kind) {
    case "catalog":
      return { key: "menu.pricing.col_catalog", fallback: "Catalog" };
    case "in_store":
      return { key: "menu.pricing.col_in_store", fallback: "In-store" };
    case "channel":
      switch (col.channel) {
        case "in_mall":
          return { key: "menu.pricing.col_in_mall", fallback: "In-mall" };
        case "outside":
          return { key: "menu.pricing.col_outside", fallback: "Outside" };
        case "umbrella":
          return { key: "menu.pricing.col_umbrella", fallback: "Umbrella" };
        case "pickup":
          return { key: "menu.pricing.col_pickup", fallback: "Pickup" };
      }
  }
}

/** Stable string id for an editable column (used in dirty-cell keys). */
function colId(col: ScopeCol): string {
  return col.kind === "channel" ? `channel:${col.channel}` : col.kind;
}

// ── Resolution model ──────────────────────────────────────────────────────────

/** A raw override at one scope: what the server currently stores for a target. */
interface RawOverride {
  price: number | null;
  is_available: boolean | null;
}

const EMPTY_RAW: RawOverride = { price: null, is_available: null };

/** The resolved state of one editable cell (one target × one editable scope),
 * per the locked CONTRACT §3 precedence (channel-scope treated as absent). */
interface ResolvedCell {
  /** Effective price in piastres — always resolves (never null). */
  effectivePrice: number;
  /** True when THIS scope sets a price explicitly. */
  priceExplicit: boolean;
  /** Where the price is inherited from when not explicit here. */
  priceFrom: "branch" | "catalog";
  /** Effective availability — defaults to true. */
  availEffective: boolean;
  /** True when THIS scope sets availability explicitly. */
  availExplicit: boolean;
  /** Whether ANY override row exists at this scope (drives delete-on-clear). */
  hadOverride: boolean;
}

/**
 * Resolve one editable cell for a target.
 *
 * @param col        the editable column (in_store or a channel).
 * @param catalog    the catalog default price (size.price / addon.default_price).
 * @param branch     the `branch`-scope override for this target (or EMPTY_RAW).
 * @param channel    the `branch_channel`-scope override for this target (only
 *                   consulted for channel columns).
 */
function resolveCell(
  col: ScopeCol,
  catalog: number,
  branch: RawOverride,
  channel: RawOverride,
): ResolvedCell {
  if (col.kind === "in_store") {
    return {
      effectivePrice: branch.price ?? catalog,
      priceExplicit: branch.price != null,
      priceFrom: "catalog",
      availEffective: branch.is_available ?? true,
      availExplicit: branch.is_available != null,
      hadOverride: branch.price != null || branch.is_available != null,
    };
  }
  // Channel column: branch_channel → branch → catalog.
  return {
    effectivePrice: channel.price ?? branch.price ?? catalog,
    priceExplicit: channel.price != null,
    priceFrom: branch.price != null ? "branch" : "catalog",
    availEffective: channel.is_available ?? branch.is_available ?? true,
    availExplicit: channel.is_available != null,
    hadOverride: channel.price != null || channel.is_available != null,
  };
}

/** The unfinished edit state a user has typed into a cell (before save). */
interface DraftCell {
  /** EGP string as typed; "" means "inherit" (send price null). */
  price: string;
  /** Availability toggle: true = available (inherit), false = explicitly hidden. */
  available: boolean;
}

/** Build the pristine draft for a cell from its resolved state. A cell's price
 * field shows the EGP value ONLY when explicit here; inherited cells start blank
 * (typing turns them into an explicit override). Availability shows the
 * effective value so toggling off writes an explicit `false`. */
function pristineDraft(r: ResolvedCell): DraftCell {
  return {
    price: r.priceExplicit ? String(piastresToEgp(r.effectivePrice)) : "",
    available: r.availEffective,
  };
}

/** A cell is dirty when its draft diverges from what the server would resolve. */
function isDirty(draft: DraftCell, r: ResolvedCell): boolean {
  const base = pristineDraft(r);
  return draft.price.trim() !== base.price.trim() || draft.available !== base.available;
}

// ── Dirty-state store (whole visible tab) ─────────────────────────────────────

/** A dirty cell's identity + everything Save needs to build the request body. */
interface PendingCell {
  key: string;
  col: ScopeCol;
  targetType: "menu_item_size" | "modifier_option";
  targetId: string;
  draft: DraftCell;
  resolved: ResolvedCell;
  /** Human label for error reporting (item/size or add-on name). */
  label: string;
}

/** Cell key: unique per target × editable scope across the whole tab. */
function cellKey(col: ScopeCol, targetId: string): string {
  return `${targetId}|${colId(col)}`;
}

interface DirtyState {
  drafts: Map<string, DraftCell>;
  /** Get the live draft for a cell, falling back to its pristine value. */
  draftFor: (col: ScopeCol, targetId: string, resolved: ResolvedCell) => DraftCell;
  set: (col: ScopeCol, targetId: string, resolved: ResolvedCell, patch: Partial<DraftCell>) => void;
  /** Drop all dirty cells whose key is NOT in `keys` (used after a partial save
   *  to keep only the cells that failed). */
  keepOnly: (keys: Set<string>) => void;
  reset: () => void;
  count: number;
}

function useDirtyCells(): DirtyState {
  const [drafts, setDrafts] = useState<Map<string, DraftCell>>(new Map());

  const draftFor = useCallback(
    (col: ScopeCol, targetId: string, resolved: ResolvedCell): DraftCell => {
      const existing = drafts.get(cellKey(col, targetId));
      return existing ?? pristineDraft(resolved);
    },
    [drafts],
  );

  const set = useCallback(
    (col: ScopeCol, targetId: string, resolved: ResolvedCell, patch: Partial<DraftCell>) => {
      const key = cellKey(col, targetId);
      setDrafts((prev) => {
        const next = new Map(prev);
        const current = prev.get(key) ?? pristineDraft(resolved);
        const merged = { ...current, ...patch };
        // Drop the entry entirely once it matches the server again — keeps the
        // dirty count honest without a separate reconciliation pass.
        if (!isDirty(merged, resolved)) next.delete(key);
        else next.set(key, merged);
        return next;
      });
    },
    [],
  );

  const keepOnly = useCallback((keys: Set<string>) => {
    setDrafts((prev) => {
      const next = new Map<string, DraftCell>();
      for (const [k, v] of prev) if (keys.has(k)) next.set(k, v);
      return next.size === prev.size ? prev : next;
    });
  }, []);

  const reset = useCallback(() => setDrafts((prev) => (prev.size === 0 ? prev : new Map())), []);

  return { drafts, draftFor, set, keepOnly, reset, count: drafts.size };
}

// ── Save logic ────────────────────────────────────────────────────────────────

/** Turn one pending cell into the write action Save should perform, or `null`
 * for a no-op. Encodes the locked null convention:
 *   price: blank → null, else egpToPiastres.
 *   availability: available → null (inherit), hidden → false.
 *   put when price != null || available === false; else delete iff a prior
 *   override existed at this cell; else nothing. */
function planCell(
  cell: PendingCell,
  branchId: string,
): { op: "put" | "delete"; body: PriceOverrideRequest } | null {
  const { col, draft, resolved, targetType, targetId } = cell;
  const inStore = col.kind === "in_store";
  const base = {
    scope: inStore ? ("branch" as const) : ("branch_channel" as const),
    branch_id: branchId,
    channel: inStore ? null : (col as { channel: Channel }).channel,
    target_type: targetType,
    target_id: targetId,
  };

  const trimmed = draft.price.trim();
  let price: number | null = null;
  if (trimmed !== "") {
    const egp = parseFloat(trimmed);
    if (!Number.isFinite(egp) || egp < 0) return null; // guarded by validate() first
    price = egpToPiastres(egp);
  }
  const is_available: boolean | null = draft.available ? null : false;

  if (price != null || is_available === false) {
    return { op: "put", body: { ...base, price, is_available } };
  }
  if (resolved.hadOverride) {
    return { op: "delete", body: { ...base, price: null, is_available: null } };
  }
  return null;
}

/** Validate every pending price; returns the offending label or null. */
function firstInvalid(cells: PendingCell[]): string | null {
  for (const c of cells) {
    const trimmed = c.draft.price.trim();
    if (trimmed === "") continue;
    const egp = parseFloat(trimmed);
    if (!Number.isFinite(egp) || egp < 0) return c.label;
  }
  return null;
}

// ── Cell UI ───────────────────────────────────────────────────────────────────

/** One matrix cell: effective price + availability, inline-editable. Explicit
 * overrides render solid with a clear (×) affordance; inherited values render
 * muted with a "↳ source" hint. Typing a value promotes an inherited cell to an
 * explicit override; blanking it (then Save) drops back to inheritance. */
function PricingCell({
  col,
  targetId,
  resolved,
  draft,
  onChange,
  onClear,
  currencyLabel,
}: {
  col: ScopeCol;
  targetId: string;
  resolved: ResolvedCell;
  draft: DraftCell;
  onChange: (patch: Partial<DraftCell>) => void;
  onClear: () => void;
  currencyLabel: string;
}) {
  const { t } = useTranslation();
  const dirty = isDirty(draft, resolved);
  const priceExplicit = draft.price.trim() !== "";
  const availHidden = !draft.available;
  const availInherited = !resolved.availExplicit && !dirty;
  const fromLabel =
    resolved.priceFrom === "branch"
      ? t("menu.pricing.fromBranch", "↳ branch")
      : t("menu.pricing.fromCatalog", "↳ catalog");
  const inputId = `price-${targetId}-${colId(col)}`;

  return (
    <div
      className={cn(
        "flex min-w-36 flex-col gap-1.5 border-s px-2.5 py-2 transition-colors",
        dirty && "bg-brand/5",
      )}
    >
      <div className="relative">
        <Input
          id={inputId}
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          value={draft.price}
          onChange={(e) => onChange({ price: e.target.value })}
          placeholder={fmtNumberPlaceholder(resolved.effectivePrice)}
          aria-label={t("menu.pricing.priceAria", "Price ({{currency}})", { currency: currencyLabel })}
          className={cn(
            "h-8 pe-6 font-mono text-sm tabular",
            priceExplicit ? "font-semibold" : "text-muted-foreground placeholder:text-muted-foreground/70",
          )}
        />
        {resolved.priceExplicit && !dirty ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onClear}
                aria-label={t("menu.pricing.clearOverride", "Remove override")}
                className="absolute end-1 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{t("menu.pricing.clearOverride", "Remove override")}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-1">
        {priceExplicit ? (
          <span className="text-[11px] font-medium text-brand">{t("menu.pricing.explicit", "Set here")}</span>
        ) : (
          <span
            className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground"
            title={fromLabel}
          >
            <CornerDownRight className="size-3 rtl:-scale-x-100" aria-hidden="true" />
            {resolved.priceFrom === "branch"
              ? t("menu.pricing.branchPrice", "Branch")
              : t("menu.pricing.catalogPrice", "Catalog")}
          </span>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              role="switch"
              aria-checked={draft.available}
              onClick={() => onChange({ available: !draft.available })}
              aria-label={
                draft.available
                  ? t("menu.pricing.available", "Available")
                  : t("menu.pricing.hidden", "Hidden")
              }
              className={cn(
                "grid size-6 place-items-center rounded-md border transition-colors",
                availHidden
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : availInherited
                    ? "border-transparent text-muted-foreground/70 hover:bg-muted"
                    : "border-transparent text-foreground hover:bg-muted",
              )}
            >
              {draft.available ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {draft.available
              ? t("menu.pricing.markHidden", "Hide at this scope")
              : t("menu.pricing.markAvailable", "Show at this scope")}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

/** The read-only catalog reference cell (first data column). */
function CatalogCell({ price }: { price: number }) {
  return (
    <div className="flex min-w-28 flex-col justify-center px-2.5 py-2">
      <span className="font-mono text-sm font-medium tabular">{fmtMoney(price)}</span>
    </div>
  );
}

/** Placeholder for the price input: the effective (inherited) number, no symbol,
 * so an inherited cell reads as its live effective price in muted text. */
function fmtNumberPlaceholder(piastres: number): string {
  const egp = piastresToEgp(piastres);
  return Number.isInteger(egp) ? String(egp) : egp.toFixed(2).replace(/\.?0+$/, "");
}

// ── Row: one target (size row / add-on row) rendered across all columns ───────

interface RowTarget {
  targetType: "menu_item_size" | "modifier_option";
  targetId: string;
  catalogPrice: number;
  /** branch-scope override for this target. */
  branch: RawOverride;
  /** channel → branch_channel override for this target. */
  byChannel: Map<Channel, RawOverride>;
}

/** Render the six columns for a single target (used by both size sub-rows and
 * add-on rows). Reads/writes the shared dirty store. */
function TargetCells({
  target,
  dirty,
  currencyLabel,
}: {
  target: RowTarget;
  dirty: DirtyState;
  currencyLabel: string;
}) {
  return (
    <>
      <CatalogCell price={target.catalogPrice} />
      {EDITABLE_COLS.map((col) => {
        const channelRaw =
          col.kind === "channel" ? (target.byChannel.get(col.channel) ?? EMPTY_RAW) : EMPTY_RAW;
        const resolved = resolveCell(col, target.catalogPrice, target.branch, channelRaw);
        const draft = dirty.draftFor(col, target.targetId, resolved);
        return (
          <PricingCell
            key={colId(col)}
            col={col}
            targetId={target.targetId}
            resolved={resolved}
            draft={draft}
            currencyLabel={currencyLabel}
            onChange={(patch) => dirty.set(col, target.targetId, resolved, patch)}
            onClear={() => {
              // Clear the explicit override at this cell: send blank price +
              // available (inherit). Save will DELETE since a row existed.
              dirty.set(col, target.targetId, resolved, { price: "", available: true });
            }}
          />
        );
      })}
    </>
  );
}

/** Collect every dirty cell for a target into pending writes. */
function collectPending(
  target: RowTarget,
  labelFor: (col: ScopeCol) => string,
  dirty: DirtyState,
): PendingCell[] {
  const out: PendingCell[] = [];
  for (const col of EDITABLE_COLS) {
    const channelRaw =
      col.kind === "channel" ? (target.byChannel.get(col.channel) ?? EMPTY_RAW) : EMPTY_RAW;
    const resolved = resolveCell(col, target.catalogPrice, target.branch, channelRaw);
    const key = cellKey(col, target.targetId);
    const draft = dirty.drafts.get(key);
    if (!draft) continue;
    if (!isDirty(draft, resolved)) continue;
    out.push({
      key,
      col,
      targetType: target.targetType,
      targetId: target.targetId,
      draft,
      resolved,
      label: labelFor(col),
    });
  }
  return out;
}

// ── Menu item row (expandable → size sub-rows) ────────────────────────────────

function ItemRow({
  item,
  itemName,
  branchId,
  dirty,
  colCount,
  currencyLabel,
  registerTargets,
}: {
  item: MenuItemWithCosts;
  itemName: string;
  branchId: string;
  dirty: DirtyState;
  colCount: number;
  currencyLabel: string;
  /** Publish this item's size targets so the page-level Save can batch them. */
  registerTargets: (itemId: string, targets: RowTarget[]) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const studioQ = useGetStudio(item.id, { query: { enabled: open } });
  const studio = studioQ.data;

  const sizes: SizeOut[] = useMemo(
    () => (studio ? [...studio.sizes].sort((a, b) => a.sort - b.sort) : []),
    [studio],
  );

  // Branch-scope + per-channel override rows for THIS branch, keyed by size id.
  const targets: RowTarget[] = useMemo(() => {
    if (!studio) return [];
    const branch = studio.availability.branches.find((b) => b.branch_id === branchId);
    const branchBySize = new Map<string, SizeOverrideOut>();
    for (const r of branch?.sizes ?? []) branchBySize.set(r.size_id, r);
    // channel → (size_id → override)
    const channelBySize = new Map<Channel, Map<string, SizeOverrideOut>>();
    for (const ch of branch?.channels ?? []) {
      if (!CHANNELS.includes(ch.channel as Channel)) continue;
      const m = new Map<string, SizeOverrideOut>();
      for (const r of ch.sizes) m.set(r.size_id, r);
      channelBySize.set(ch.channel as Channel, m);
    }
    return sizes.map((size) => {
      const b = branchBySize.get(size.id);
      const byChannel = new Map<Channel, RawOverride>();
      for (const chn of CHANNELS) {
        const r = channelBySize.get(chn)?.get(size.id);
        byChannel.set(chn, { price: r?.price ?? null, is_available: r?.is_available ?? null });
      }
      return {
        targetType: "menu_item_size" as const,
        targetId: size.id,
        catalogPrice: size.price,
        branch: { price: b?.price ?? null, is_available: b?.is_available ?? null },
        byChannel,
      } satisfies RowTarget;
    });
  }, [studio, sizes, branchId]);

  // Keep the page-level target registry in sync whenever the studio data lands
  // (so the page-level Save can batch this item's size cells without re-fetching).
  useEffect(() => {
    if (open) registerTargets(item.id, targets);
  }, [open, targets, item.id, registerTargets]);

  const dirtyHere = useMemo(
    () => targets.some((tg) => EDITABLE_COLS.some((c) => dirty.drafts.has(cellKey(c, tg.targetId)))),
    [targets, dirty.drafts],
  );

  return (
    <>
      <tr className="border-t hover:bg-muted/30">
        <th
          scope="row"
          className="sticky start-0 z-10 min-w-56 bg-card p-0 text-start font-normal"
        >
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-start transition-colors hover:bg-muted/40"
          >
            <ChevronDown
              className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
              aria-hidden="true"
            />
            <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-md bg-muted text-muted-foreground">
              {item.image_url ? (
                <img src={item.image_url} alt="" className="size-full object-cover" />
              ) : (
                <CupSoda className="size-4" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{itemName}</span>
              <span className="block text-xs text-muted-foreground">
                {open
                  ? t("menu.pricing.collapseHint", "Collapse")
                  : t("menu.pricing.expandHint", "Expand to price sizes")}
              </span>
            </span>
            {dirtyHere ? (
              <span className="me-1 size-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />
            ) : null}
          </button>
        </th>
        {/* Collapsed: the item itself has no priceable target — cells live per size. */}
        <td colSpan={colCount} className="p-0" aria-hidden={!open} />
      </tr>

      {open ? (
        studioQ.isLoading ? (
          <tr className="border-t">
            <td colSpan={colCount + 1} className="p-3">
              <Skeleton className="h-9 w-full rounded-md" />
            </td>
          </tr>
        ) : studioQ.isError ? (
          <tr className="border-t">
            <td colSpan={colCount + 1} className="px-3 py-4 text-center text-sm text-muted-foreground">
              {t("menu.pricing.loadError", "Couldn't load items")}
            </td>
          </tr>
        ) : targets.length === 0 ? (
          <tr className="border-t">
            <td colSpan={colCount + 1} className="px-3 py-4 text-center text-sm text-muted-foreground">
              {t("menu.pricing.noSizes", "No sizes to price")}
            </td>
          </tr>
        ) : (
          sizes.map((size, i) => {
            const target = targets[i];
            return (
              <tr key={size.id} className="border-t bg-muted/10">
                <th
                  scope="row"
                  className="sticky start-0 z-10 min-w-56 bg-muted/40 px-3 py-2 text-start font-normal"
                >
                  <span className="ms-11 inline-flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-background px-2 py-0.5 text-xs font-medium">
                      {size.label}
                    </span>
                    {!size.is_active ? (
                      <span className="text-[11px] text-muted-foreground">
                        {t("menu.pricing.inactive", "inactive")}
                      </span>
                    ) : null}
                  </span>
                </th>
                <td className="p-0">
                  <div className="flex">
                    <TargetCells target={target} dirty={dirty} currencyLabel={currencyLabel} />
                  </div>
                </td>
              </tr>
            );
          })
        )
      ) : null}
    </>
  );
}

// ── Add-on row (flat) ─────────────────────────────────────────────────────────

function AddonRow({
  target,
  addonName,
  dirty,
  currencyLabel,
}: {
  target: RowTarget;
  addonName: string;
  dirty: DirtyState;
  currencyLabel: string;
}) {
  const dirtyHere = useMemo(
    () => EDITABLE_COLS.some((c) => dirty.drafts.has(cellKey(c, target.targetId))),
    [dirty.drafts, target.targetId],
  );
  return (
    <tr className="border-t hover:bg-muted/30">
      <th scope="row" className="sticky start-0 z-10 min-w-56 bg-card px-3 py-2 text-start font-normal">
        <span className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
            <Tag className="size-4" />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{addonName}</span>
          {dirtyHere ? <span className="size-2 shrink-0 rounded-full bg-brand" aria-hidden="true" /> : null}
        </span>
      </th>
      <td className="p-0">
        <div className="flex">
          <TargetCells target={target} dirty={dirty} currencyLabel={currencyLabel} />
        </div>
      </td>
    </tr>
  );
}

// ── Matrix header ─────────────────────────────────────────────────────────────

function MatrixHead({ firstLabel }: { firstLabel: string }) {
  const { t } = useTranslation();
  return (
    <thead>
      <tr className="border-b bg-muted/40 text-xs font-medium text-muted-foreground">
        <th scope="col" className="sticky start-0 z-20 min-w-56 bg-muted/40 px-3 py-2 text-start">
          {firstLabel}
        </th>
        {ALL_COLS.map((col) => {
          const { key, fallback } = colLabel(col);
          return (
            <th
              key={colId(col)}
              scope="col"
              className={cn(
                "min-w-28 px-2.5 py-2 text-start",
                col.kind !== "catalog" && "min-w-36 border-s",
                col.kind === "catalog" && "text-muted-foreground/80",
              )}
            >
              {t(key, fallback)}
              {col.kind === "catalog" ? (
                <span className="ms-1 font-normal">({t("menu.pricing.readonly", "ref")})</span>
              ) : null}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

/** Wrap the matrix table in a horizontally-scrolling bordered card. The first
 * column is sticky; the rest scrolls on narrow viewports. */
function Matrix({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full border-collapse text-sm">
        {head}
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

/**
 * Pricing & Availability — a matrix of every priceable target (menu-item sizes,
 * add-ons) × every branch scope (in-store + the four delivery channels), for the
 * ONE branch selected in the global scope bar. Each cell shows the effective
 * price + availability and is inline-editable; edits accumulate as dirty cells
 * and commit together via a sticky save bar. Reads Studio per expanded item and
 * per-channel add-on override lists at the page level; all writes go through the
 * unified override table (putPriceOverride / deletePriceOverride) per CONTRACT §3.
 */
export function PricingAvailabilityPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const orgId = useOrgId();
  const scope = useScope();
  const branchId = scope.branchId;

  const [tab, setTab] = useState("items");
  const [itemsPage, setItemsPage] = useState(0);
  const [itemsSearch, setItemsSearch] = useState("");
  const itemsSearchQ = useDebounced(itemsSearch, 300);
  const [addonsPage, setAddonsPage] = useState(0);
  const [addonsSearch, setAddonsSearch] = useState("");
  const addonsSearchQ = useDebounced(addonsSearch, 300);

  const branchesQ = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const branch = useMemo(
    () => (branchesQ.data ?? []).find((b) => b.id === branchId),
    [branchesQ.data, branchId],
  );

  const on = !!orgId && !!branchId;
  const tname = useCallback(
    (m: { name: string; name_translations?: unknown }) => getTranslatedName(m, lang),
    [lang],
  );
  const currencyLabel = "EGP";

  // Shared dirty-cell store spanning the whole visible tab.
  const dirty = useDirtyCells();

  // Switching branches loads an entirely different override set — abandon any
  // edits staged against the previous branch so the count/Save stay coherent.
  const dirtyReset = dirty.reset;
  useEffect(() => {
    dirtyReset();
  }, [branchId, dirtyReset]);

  // Per-item size targets published by expanded ItemRows, so Save can batch them
  // without re-fetching. Keyed by item id.
  const [itemTargets, setItemTargets] = useState<Map<string, RowTarget[]>>(new Map());
  const registerTargets = useCallback((itemId: string, targets: RowTarget[]) => {
    setItemTargets((prev) => {
      const existing = prev.get(itemId);
      // Cheap identity guard: same length + same target ids → skip.
      if (existing && existing.length === targets.length && existing.every((e, i) => e === targets[i])) {
        return prev;
      }
      const next = new Map(prev);
      next.set(itemId, targets);
      return next;
    });
  }, []);

  // ── Catalog + add-on override reads ─────────────────────────────────────────
  const catalogParams = useMemo(
    () => ({ org_id: orgId ?? "", search: itemsSearchQ || undefined, page: itemsPage + 1, per_page: PER_PAGE }),
    [orgId, itemsSearchQ, itemsPage],
  );
  const addonParams = useMemo(
    () => ({ org_id: orgId ?? "", search: addonsSearchQ || undefined, page: addonsPage + 1, per_page: PER_PAGE }),
    [orgId, addonsSearchQ, addonsPage],
  );

  const catalog = useListMenuCatalog(catalogParams, { query: { enabled: on, placeholderData: keepPreviousData } });
  const addons = useListAddonCatalog(addonParams, { query: { enabled: on, placeholderData: keepPreviousData } });

  // Add-on branch-scope overrides (one query) + per-channel overrides (four
  // queries, one per delivery channel). Fixed hook order → safe to call in a row.
  const branchAddonOvr = useListBranchAddonOverrides(
    { branch_id: branchId ?? "" },
    { query: { enabled: on } },
  );
  const inMallAddonOvr = useListChannelAddonOverrides(
    { branch_id: branchId ?? "", channel: "in_mall" },
    { query: { enabled: on } },
  );
  const outsideAddonOvr = useListChannelAddonOverrides(
    { branch_id: branchId ?? "", channel: "outside" },
    { query: { enabled: on } },
  );
  const umbrellaAddonOvr = useListChannelAddonOverrides(
    { branch_id: branchId ?? "", channel: "umbrella" },
    { query: { enabled: on } },
  );
  const pickupAddonOvr = useListChannelAddonOverrides(
    { branch_id: branchId ?? "", channel: "pickup" },
    { query: { enabled: on } },
  );
  const channelAddonQs: Record<Channel, ChannelAddonOverride[] | undefined> = {
    in_mall: inMallAddonOvr.data,
    outside: outsideAddonOvr.data,
    umbrella: umbrellaAddonOvr.data,
    pickup: pickupAddonOvr.data,
  };

  const items: MenuItemWithCosts[] = useMemo(() => catalog.data?.data ?? [], [catalog.data]);
  const itemsPageCount = catalog.data?.total_pages ?? 0;
  const addonList: AddonItem[] = useMemo(() => addons.data?.data ?? [], [addons.data]);
  const addonsPageCount = addons.data?.total_pages ?? 0;

  // Add-on lookups keyed by addon id → per-scope RawOverride.
  const branchAddonById = useMemo(() => {
    const m = new Map<string, BranchAddonOverride>();
    for (const o of branchAddonOvr.data ?? []) m.set(o.addon_item_id, o);
    return m;
  }, [branchAddonOvr.data]);

  const channelAddonById = useMemo(() => {
    const m = new Map<Channel, Map<string, ChannelAddonOverride>>();
    for (const chn of CHANNELS) {
      const inner = new Map<string, ChannelAddonOverride>();
      for (const o of channelAddonQs[chn] ?? []) inner.set(o.addon_item_id, o);
      m.set(chn, inner);
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inMallAddonOvr.data, outsideAddonOvr.data, umbrellaAddonOvr.data, pickupAddonOvr.data]);

  const addonTargets: Map<string, RowTarget> = useMemo(() => {
    const m = new Map<string, RowTarget>();
    for (const addon of addonList) {
      const b = branchAddonById.get(addon.id);
      const byChannel = new Map<Channel, RawOverride>();
      for (const chn of CHANNELS) {
        const c = channelAddonById.get(chn)?.get(addon.id);
        byChannel.set(chn, { price: c?.price_override ?? null, is_available: c?.is_available ?? null });
      }
      m.set(addon.id, {
        targetType: "modifier_option",
        targetId: addon.id,
        catalogPrice: addon.default_price,
        branch: { price: b?.price_override ?? null, is_available: b?.is_available ?? null },
        byChannel,
      });
    }
    return m;
  }, [addonList, branchAddonById, channelAddonById]);

  // ── Save / discard ──────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);

  const buildPending = useCallback((): PendingCell[] => {
    const out: PendingCell[] = [];
    // Menu-item sizes (only expanded items contribute targets).
    for (const [itemId, targets] of itemTargets) {
      const item = items.find((it) => it.id === itemId);
      const itemName = item ? tname(item) : "";
      for (const tg of targets) {
        out.push(...collectPending(tg, () => itemName, dirty));
      }
    }
    // Add-ons.
    for (const addon of addonList) {
      const tg = addonTargets.get(addon.id);
      if (!tg) continue;
      out.push(...collectPending(tg, () => tname(addon), dirty));
    }
    return out;
  }, [itemTargets, items, addonList, addonTargets, dirty, tname]);

  const save = async () => {
    const pending = buildPending();
    if (pending.length === 0) return;
    const bad = firstInvalid(pending);
    if (bad) {
      toast.error(t("menu.pricing.invalidPriceFor", "Enter a valid price for {{name}}", { name: bad }));
      return;
    }
    if (!branchId) return;
    setSaving(true);
    const results = await Promise.all(
      pending.map(async (cell) => {
        const plan = planCell(cell, branchId);
        if (!plan) return { cell, ok: true as const };
        try {
          if (plan.op === "put") await putPriceOverride(plan.body);
          else await deletePriceOverride(plan.body);
          return { cell, ok: true as const };
        } catch (e) {
          return { cell, ok: false as const, error: getErrorMessage(e) };
        }
      }),
    );
    setSaving(false);

    const failed = results.filter((r) => !r.ok);
    void invalidatePricingOverrides();

    if (failed.length === 0) {
      toast.success(t("menu.pricing.savedN", "Saved {{count}} changes", { count: pending.length }));
      dirty.reset();
    } else {
      // Drop successful cells; keep failed ones dirty for a retry.
      const failedKeys = new Set(failed.map((r) => r.cell.key));
      dirty.keepOnly(failedKeys);
      toast.error(
        t("menu.pricing.savedPartial", "Saved {{ok}}, {{failed}} failed", {
          ok: pending.length - failed.length,
          failed: failed.length,
        }),
      );
    }
  };

  // ── Guards ──────────────────────────────────────────────────────────────────
  if (!orgId) {
    return (
      <Page>
        <PricingHeader />
        <EmptyState icon={Store} title={t("menu.pricing.pickOrg", "Select an organization to manage pricing")} />
      </Page>
    );
  }

  const searchInput = (value: string, onChange: (v: string) => void) => (
    <div className="relative w-full sm:w-64">
      <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("common.search", "Search…")}
        aria-label={t("common.search", "Search…")}
        className="h-9 ps-8"
      />
    </div>
  );

  const pager = (page: number, pageCount: number, setPage: (p: number) => void) =>
    pageCount > 1 ? (
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground tabular">
          {t("common.page", { current: page + 1, total: pageCount, defaultValue: `Page ${page + 1} of ${pageCount}` })}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            aria-label={t("common.previous", "Previous")}
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page >= pageCount - 1}
            onClick={() => setPage(page + 1)}
            aria-label={t("common.next", "Next")}
          >
            <ChevronRight className="size-4 rtl:rotate-180" />
          </Button>
        </div>
      </div>
    ) : null;

  const legend = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-3.5 w-6 rounded border bg-brand/5" aria-hidden="true" />
        {t("menu.pricing.legendDirty", "Unsaved")}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <CornerDownRight className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
        {t("menu.pricing.legendInherited", "Inherited (muted)")}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <EyeOff className="size-3.5 text-destructive" aria-hidden="true" />
        {t("menu.pricing.legendHidden", "Hidden here")}
      </span>
    </div>
  );

  const colCount = ALL_COLS.length; // catalog + 5 editable

  return (
    <Page>
      <PricingHeader />

      {branchesQ.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-full max-w-md rounded-md" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : scope.isAllBranches || !branchId ? (
        <EmptyState
          icon={Store}
          title={t("menu.pricing.pickBranchTitle", "Pick a specific branch")}
          description={t(
            "menu.pricing.pickBranchHint",
            "Branch and channel overrides need a concrete branch. Choose one in the branch picker at the top.",
          )}
        />
      ) : (
        <TooltipProvider delayDuration={200}>
          <Tabs value={tab} onValueChange={setTab} className="gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PageTabsList>
                <PageTabsTrigger value="items">{t("menu.pricing.menuItems", "Menu items")}</PageTabsTrigger>
                <PageTabsTrigger value="addons">{t("menu.pricing.addonItems", "Add-ons")}</PageTabsTrigger>
              </PageTabsList>
              {branch ? (
                <p className="text-sm text-muted-foreground">
                  <Store className="me-1.5 inline size-3.5 align-[-2px]" aria-hidden="true" />
                  {branch.name}
                </p>
              ) : null}
            </div>

            <TabsContent value="items" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {searchInput(itemsSearch, setItemsSearch)}
                {legend}
              </div>

              {catalog.isLoading ? (
                <Skeleton className="h-64 w-full rounded-xl" />
              ) : catalog.isError ? (
                <EmptyState
                  icon={AlertTriangle}
                  title={t("menu.pricing.loadError", "Couldn't load items")}
                  description={t("menu.pricing.loadErrorHint", "Check your connection and try refreshing.")}
                />
              ) : items.length === 0 ? (
                <EmptyState icon={UtensilsCrossed} title={t("menu.pricing.noItems", "No menu items")} />
              ) : (
                <Matrix head={<MatrixHead firstLabel={t("menu.pricing.itemColumn", "Item / size")} />}>
                  {items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      itemName={tname(item)}
                      branchId={branchId}
                      dirty={dirty}
                      colCount={colCount}
                      currencyLabel={currencyLabel}
                      registerTargets={registerTargets}
                    />
                  ))}
                </Matrix>
              )}

              {pager(itemsPage, itemsPageCount, setItemsPage)}
            </TabsContent>

            <TabsContent value="addons" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {searchInput(addonsSearch, setAddonsSearch)}
                {legend}
              </div>

              {addons.isLoading || branchAddonOvr.isLoading ? (
                <Skeleton className="h-64 w-full rounded-xl" />
              ) : addons.isError || branchAddonOvr.isError ? (
                <EmptyState
                  icon={AlertTriangle}
                  title={t("menu.pricing.loadError", "Couldn't load items")}
                  description={t("menu.pricing.loadErrorHint", "Check your connection and try refreshing.")}
                />
              ) : addonList.length === 0 ? (
                <EmptyState icon={Tag} title={t("menu.pricing.noAddons", "No add-ons")} />
              ) : (
                <Matrix head={<MatrixHead firstLabel={t("menu.pricing.addonColumn", "Add-on")} />}>
                  {addonList.map((addon) => {
                    const target = addonTargets.get(addon.id);
                    if (!target) return null;
                    return (
                      <AddonRow
                        key={addon.id}
                        target={target}
                        addonName={tname(addon)}
                        dirty={dirty}
                        currencyLabel={currencyLabel}
                      />
                    );
                  })}
                </Matrix>
              )}

              {pager(addonsPage, addonsPageCount, setAddonsPage)}
            </TabsContent>
          </Tabs>
        </TooltipProvider>
      )}

      {/* Sticky save bar — only while there are unsaved changes. */}
      {dirty.count > 0 ? (
        <div className="pointer-events-none sticky bottom-4 z-30 flex justify-center">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border bg-card/95 px-4 py-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <span className="text-sm font-medium">
              {t("menu.pricing.unsavedN", "{{count}} unsaved changes", { count: dirty.count })}
            </span>
            <Button variant="ghost" size="sm" onClick={() => dirty.reset()} disabled={saving}>
              {t("menu.pricing.discard", "Discard")}
            </Button>
            <Button size="sm" onClick={() => void save()} loading={saving} disabled={saving}>
              {t("common.save", "Save")}
            </Button>
          </div>
        </div>
      ) : null}
    </Page>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function PricingHeader() {
  const { t } = useTranslation();
  return (
    <div className="space-y-1.5">
      <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">
        {t("menu.pricing.title", "Pricing & availability")}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t(
          "menu.pricing.matrixSubtitle",
          "Set the effective price and availability for every scope side by side — in-store and each delivery channel.",
        )}
      </p>
    </div>
  );
}
