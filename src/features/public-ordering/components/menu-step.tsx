import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { BadgePercent, Clock, Plus, Search, UtensilsCrossed } from "lucide-react";

import { usePublicMenu } from "@/data/api/generated/api";
import type { DeliveryMenu } from "@/data/api/generated/models/deliveryMenu";
import type { DeliveryMenuItem } from "@/data/api/generated/models/deliveryMenuItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fmtMoney } from "@/lib/format";
import { getTranslatedName, getTranslatedDescription } from "@/lib/translation";
import { listItem, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";

import type { Channel, CartLine } from "../types";
import { ItemCustomizer } from "./item-customizer";

interface MenuStepProps {
  branchId: string;
  channel: Channel;
  /** count per menu_item_id, for the little badge on item cards. */
  countByItem: Record<string, number>;
  onAdd: (line: CartLine) => void;
  /** Search query (lifted to the page so the desktop header can drive it). */
  query: string;
  onQueryChange: (q: string) => void;
  /** Desktop 3rd pane: the persistent cart panel (xl+). */
  cartSlot?: ReactNode;
  /** Read-only browse: show the menu (prices) but no add-to-cart / customizer. */
  browseOnly?: boolean;
  /** Browse CTA — leave the preview to choose how to order. */
  onExitBrowse?: () => void;
}

interface Group {
  id: string;
  name: string;
  items: DeliveryMenuItem[];
}

export function MenuStep({ branchId, channel, countByItem, onAdd, query, onQueryChange, cartSlot, browseOnly, onExitBrowse }: MenuStepProps) {
  const { t } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
  const { data, isLoading, isError } = usePublicMenu(branchId, { channel, preview: browseOnly || undefined });
  const channelLabel = channel === "in_mall" ? t("order.channel.inMall", "In-mall") : t("order.channel.outside", "Delivery");

  const [active, setActive] = useState<DeliveryMenuItem | null>(null);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  const groups = useMemo<Group[]>(() => buildGroups(data, lang, query), [data, lang, query]);

  // Desktop category rail: scroll-to on click + a lightweight scrollspy that
  // tracks whichever section sits near the top of the viewport.
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const scrollToCat = (id: string) =>
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });

  useEffect(() => {
    const els = groups
      .map((g) => sectionRefs.current[g.id])
      .filter((el): el is HTMLElement => el != null);
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActiveCat(top.target.getAttribute("data-cat"));
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [groups]);

  if (isLoading) {
    return (
      <div className="grid gap-2.5 md:grid-cols-2 2xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-[84px] w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Empty
        title={t("order.menu.unavailable")}
        hint={t("order.menu.unavailableHint")}
      />
    );
  }

  if (data.items.length === 0) {
    return (
      <Empty
        title={t("order.menu.empty")}
        hint={t("order.menu.emptyHint")}
      />
    );
  }

  const openItem = (item: DeliveryMenuItem) => {
    if (browseOnly) return; // read-only: no customizer / add-to-cart
    setActive(item);
    setCustomizerOpen(true);
  };

  const noResults = query.trim() && groups.every((g) => g.items.length === 0);

  // One fluid 3-pane grid: [rail | menu | cart]. The rail only takes a column
  // when there are multiple categories; the cart column only at xl, and only
  // when a cart slot exists (browse mode has none — don't reserve dead space).
  const showRail = !noResults && groups.length > 1;
  const hasCart = !!cartSlot;
  const gridClass = cn(
    "lg:grid lg:items-start lg:gap-8",
    showRail
      ? hasCart
        ? "lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_24rem]"
        : "lg:grid-cols-[15rem_minmax(0,1fr)]"
      : hasCart
        ? "xl:grid-cols-[minmax(0,1fr)_24rem]"
        : "",
  );

  return (
    <>
      <div className={gridClass}>
        {/* Rail — lg+, only when there are multiple categories */}
        {showRail && (
          <aside className="sticky top-[72px] hidden self-start lg:block">
            <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("order.menu.categories", "Categories")}
            </p>
            <nav className="space-y-1">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => scrollToCat(group.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-start text-sm transition-colors",
                    activeCat === group.id
                      ? "bg-brand/10 font-medium text-brand"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <span className="truncate">
                    {group.id === "__other__" ? t("order.menu.other") : group.name}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums opacity-70">{group.items.length}</span>
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Center column */}
        <div className="min-w-0 space-y-4 lg:space-y-6">
          {/* Browse-only banner: we're closed, this is a read-only preview. */}
          {browseOnly && (
            <div className="flex flex-col gap-3 rounded-2xl border border-brand/30 bg-brand/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <Clock className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-serif text-base font-semibold leading-tight">
                    {t("order.browse.bannerTitle", "We're closed right now")}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {t("order.browse.bannerBody", "You're previewing the menu — ordering reopens when we're back.")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/80">
                    {t("order.browse.priceNote", { channel: channelLabel, defaultValue: "Prices shown for {{channel}}" })}
                  </p>
                </div>
              </div>
              {onExitBrowse && (
                <Button variant="brand" size="sm" className="shrink-0 self-start sm:self-center" onClick={onExitBrowse}>
                  {t("order.browse.exit", "See how to order")}
                </Button>
              )}
            </div>
          )}

          {/* Search — mobile + tablet (xl puts it in the header) */}
          <div className="relative xl:hidden">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={t("order.menu.search")}
              className="ps-9 rounded-full"
              inputMode="search"
            />
          </div>

          {/* Category pills — mobile only (desktop uses the rail) */}
          {!noResults && groups.length > 1 && (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => scrollToCat(group.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    activeCat === group.id
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border/70 bg-card text-muted-foreground",
                  )}
                >
                  {group.id === "__other__" ? t("order.menu.other") : group.name}
                </button>
              ))}
            </div>
          )}

          {/* Channel discount */}
          {data.discount && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm font-semibold text-success">
              <BadgePercent className="size-4" />
              {data.discount.dtype === "percentage"
                ? t("order.menu.discountPct", {
                    defaultValue: "{{value}}% off your order",
                    value: data.discount.value,
                  })
                : t("order.menu.discountFixed", {
                    defaultValue: "{{value}} off your order",
                    value: fmtMoney(data.discount.value),
                  })}
            </div>
          )}

          {/* Sections */}
          {noResults ? (
            <Empty title={t("order.menu.noResults", { query })} />
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <section
                  key={group.id}
                  data-cat={group.id}
                  ref={(el) => {
                    sectionRefs.current[group.id] = el;
                  }}
                  className="scroll-mt-[72px]"
                >
                  <div className="mb-3 flex items-baseline justify-between gap-2">
                    <h2 className="font-serif text-lg leading-tight">
                      {group.id === "__other__" ? t("order.menu.other") : group.name}
                    </h2>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {t("order.menu.itemCount", {
                        count: group.items.length,
                        defaultValue: "{{count}} items",
                      })}
                    </span>
                  </div>
                  <motion.ul
                    variants={staggerContainer(0.03)}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 gap-2.5 md:grid-cols-2 2xl:grid-cols-3"
                  >
                    {group.items.map((item) => (
                      <motion.li key={item.id} variants={listItem} className="h-full">
                        <MenuCard
                          item={item}
                          lang={lang}
                          count={countByItem[item.id] ?? 0}
                          onOpen={() => openItem(item)}
                          browseOnly={browseOnly}
                        />
                      </motion.li>
                    ))}
                  </motion.ul>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Cart — persistent 3rd pane (xl+) */}
        {cartSlot && (
          <aside className="sticky top-[72px] hidden self-start xl:block">{cartSlot}</aside>
        )}
      </div>

      <ItemCustomizer
        item={active}
        addons={data.addons}
        open={customizerOpen}
        onOpenChange={setCustomizerOpen}
        onConfirm={onAdd}
      />
    </>
  );
}

function MenuCard({
  item,
  lang,
  count,
  onOpen,
  browseOnly,
}: {
  item: DeliveryMenuItem;
  lang: string;
  count: number;
  onOpen: () => void;
  browseOnly?: boolean;
}) {
  const { t } = useTranslation();
  const hasSizes = item.sizes.length > 0;
  const minSize = hasSizes
    ? item.sizes.reduce((m, s) => Math.min(m, s.price), Number.POSITIVE_INFINITY)
    : item.price;
  const description = getTranslatedDescription(item, lang);

  const inner = (
    <>
      {item.image_url ? (
        <img
          src={item.image_url}
          alt=""
          className="size-[60px] shrink-0 rounded-xl object-cover"
          loading="lazy"
        />
      ) : (
        <span className="flex size-[60px] shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <UtensilsCrossed className="size-6" />
        </span>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{getTranslatedName(item, lang)}</span>
        {description && (
          <span className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{description}</span>
        )}
        <span className="mt-1 text-sm font-semibold text-brand">
          {hasSizes ? t("order.menu.from", { price: fmtMoney(minSize) }) : fmtMoney(item.price)}
        </span>
      </div>
    </>
  );

  // Browse-only: a non-interactive, price-only card (no add button, no customizer).
  if (browseOnly) {
    return (
      <div className="flex h-full w-full items-center gap-3 rounded-2xl border border-border/70 bg-card p-2.5 text-start shadow-sm">
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group flex h-full w-full items-center gap-3 rounded-2xl border border-border/70 bg-card p-2.5 text-start shadow-sm transition-all",
        "hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md active:translate-y-0",
      )}
    >
      {inner}

      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-sm transition-transform group-hover:scale-105">
        {count > 0 ? (
          <span className="text-xs font-bold tabular-nums">{count}</span>
        ) : (
          <Plus className="size-4" />
        )}
      </span>
    </button>
  );
}

function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/70 px-6 py-12 text-center">
      <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <UtensilsCrossed className="size-6" />
      </span>
      <p className="font-semibold">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

function buildGroups(menu: DeliveryMenu | undefined, lang: string, query: string): Group[] {
  if (!menu) return [];
  const q = query.trim().toLowerCase();
  const match = (item: DeliveryMenuItem) =>
    !q ||
    getTranslatedName(item, lang).toLowerCase().includes(q) ||
    item.name.toLowerCase().includes(q) ||
    (item.description ?? "").toLowerCase().includes(q);

  const byCat = new Map<string, DeliveryMenuItem[]>();
  const uncategorized: DeliveryMenuItem[] = [];
  for (const item of menu.items) {
    if (!match(item)) continue;
    if (item.category_id) {
      const list = byCat.get(item.category_id) ?? [];
      list.push(item);
      byCat.set(item.category_id, list);
    } else {
      uncategorized.push(item);
    }
  }

  const groups: Group[] = [];
  for (const cat of menu.categories) {
    const items = byCat.get(cat.id) ?? [];
    if (items.length > 0) {
      groups.push({ id: cat.id, name: getTranslatedName(cat, lang), items });
    }
  }
  if (uncategorized.length > 0) {
    groups.push({ id: "__other__", name: "", items: uncategorized });
  }
  return groups;
}
