import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, CupSoda, Search, Store, Tag, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getListAddonCatalogQueryOptions,
  getListMenuCatalogQueryOptions,
  useDeleteChannelAddonOverride,
  useDeleteChannelOverride,
  useListAddonCatalog,
  useListChannelAddonOverrides,
  useListChannelOverrides,
  useListMenuCatalog,
  useUpsertChannelAddonOverride,
  useUpsertChannelOverride,
} from "@/data/api/generated/api";
import type {
  AddonItem,
  ChannelAddonOverride,
  ChannelMenuOverride,
  MenuItemWithCosts,
} from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, fmtMoney, piastresToEgp } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";
import { useDebounced } from "@/lib/use-debounced";
import { useOrgId } from "@/hooks/use-org-id";
import { useScope } from "@/data/scope/use-scope";

type Channel = "in_mall" | "outside";
const PER_PAGE = 24;

/** Shared price + availability editor card used for both menu items and add-ons. */
function OverrideCard({
  name,
  imageUrl,
  orgPrice,
  Icon,
  override,
  busy,
  saving,
  clearing,
  onSave,
  onClear,
}: {
  name: string;
  imageUrl?: string | null;
  orgPrice: number;
  Icon: typeof CupSoda;
  override: ChannelMenuOverride | ChannelAddonOverride | undefined;
  busy: boolean;
  saving: boolean;
  clearing: boolean;
  onSave: (priceOverride: number | null, available: boolean | null) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();

  // Local draft so the user can type a price before committing.
  const [price, setPrice] = useState("");
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    setPrice(override?.price_override != null ? String(piastresToEgp(override.price_override)) : "");
    setAvailable(override?.is_available ?? true);
  }, [override]);

  const hasOverride = override != null;

  const save = () => {
    const trimmed = price.trim();
    let priceOverride: number | null = null;
    if (trimmed !== "") {
      const egp = parseFloat(trimmed);
      if (!Number.isFinite(egp) || egp < 0) {
        toast.error(t("delivery.invalidPrice", "Enter a valid price"));
        return;
      }
      priceOverride = egpToPiastres(egp);
    }
    onSave(priceOverride, available);
  };

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="space-y-2 p-3">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
            {imageUrl ? <img src={imageUrl} alt="" className="size-full object-cover" /> : <Icon className="size-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="text-xs text-muted-foreground">
              {t("delivery.orgPrice", "Org")} {fmtMoney(orgPrice)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Switch checked={available} onCheckedChange={setAvailable} disabled={busy} />
            <span className="text-xs text-muted-foreground">
              {available ? t("delivery.available", "Available") : t("delivery.hidden", "Hidden")}
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
            placeholder={t("delivery.inheritPrice", "Inherit org price")}
            className="h-8 font-mono text-sm"
          />
          <Button type="button" size="sm" onClick={save} loading={saving} disabled={busy}>
            {t("common.save", "Save")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onClear}
            loading={clearing}
            disabled={busy || !hasOverride}
          >
            {t("common.clear", "Clear")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ItemRow({
  item,
  itemName,
  override,
  channel,
  branchId,
  onChanged,
}: {
  item: MenuItemWithCosts;
  itemName: string;
  override: ChannelMenuOverride | undefined;
  channel: Channel;
  branchId: string;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const onErr = (e: unknown) => toast.error(getErrorMessage(e));
  const done = () => { onChanged(); toast.success(t("common.savedChanges", "Changes saved")); };
  const upsert = useUpsertChannelOverride({ mutation: { onSuccess: done, onError: onErr } });
  const del = useDeleteChannelOverride({ mutation: { onSuccess: done, onError: onErr } });
  const busy = upsert.isPending || del.isPending;

  return (
    <OverrideCard
      name={itemName}
      imageUrl={item.image_url}
      orgPrice={item.base_price}
      Icon={CupSoda}
      override={override}
      busy={busy}
      saving={upsert.isPending}
      clearing={del.isPending}
      onSave={(priceOverride, available) =>
        upsert.mutate({
          data: {
            branch_id: branchId,
            menu_item_id: item.id,
            channel,
            price_override: priceOverride,
            is_available: available,
          },
        })
      }
      onClear={() => del.mutate({ params: { branch_id: branchId, menu_item_id: item.id, channel } })}
    />
  );
}

function AddonRow({
  addon,
  addonName,
  override,
  channel,
  branchId,
  onChanged,
}: {
  addon: AddonItem;
  addonName: string;
  override: ChannelAddonOverride | undefined;
  channel: Channel;
  branchId: string;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const onErr = (e: unknown) => toast.error(getErrorMessage(e));
  const done = () => { onChanged(); toast.success(t("common.savedChanges", "Changes saved")); };
  const upsert = useUpsertChannelAddonOverride({ mutation: { onSuccess: done, onError: onErr } });
  const del = useDeleteChannelAddonOverride({ mutation: { onSuccess: done, onError: onErr } });
  const busy = upsert.isPending || del.isPending;

  return (
    <OverrideCard
      name={addonName}
      orgPrice={addon.default_price}
      Icon={Tag}
      override={override}
      busy={busy}
      saving={upsert.isPending}
      clearing={del.isPending}
      onSave={(priceOverride, available) =>
        upsert.mutate({
          data: {
            branch_id: branchId,
            addon_item_id: addon.id,
            channel,
            price_override: priceOverride,
            is_available: available,
          },
        })
      }
      onClear={() => del.mutate({ params: { branch_id: branchId, addon_item_id: addon.id, channel } })}
    />
  );
}

export function ChannelOverridesPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const orgId = useOrgId();
  const scope = useScope();
  const branchId = scope.branchId;
  const queryClient = useQueryClient();

  const [tab, setTab] = useState("menu");
  const [channel, setChannel] = useState<Channel>("in_mall");

  const [itemsPage, setItemsPage] = useState(0);
  const [itemsSearch, setItemsSearch] = useState("");
  const itemsSearchQ = useDebounced(itemsSearch, 300);
  const [addonsPage, setAddonsPage] = useState(0);
  const [addonsSearch, setAddonsSearch] = useState("");
  const addonsSearchQ = useDebounced(addonsSearch, 300);

  const on = !!orgId && !!branchId;

  useEffect(() => { setItemsPage(0); }, [itemsSearchQ, channel, branchId]);
  useEffect(() => { setAddonsPage(0); }, [addonsSearchQ, channel, branchId]);

  const catalogParams = useMemo(
    () => ({
      org_id: orgId ?? "",
      search: itemsSearchQ || undefined,
      page: itemsPage + 1,
      per_page: PER_PAGE,
    }),
    [orgId, itemsSearchQ, itemsPage],
  );
  const addonParams = useMemo(
    () => ({
      org_id: orgId ?? "",
      search: addonsSearchQ || undefined,
      page: addonsPage + 1,
      per_page: PER_PAGE,
    }),
    [orgId, addonsSearchQ, addonsPage],
  );

  const catalog = useListMenuCatalog(catalogParams, { query: { enabled: on, placeholderData: keepPreviousData } });
  const addons = useListAddonCatalog(addonParams, { query: { enabled: on, placeholderData: keepPreviousData } });
  const overrides = useListChannelOverrides(
    { branch_id: branchId ?? "", channel },
    { query: { enabled: on } },
  );
  const addonOverrides = useListChannelAddonOverrides(
    { branch_id: branchId ?? "", channel },
    { query: { enabled: on } },
  );

  const items: MenuItemWithCosts[] = catalog.data?.data ?? [];
  const itemsPageCount = catalog.data?.total_pages ?? 0;
  const addonList: AddonItem[] = addons.data?.data ?? [];
  const addonsPageCount = addons.data?.total_pages ?? 0;
  const tname = (m: { name: string; name_translations?: unknown }) => getTranslatedName(m, lang);

  const ovrByItem = useMemo(() => {
    const m = new Map<string, ChannelMenuOverride>();
    for (const o of overrides.data ?? []) m.set(o.menu_item_id, o);
    return m;
  }, [overrides.data]);
  const ovrByAddon = useMemo(() => {
    const m = new Map<string, ChannelAddonOverride>();
    for (const o of addonOverrides.data ?? []) m.set(o.addon_item_id, o);
    return m;
  }, [addonOverrides.data]);

  const refreshItems = () => { void overrides.refetch(); };
  const refreshAddons = () => { void addonOverrides.refetch(); };

  const prefetchNextItems = () => {
    if (itemsPage + 1 >= itemsPageCount) return;
    void queryClient.prefetchQuery(getListMenuCatalogQueryOptions({ ...catalogParams, page: itemsPage + 2 }));
  };
  const prefetchNextAddons = () => {
    if (addonsPage + 1 >= addonsPageCount) return;
    void queryClient.prefetchQuery(getListAddonCatalogQueryOptions({ ...addonParams, page: addonsPage + 2 }));
  };

  if (!orgId) {
    return (
      <Page>
        <PageHeader title={t("delivery.channelsTitle", "Channel overrides")} />
        <EmptyState icon={Store} title={t("delivery.pickOrg", "Select an organization to manage channel overrides")} />
      </Page>
    );
  }

  const pager = (page: number, pageCount: number, setPage: (p: number) => void, prefetchNext: () => void) =>
    pageCount > 1 ? (
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground tabular">
          {t("common.page", { current: page + 1, total: pageCount, defaultValue: `Page ${page + 1} of ${pageCount}` })}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="icon-sm" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label={t("common.previous", "Previous")}>
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page >= pageCount - 1}
            onClick={() => setPage(page + 1)}
            onMouseEnter={prefetchNext}
            onFocus={prefetchNext}
            aria-label={t("common.next", "Next")}
          >
            <ChevronRight className="size-4 rtl:rotate-180" />
          </Button>
        </div>
      </div>
    ) : null;

  const channelSelect = (
    <Select value={channel} onValueChange={(v) => setChannel(v as Channel)}>
      <SelectTrigger className="h-9 w-auto min-w-40"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="in_mall">{t("delivery.inMall", "In-mall delivery")}</SelectItem>
        <SelectItem value="outside">{t("delivery.outside", "Outside delivery")}</SelectItem>
      </SelectContent>
    </Select>
  );

  const searchInput = (value: string, onChange: (v: string) => void) => (
    <div className="relative w-full sm:w-64">
      <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("common.search", "Search…")}
        className="h-9 ps-8"
      />
    </div>
  );

  return (
    <Page>
      <PageHeader
        title={t("delivery.channelsTitle", "Channel overrides")}
        description={t("delivery.channelsSubtitle", "Per-channel price and availability for items and add-ons on this branch.")}
      />
      {!branchId ? (
        <EmptyState
          icon={Store}
          title={t("delivery.pickBranch", "Select a branch in the top bar to manage channel overrides")}
        />
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="gap-4">
          <TabsList>
            <TabsTrigger value="menu">{t("delivery.menuItems", "Menu items")}</TabsTrigger>
            <TabsTrigger value="addons">{t("delivery.addonItems", "Add-on items")}</TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {channelSelect}
              {searchInput(itemsSearch, setItemsSearch)}
            </div>

            {catalog.isLoading || overrides.isLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyState icon={UtensilsCrossed} title={t("delivery.noItems", "No menu items")} />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    itemName={tname(item)}
                    override={ovrByItem.get(item.id)}
                    channel={channel}
                    branchId={branchId}
                    onChanged={refreshItems}
                  />
                ))}
              </div>
            )}

            {pager(itemsPage, itemsPageCount, setItemsPage, prefetchNextItems)}
          </TabsContent>

          <TabsContent value="addons" className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {channelSelect}
              {searchInput(addonsSearch, setAddonsSearch)}
            </div>

            {addons.isLoading || addonOverrides.isLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </div>
            ) : addonList.length === 0 ? (
              <EmptyState icon={Tag} title={t("delivery.noAddons", "No add-ons")} />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {addonList.map((addon) => (
                  <AddonRow
                    key={addon.id}
                    addon={addon}
                    addonName={tname(addon)}
                    override={ovrByAddon.get(addon.id)}
                    channel={channel}
                    branchId={branchId}
                    onChanged={refreshAddons}
                  />
                ))}
              </div>
            )}

            {pager(addonsPage, addonsPageCount, setAddonsPage, prefetchNextAddons)}
          </TabsContent>
        </Tabs>
      )}
    </Page>
  );
}
