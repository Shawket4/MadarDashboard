/**
 * What the combo editor, the deal dialog and the meal section pick from: the
 * org's sellable items (never a combo — C1 "a combo never contains a combo")
 * with their sizes and prices, the categories, and the branches.
 *
 * Sizes come from `GET /menu-items?full=true` (`all_sizes`, which includes the
 * synthetic `one_size` row a single-price item keeps its price on).
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useListBranches, useListCategories, useListMenuItems } from "@/data/api/generated/api";
import type { MenuItemFull } from "@/data/api/generated/models";
import { useOrgId } from "@/hooks/use-org-id";
import { getTranslatedName } from "@/lib/translation";

import { ONE_SIZE } from "@/features/menu/util";

export interface SizeOption {
  label: string;
  price: number;
}

export interface ItemOption {
  id: string;
  name: string;
  category_id: string | null;
  is_active: boolean;
  /** Active sizes, cheapest first; a single-price item has one `one_size` row. */
  sizes: SizeOption[];
}

export interface MenuOptions {
  loading: boolean;
  items: ItemOption[];
  categories: { id: string; name: string }[];
  branches: { id: string; name: string }[];
  item: (id: string | null | undefined) => ItemOption | undefined;
  itemName: (id: string | null | undefined) => string | undefined;
  categoryName: (id: string | null | undefined) => string | undefined;
  branchName: (id: string | null | undefined) => string | undefined;
  itemsOfCategory: (id: string) => ItemOption[];
  /** Every size label an item of this category has (for a category choice). */
  categorySizeLabels: (id: string) => string[];
}

/** The size a combo price covers when the owner didn't name one: the cheapest active. */
export const cheapestSize = (it: ItemOption | undefined): SizeOption | undefined => it?.sizes[0];

/** A size's display label: a single-price item's `one_size` reads as "Standard". */
export const sizeLabelText = (label: string, t: (k: string, d: string) => string): string =>
  label === ONE_SIZE ? t("combos.oneSize", "Standard") : label;

type Kinded = { kind?: string | null };

export function useMenuOptions(enabled = true): MenuOptions {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const orgId = useOrgId() ?? "";
  const on = enabled && !!orgId;
  const itemsQ = useListMenuItems({ org_id: orgId, full: true }, { query: { enabled: on, staleTime: 5 * 60_000 } });
  const catsQ = useListCategories({ org_id: orgId }, { query: { enabled: on, staleTime: 5 * 60_000 } });
  const branchesQ = useListBranches({ org_id: orgId }, { query: { enabled: on, staleTime: 5 * 60_000 } });

  return useMemo(() => {
    const full = (itemsQ.data ?? []) as MenuItemFull[];
    const items: ItemOption[] = full
      .filter((m) => (m as Kinded).kind !== "combo" && !m.deleted_at)
      .map((m) => {
        const rows = (m.all_sizes?.length ? m.all_sizes : m.sizes) ?? [];
        const sizes = rows
          .filter((s) => s.is_active !== false)
          .map((s) => ({ label: s.label, price: s.price_override }))
          .sort((a, b) => a.price - b.price);
        return {
          id: m.id,
          name: getTranslatedName(m, lang),
          category_id: m.category_id ?? null,
          is_active: m.is_active,
          sizes: sizes.length ? sizes : [{ label: ONE_SIZE, price: m.base_price }],
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, lang));
    const byId = new Map(items.map((i) => [i.id, i]));
    const categories = (catsQ.data ?? []).map((c) => ({ id: c.id, name: getTranslatedName(c, lang) }));
    const catById = new Map(categories.map((c) => [c.id, c.name]));
    const branches = (branchesQ.data ?? []).map((b) => ({ id: b.id, name: getTranslatedName(b as { name: string; name_translations?: unknown }, lang) }));
    const branchById = new Map(branches.map((b) => [b.id, b.name]));
    const itemsOfCategory = (id: string) => items.filter((i) => i.category_id === id);
    return {
      loading: itemsQ.isLoading || catsQ.isLoading || branchesQ.isLoading,
      items,
      categories,
      branches,
      item: (id) => (id ? byId.get(id) : undefined),
      itemName: (id) => (id ? byId.get(id)?.name : undefined),
      categoryName: (id) => (id ? catById.get(id) : undefined),
      branchName: (id) => (id ? branchById.get(id) : undefined),
      itemsOfCategory,
      categorySizeLabels: (id) => {
        const labels = new Set<string>();
        for (const it of itemsOfCategory(id)) for (const s of it.sizes) labels.add(s.label);
        return [...labels];
      },
    };
  }, [itemsQ.data, itemsQ.isLoading, catsQ.data, catsQ.isLoading, branchesQ.data, branchesQ.isLoading, lang]);
}
