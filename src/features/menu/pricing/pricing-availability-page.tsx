import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CupSoda,
  Search,
  Store,
  Tag,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";

import { Page } from "@/components/app/page";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  deletePriceOverride,
  putPriceOverride,
  useGetStudio,
  useListAddonCatalog,
  useListBranchAddonOverrides,
  useListBranches,
  useListBranchMenuOverrides,
  useListChannelAddonOverrides,
  useListChannelOverrides,
  useListMenuCatalog,
} from "@/data/api/generated/api";
import type {
  AddonItem,
  ChannelAddonOverride,
  MenuItemWithCosts,
  SizeOut,
  SizeOverrideOut,
} from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, fmtMoney, piastresToEgp } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";
import { useDebounced } from "@/lib/use-debounced";
import { useOrgId } from "@/hooks/use-org-id";
import { useScope } from "@/data/scope/use-scope";
import { invalidatePricingOverrides } from "./util";

/** Sentinel channel value for the branch (in-store, no delivery channel) scope. */
const IN_STORE = "__in_store__";
type Channel = "in_mall" | "outside" | "umbrella" | "pickup";
const PER_PAGE = 24;

/** Derives the unified override envelope from the picked branch + channel.
 * Empty channel → `branch` scope (in-store); a channel → `branch_channel`. */
function overrideScope(branchId: string, channel: string) {
  const inStore = channel === IN_STORE;
  return {
    scope: inStore ? ("branch" as const) : ("branch_channel" as const),
    branch_id: branchId,
    channel: inStore ? null : (channel as Channel),
  };
}

type TName = { name: string; name_translations?: unknown };

// ── Per-size override row (menu items) ────────────────────────────────────────

/** A single editable size row: effective price + availability for one size at the
 * selected branch/channel. Writes target `menu_item_size` / `target_id = size.id`.
 * Follows the merged-table null convention: a blank price sends `price: null`
 * (inherit the catalog), and availability sends `null` when on (inherit) but an
 * explicit `false` when hidden — so effective resolution stays correct. */
function SizeOverrideRow({
  size,
  existing,
  branchId,
  channel,
  onChanged,
}: {
  size: SizeOut;
  existing: SizeOverrideOut | undefined;
  branchId: string;
  channel: string;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const [price, setPrice] = useState("");
  const [available, setAvailable] = useState(true);
  const [busy, setBusy] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    setPrice(existing?.price != null ? String(piastresToEgp(existing.price)) : "");
    setAvailable(existing?.is_available ?? true);
  }, [existing]);

  const base = useMemo(
    () => ({ ...overrideScope(branchId, channel), target_type: "menu_item_size" as const, target_id: size.id }),
    [branchId, channel, size.id],
  );
  const hasOverride = existing != null && (existing.price != null || existing.is_available != null);

  const done = () => {
    onChanged();
    toast.success(t("menu.pricing.saved", "Changes saved"));
  };

  const save = async () => {
    const trimmed = price.trim();
    let priceOverride: number | null = null;
    if (trimmed !== "") {
      const egp = parseFloat(trimmed);
      if (!Number.isFinite(egp) || egp < 0) {
        toast.error(t("menu.pricing.invalidPrice", "Enter a valid price"));
        return;
      }
      priceOverride = egpToPiastres(egp);
    }
    // Only `false` (explicitly hidden) is written; `true` (available) inherits.
    const avail = available ? null : false;
    setBusy(true);
    try {
      if (priceOverride != null || avail != null) {
        await putPriceOverride({ ...base, price: priceOverride, is_available: avail });
      } else {
        await deletePriceOverride({ ...base, price: null, is_available: null });
      }
      done();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    setBusy(true);
    setClearing(true);
    try {
      await deletePriceOverride({ ...base, price: null, is_available: null });
      done();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
      setClearing(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-2.5">
      <span className="inline-flex min-w-20 items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
        {size.label}
      </span>
      <span className="text-xs text-muted-foreground">
        {t("menu.pricing.catalogPrice", "Catalog")} <span className="tabular">{fmtMoney(size.price)}</span>
      </span>
      <div className="ms-auto flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2">
          <Switch checked={available} onCheckedChange={setAvailable} disabled={busy} />
          <span className="text-xs text-muted-foreground">
            {available ? t("menu.pricing.available", "Available") : t("menu.pricing.hidden", "Hidden")}
          </span>
        </label>
        <Input
          type="number"
          step="any"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={t("menu.pricing.inherit", "Inherit")}
          className="h-8 w-28 font-mono text-sm"
        />
        <Button type="button" size="sm" onClick={() => void save()} loading={busy && !clearing} disabled={busy}>
          {t("common.save", "Save")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => void clear()}
          loading={clearing}
          disabled={busy || !hasOverride}
        >
          {t("menu.pricing.clear", "Clear")}
        </Button>
      </div>
    </div>
  );
}

/** Expandable menu-item card. Collapsed shows the catalog base price and whether
 * this branch/channel already overrides the item; expanding lazily loads the
 * Studio aggregate to reveal a `SizeOverrideRow` per size (the real override
 * targets). Studio is the source of the current per-size / per-channel rows. */
function ItemCard({
  item,
  itemName,
  hasOverride,
  branchId,
  channel,
  onChanged,
}: {
  item: MenuItemWithCosts;
  itemName: string;
  hasOverride: boolean;
  branchId: string;
  channel: string;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const studioQ = useGetStudio(item.id, { query: { enabled: open } });
  const studio = studioQ.data;

  const sizes = useMemo(
    () => (studio ? [...studio.sizes].sort((a, b) => a.sort - b.sort) : []),
    [studio],
  );

  // The branch's current per-size rows for the selected scope. In-store reads the
  // branch-level `sizes`; a channel reads that channel's `sizes`.
  const currentBySize = useMemo(() => {
    const m = new Map<string, SizeOverrideOut>();
    if (!studio) return m;
    const branch = studio.availability.branches.find((b) => b.branch_id === branchId);
    if (!branch) return m;
    const rows =
      channel === IN_STORE
        ? branch.sizes
        : (branch.channels.find((c) => c.channel === channel)?.sizes ?? []);
    for (const r of rows) m.set(r.size_id, r);
    return m;
  }, [studio, branchId, channel]);

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-3 text-start transition-colors hover:bg-muted/40"
        aria-expanded={open}
      >
        <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
          {item.image_url ? (
            <img src={item.image_url} alt="" className="size-full object-cover" />
          ) : (
            <CupSoda className="size-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{itemName}</p>
          <p className="text-xs text-muted-foreground">
            {t("menu.pricing.catalogPrice", "Catalog")} {fmtMoney(item.base_price)}
          </p>
        </div>
        {hasOverride ? (
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            {t("menu.pricing.overridden", "Overridden")}
          </span>
        ) : null}
        <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="border-t">
          {studioQ.isLoading ? (
            <div className="space-y-2 p-3">
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ) : studioQ.isError ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              {t("menu.pricing.loadError", "Couldn't load sizes")}
            </p>
          ) : sizes.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              {t("menu.pricing.noSizes", "No sizes to price")}
            </p>
          ) : (
            <div className="divide-y">
              {sizes.map((size) => (
                <SizeOverrideRow
                  key={size.id}
                  size={size}
                  existing={currentBySize.get(size.id)}
                  branchId={branchId}
                  channel={channel}
                  onChanged={onChanged}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </Card>
  );
}

// ── Add-on card (flat, single override target) ────────────────────────────────

/** Add-on override card. The add-on IS the override target (`modifier_option`,
 * `target_id = addon.id`) — one row carries price + availability. */
function AddonCard({
  addon,
  addonName,
  override,
  branchId,
  channel,
  onChanged,
}: {
  addon: AddonItem;
  addonName: string;
  override: ChannelAddonOverride | undefined;
  branchId: string;
  channel: string;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const [price, setPrice] = useState("");
  const [available, setAvailable] = useState(true);
  const [busy, setBusy] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    setPrice(override?.price_override != null ? String(piastresToEgp(override.price_override)) : "");
    setAvailable(override?.is_available ?? true);
  }, [override]);

  const base = useMemo(
    () => ({ ...overrideScope(branchId, channel), target_type: "modifier_option" as const, target_id: addon.id }),
    [branchId, channel, addon.id],
  );
  const hasOverride = override != null;

  const done = () => {
    onChanged();
    toast.success(t("menu.pricing.saved", "Changes saved"));
  };

  const save = async () => {
    const trimmed = price.trim();
    let priceOverride: number | null = null;
    if (trimmed !== "") {
      const egp = parseFloat(trimmed);
      if (!Number.isFinite(egp) || egp < 0) {
        toast.error(t("menu.pricing.invalidPrice", "Enter a valid price"));
        return;
      }
      priceOverride = egpToPiastres(egp);
    }
    const avail = available ? null : false;
    setBusy(true);
    try {
      if (priceOverride != null || avail != null) {
        await putPriceOverride({ ...base, price: priceOverride, is_available: avail });
      } else {
        await deletePriceOverride({ ...base, price: null, is_available: null });
      }
      done();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    setBusy(true);
    setClearing(true);
    try {
      await deletePriceOverride({ ...base, price: null, is_available: null });
      done();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
      setClearing(false);
    }
  };

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="space-y-2 p-3">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
            <Tag className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{addonName}</p>
            <p className="text-xs text-muted-foreground">
              {t("menu.pricing.catalogPrice", "Catalog")} {fmtMoney(addon.default_price)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Switch checked={available} onCheckedChange={setAvailable} disabled={busy} />
            <span className="text-xs text-muted-foreground">
              {available ? t("menu.pricing.available", "Available") : t("menu.pricing.hidden", "Hidden")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step="any"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={t("menu.pricing.inherit", "Inherit")}
            className="h-8 font-mono text-sm"
          />
          <Button type="button" size="sm" onClick={() => void save()} loading={busy && !clearing} disabled={busy}>
            {t("common.save", "Save")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void clear()}
            loading={clearing}
            disabled={busy || !hasOverride}
          >
            {t("menu.pricing.clear", "Clear")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

/**
 * The unified Pricing & Availability screen. An operator picks a BRANCH (required)
 * and optionally a CHANNEL — the scope is derived (no channel → `branch`;
 * a channel → `branch_channel`) — then edits effective price + availability for
 * every menu item (per size) and every add-on in one place. Replaces the three
 * scattered override surfaces; all writes go through the unified override table
 * via putPriceOverride / deletePriceOverride.
 */
export function PricingAvailabilityPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const orgId = useOrgId();
  const scope = useScope();

  // Branch is picked in-page (seeded from the scope bar when a branch is active).
  const [branchId, setBranchId] = useState<string | null>(scope.branchId);
  const [channel, setChannel] = useState<string>(IN_STORE);
  const [tab, setTab] = useState("items");

  const [itemsPage, setItemsPage] = useState(0);
  const [itemsSearch, setItemsSearch] = useState("");
  const itemsSearchQ = useDebounced(itemsSearch, 300);
  const [addonsPage, setAddonsPage] = useState(0);
  const [addonsSearch, setAddonsSearch] = useState("");
  const addonsSearchQ = useDebounced(addonsSearch, 300);

  const branchesQ = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const branches = useMemo(() => (branchesQ.data ?? []).filter((b) => b.is_active), [branchesQ.data]);

  // Keep the picked branch valid once branches load / the scope changes.
  useEffect(() => {
    if (branchId && branches.some((b) => b.id === branchId)) return;
    setBranchId(scope.branchId && branches.some((b) => b.id === scope.branchId) ? scope.branchId : (branches[0]?.id ?? null));
  }, [branches, branchId, scope.branchId]);

  const on = !!orgId && !!branchId;
  const isChannel = channel !== IN_STORE;

  useEffect(() => { setItemsPage(0); }, [itemsSearchQ, channel, branchId]);
  useEffect(() => { setAddonsPage(0); }, [addonsSearchQ, channel, branchId]);

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

  // Override presence badges. Reads split by scope: channel vs. branch-level views.
  const channelItemOvr = useListChannelOverrides(
    { branch_id: branchId ?? "", channel: isChannel ? channel : IN_STORE },
    { query: { enabled: on && isChannel } },
  );
  const branchItemOvr = useListBranchMenuOverrides(
    { branch_id: branchId ?? "" },
    { query: { enabled: on && !isChannel } },
  );
  const channelAddonOvr = useListChannelAddonOverrides(
    { branch_id: branchId ?? "", channel: isChannel ? channel : IN_STORE },
    { query: { enabled: on && isChannel } },
  );
  const branchAddonOvr = useListBranchAddonOverrides(
    { branch_id: branchId ?? "" },
    { query: { enabled: on && !isChannel } },
  );

  const items: MenuItemWithCosts[] = catalog.data?.data ?? [];
  const itemsPageCount = catalog.data?.total_pages ?? 0;
  const addonList: AddonItem[] = addons.data?.data ?? [];
  const addonsPageCount = addons.data?.total_pages ?? 0;
  const tname = (m: TName) => getTranslatedName(m, lang);

  // Which items are overridden at this scope (for the collapsed badge).
  const overriddenItems = useMemo(() => {
    const s = new Set<string>();
    if (isChannel) for (const o of channelItemOvr.data ?? []) s.add(o.menu_item_id);
    else for (const o of branchItemOvr.data ?? []) s.add(o.menu_item_id);
    return s;
  }, [isChannel, channelItemOvr.data, branchItemOvr.data]);

  // Add-on override rows keyed by add-on id, normalised across the two read shapes.
  const addonOverrideById = useMemo(() => {
    const m = new Map<string, ChannelAddonOverride>();
    if (isChannel) {
      for (const o of channelAddonOvr.data ?? []) m.set(o.addon_item_id, o);
    } else {
      for (const o of branchAddonOvr.data ?? []) {
        m.set(o.addon_item_id, {
          addon_item_id: o.addon_item_id,
          branch_id: o.branch_id,
          channel: "",
          is_available: o.is_available,
          price_override: o.price_override,
        });
      }
    }
    return m;
  }, [isChannel, channelAddonOvr.data, branchAddonOvr.data]);

  const refresh = () => { void invalidatePricingOverrides(); };

  const itemsOverridesLoading = isChannel ? channelItemOvr.isLoading : branchItemOvr.isLoading;
  const itemsOverridesError = isChannel ? channelItemOvr.isError : branchItemOvr.isError;
  const addonsOverridesLoading = isChannel ? channelAddonOvr.isLoading : branchAddonOvr.isLoading;
  const addonsOverridesError = isChannel ? channelAddonOvr.isError : branchAddonOvr.isError;

  if (!orgId) {
    return (
      <Page>
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">
            {t("menu.pricing.title", "Pricing & availability")}
          </h1>
        </div>
        <EmptyState icon={Store} title={t("menu.pricing.pickOrg", "Select an organization to manage pricing")} />
      </Page>
    );
  }

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

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={branchId ?? ""} onValueChange={(v) => setBranchId(v)}>
        <SelectTrigger className="h-9 w-auto min-w-44">
          <SelectValue placeholder={t("menu.pricing.selectBranch", "Select a branch")} />
        </SelectTrigger>
        <SelectContent>
          {branches.map((b) => (
            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={channel} onValueChange={setChannel}>
        <SelectTrigger className="h-9 w-auto min-w-44"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={IN_STORE}>{t("menu.pricing.inStore", "In-store (no channel)")}</SelectItem>
          <SelectItem value="in_mall">{t("menu.pricing.channel_in_mall", "In-mall delivery")}</SelectItem>
          <SelectItem value="outside">{t("menu.pricing.channel_outside", "Outside delivery")}</SelectItem>
          <SelectItem value="umbrella">{t("menu.pricing.channel_umbrella", "Umbrella delivery")}</SelectItem>
          <SelectItem value="pickup">{t("menu.pricing.channel_pickup", "Pickup")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

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

  const gridSkeleton = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );

  return (
    <Page>
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">
          {t("menu.pricing.title", "Pricing & availability")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(
            "menu.pricing.subtitle",
            "Set effective price and availability for items and add-ons at a branch — in-store or per delivery channel.",
          )}
        </p>
      </div>

      {branchesQ.isLoading ? (
        gridSkeleton
      ) : branches.length === 0 ? (
        <EmptyState icon={Store} title={t("menu.pricing.noBranches", "No active branches")} />
      ) : !branchId ? (
        <EmptyState icon={Store} title={t("menu.pricing.selectBranch", "Select a branch")} />
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="gap-4">
          <PageTabsList>
            <PageTabsTrigger value="items">{t("menu.pricing.menuItems", "Menu items")}</PageTabsTrigger>
            <PageTabsTrigger value="addons">{t("menu.pricing.addonItems", "Add-ons")}</PageTabsTrigger>
          </PageTabsList>

          <TabsContent value="items" className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {controls}
              {searchInput(itemsSearch, setItemsSearch)}
            </div>

            {catalog.isLoading || itemsOverridesLoading ? (
              gridSkeleton
            ) : catalog.isError || itemsOverridesError ? (
              <EmptyState
                icon={AlertTriangle}
                title={t("menu.pricing.loadError", "Couldn't load items")}
                description={t("menu.pricing.loadErrorHint", "Check your connection and try refreshing.")}
              />
            ) : items.length === 0 ? (
              <EmptyState icon={UtensilsCrossed} title={t("menu.pricing.noItems", "No menu items")} />
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                {items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    itemName={tname(item)}
                    hasOverride={overriddenItems.has(item.id)}
                    branchId={branchId}
                    channel={channel}
                    onChanged={refresh}
                  />
                ))}
              </div>
            )}

            {pager(itemsPage, itemsPageCount, setItemsPage)}
          </TabsContent>

          <TabsContent value="addons" className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {controls}
              {searchInput(addonsSearch, setAddonsSearch)}
            </div>

            {addons.isLoading || addonsOverridesLoading ? (
              gridSkeleton
            ) : addons.isError || addonsOverridesError ? (
              <EmptyState
                icon={AlertTriangle}
                title={t("menu.pricing.loadError", "Couldn't load items")}
                description={t("menu.pricing.loadErrorHint", "Check your connection and try refreshing.")}
              />
            ) : addonList.length === 0 ? (
              <EmptyState icon={Tag} title={t("menu.pricing.noAddons", "No add-ons")} />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {addonList.map((addon) => (
                  <AddonCard
                    key={addon.id}
                    addon={addon}
                    addonName={tname(addon)}
                    override={addonOverrideById.get(addon.id)}
                    branchId={branchId}
                    channel={channel}
                    onChanged={refresh}
                  />
                ))}
              </div>
            )}

            {pager(addonsPage, addonsPageCount, setAddonsPage)}
          </TabsContent>
        </Tabs>
      )}
    </Page>
  );
}
