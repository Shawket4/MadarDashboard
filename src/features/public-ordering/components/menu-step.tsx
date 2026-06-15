import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Plus, Search, UtensilsCrossed } from "lucide-react";

import { usePublicMenu } from "@/data/api/generated/api";
import type { DeliveryMenu } from "@/data/api/generated/models/deliveryMenu";
import type { DeliveryMenuItem } from "@/data/api/generated/models/deliveryMenuItem";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fmtMoney } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";
import { listItem, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";

import type { Channel, CartLine } from "../types";
import { itemBasePrice } from "../utils";
import { ItemCustomizer } from "./item-customizer";

interface MenuStepProps {
  branchId: string;
  channel: Channel;
  /** count per menu_item_id, for the little badge on item cards. */
  countByItem: Record<string, number>;
  onAdd: (line: CartLine) => void;
}

interface Group {
  id: string;
  name: string;
  items: DeliveryMenuItem[];
}

export function MenuStep({ branchId, channel, countByItem, onAdd }: MenuStepProps) {
  const { t } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
  const { data, isLoading, isError } = usePublicMenu(branchId, { channel });

  const [query, setQuery] = useState("");
  const [active, setActive] = useState<DeliveryMenuItem | null>(null);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  const groups = useMemo<Group[]>(() => buildGroups(data, lang, query), [data, lang, query]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
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
    setActive(item);
    setCustomizerOpen(true);
  };

  const noResults = query.trim() && groups.every((g) => g.items.length === 0);

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("order.menu.search")}
          className="ps-9"
          inputMode="search"
        />
      </div>

      {noResults ? (
        <Empty title={t("order.menu.noResults", { query })} />
      ) : (
        groups.map((group) =>
          group.items.length === 0 ? null : (
            <section key={group.id}>
              <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {group.id === "__other__" ? t("order.menu.other") : group.name}
              </h2>
              <motion.ul
                variants={staggerContainer(0.03)}
                initial="hidden"
                animate="show"
                className="space-y-2.5"
              >
                {group.items.map((item) => (
                  <motion.li key={item.id} variants={listItem}>
                    <MenuCard
                      item={item}
                      lang={lang}
                      count={countByItem[item.id] ?? 0}
                      onOpen={() => openItem(item)}
                    />
                  </motion.li>
                ))}
              </motion.ul>
            </section>
          ),
        )
      )}

      <ItemCustomizer
        item={active}
        addons={data.addons}
        open={customizerOpen}
        onOpenChange={setCustomizerOpen}
        onConfirm={onAdd}
      />
    </div>
  );
}

function MenuCard({
  item,
  lang,
  count,
  onOpen,
}: {
  item: DeliveryMenuItem;
  lang: string;
  count: number;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const hasSizes = item.sizes.length > 0;
  const fromPrice = itemBasePrice(item, hasSizes ? item.sizes[0].label : null);
  const minSize = hasSizes
    ? item.sizes.reduce((m, s) => Math.min(m, s.price), Number.POSITIVE_INFINITY)
    : item.price;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group flex w-full items-stretch gap-3 rounded-2xl border border-border/70 bg-card p-3 text-start shadow-sm transition-all",
        "hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md active:translate-y-0",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="truncate font-semibold">{getTranslatedName(item, lang)}</span>
        {item.description && (
          <span className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.description}</span>
        )}
        <span className="mt-1.5 text-sm font-bold text-foreground">
          {hasSizes
            ? t("order.menu.from", { price: fmtMoney(minSize) })
            : fmtMoney(fromPrice)}
        </span>
      </div>

      <div className="relative shrink-0">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            className="size-20 rounded-xl object-cover"
            loading="lazy"
          />
        ) : (
          <span className="flex size-20 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <UtensilsCrossed className="size-6" />
          </span>
        )}
        <span
          className={cn(
            "absolute -bottom-1 -end-1 flex size-7 items-center justify-center rounded-full border-2 border-card shadow-md transition-transform group-hover:scale-110",
            count > 0 ? "bg-brand text-brand-foreground" : "bg-foreground text-background",
          )}
        >
          {count > 0 ? (
            <span className="text-xs font-bold tabular-nums">{count}</span>
          ) : (
            <Plus className="size-4" />
          )}
        </span>
      </div>
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
