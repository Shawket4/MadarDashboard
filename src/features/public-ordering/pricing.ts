/**
 * What one line of a menu item costs, as the storefront estimates it while the
 * customer chooses: a copy of madar-catalog's rule (crates/madar-catalog/src/
 * price.rs — `unit_price` and `price_options`), the one the server prices the
 * order with. pricing.test.ts runs it against that crate's vectors
 * (src/lib/catalog_vectors.json, pinned to its tag), so the two cannot drift.
 *
 * The rule reads madar-catalog's view of an item (`CatalogView`). The public
 * menu does not send that view, so `storefrontView` builds it from what the
 * menu does send.
 */
import type { DeliveryAddonOption } from "@/data/api/generated/models/deliveryAddonOption";
import type { DeliveryMenuItem } from "@/data/api/generated/models/deliveryMenuItem";
import type { DeliveryOptionPricing } from "@/data/api/generated/models/deliveryOptionPricing";

/** An item and the options a line may pick (madar-catalog `view.rs`). */
export interface CatalogView {
  item: ItemView;
  options: OptionView[];
}

export interface ItemView {
  id: string;
  /** The branch's item price: a sizeless line's price, and the fallback for a size no longer sold. */
  branch_price?: number | null;
  sizes: { label: string; price?: number | null; is_active: boolean; branch_price?: number | null }[];
  default_recipe_size?: string | null;
  recipe?: { size_label: string; category?: string | null; ingredient_id?: string | null }[];
  /** Per recipe ingredient, the options carrying it: a swap is charged over the first of its family. */
  bases?: { ingredient_id: string; candidates: BaseCandidate[] }[];
  optionals?: { id: string; price: number; size_label?: string | null }[];
}

interface BaseCandidate {
  option_id: string;
  kind: string;
  price: number;
  group_id?: string | null;
  swap_category_id?: string | null;
}

interface IngredientLine {
  id?: string | null;
  name: string;
}

export interface OptionView {
  id: string;
  /** The add-on type: `milk_type`, `coffee_type`, `extra`, … */
  kind: string;
  price: number;
  group_id?: string | null;
  /** The group's effect: `none` | `adds` | `swaps`. */
  effect?: string | null;
  swap_category_id?: string | null;
  swap_category_slug?: string | null;
  replaces?: { id: string } | null;
  ingredients?: IngredientLine[];
  sized?: { size_label: string; id: string; name: string }[];
}

export interface Selection {
  size_label?: string | null;
  /** In the order they were picked. */
  options?: { id: string; quantity?: number }[];
  optionals?: string[];
}

export type PriceError = { error: "no_priced_size" } | { error: "unknown_option"; id: string };

export interface PricedOptions {
  /** As charged: one of each swap family (the last pick), in the order picked. */
  options: { id: string; quantity: number; unit_price: number }[];
  optionals: { id: string; price: number }[];
  /** Σ unit_price × quantity, per unit of the line. */
  option_total: number;
  optional_total: number;
}

/**
 * One unit of the item at `size`, before any option: the size's branch price,
 * else its catalogue price while active, else the branch's item price, else
 * the lowest active size price. With no size, that last fallback (the "from"
 * price). `null`: no active priced size — the server refuses the line.
 */
export function unitPrice(item: ItemView, size: string | null | undefined): number | null {
  const active = item.sizes.flatMap((s) => (s.is_active && s.price != null ? [s.price] : []));
  if (active.length === 0) return null;
  const fallback = item.branch_price ?? Math.min(...active);
  if (size == null) return fallback;
  return (
    item.sizes.find((s) => s.label === size)?.branch_price ??
    item.sizes.find((s) => s.label === size && s.is_active)?.price ??
    fallback
  );
}

/** What an option swaps: an explicit swap group's category, else the legacy milk / coffee type. */
function swapTarget(o: OptionView): { slug: string; category_id: string | null; family: string } | null {
  // The magic families keep their type as the key, so explicit and inferred milk collapse together.
  const familyOf = (slug: string, fallback: string) =>
    slug === "milk" ? "milk_type" : slug === "coffee_bean" ? "coffee_type" : fallback;
  if (o.effect === "swaps" && o.swap_category_id != null && o.swap_category_slug != null) {
    const slug = o.swap_category_slug;
    return { slug, category_id: o.swap_category_id, family: familyOf(slug, `category:${o.swap_category_id}`) };
  }
  const slug = o.kind === "milk_type" ? "milk" : o.kind === "coffee_type" ? "coffee_bean" : null;
  return slug ? { slug, category_id: null, family: familyOf(slug, "") } : null;
}

const byBytes = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** The option's ingredient lines at `size`: a per-size line replaces the generic one for its ingredient. */
function optionLines(o: OptionView, size: string | null | undefined): IngredientLine[] {
  const generic = o.ingredients ?? [];
  const sized = size == null ? [] : (o.sized ?? []).filter((s) => s.size_label === size);
  if (sized.length === 0) return generic;
  const same = (a: IngredientLine, b: IngredientLine) => a.id != null && a.id === b.id;
  const out: IngredientLine[] = generic.map((g) => sized.find((s) => same(s, g)) ?? g);
  for (const s of sized) if (!out.some((l) => same(l, s))) out.push(s);
  // The server's order (name, then id with none first): a multi-line swap reads its first line.
  return out.sort((a, b) => byBytes(a.name, b.name) || (a.id == null ? (b.id == null ? 0 : -1) : b.id == null ? 1 : byBytes(a.id, b.id)));
}

/**
 * The options and optional fields of a line, priced without its size. A drink
 * has ONE milk and ONE coffee: of two picks of one swap family only the last
 * is kept, at quantity 1 (when the line picks more than one option). A swap is
 * charged its price over the recipe's own choice, floored at 0; the recipe's
 * own ingredient is free.
 */
export function priceOptions(view: CatalogView, selection: Selection): PricedOptions | PriceError {
  const size = selection.size_label ?? null;
  const optionOf = (id: string) => view.options.find((o) => o.id === id);
  const sel = (selection.options ?? []).map((p) => ({ id: p.id, quantity: p.quantity ?? 1 }));

  let picks = sel;
  if (sel.length >= 2) {
    const families = sel.map((p) => {
      const o = optionOf(p.id);
      return (o && swapTarget(o)?.family) ?? null;
    });
    picks = sel.flatMap((p, i) => {
      const f = families[i];
      if (f != null && families.slice(i + 1).includes(f)) return [];
      return [{ id: p.id, quantity: f != null ? 1 : p.quantity }];
    });
  }

  const recipeSize = size ?? view.item.default_recipe_size ?? "one_size";
  const baseLines = (view.item.recipe ?? []).filter((r) => r.size_label === recipeSize);
  // Categories a swap has already replaced: a later swap of one finds no recipe line of its own.
  const swapped: string[] = [];

  const options: PricedOptions["options"] = [];
  for (const pick of picks) {
    const o = optionOf(pick.id);
    if (!o) return { error: "unknown_option", id: pick.id };
    const charged = { id: o.id, quantity: Math.max(pick.quantity, 1), unit_price: o.price };
    options.push(charged);
    const target = swapTarget(o);
    if (!target) continue;
    const lines = optionLines(o, size);
    const base = swapped.includes(target.slug)
      ? null
      : (baseLines.find((r) => r.category === target.slug)?.ingredient_id ?? null);
    // What it puts in the cup: an explicit swap names it; otherwise its first ingredient line.
    const replacement =
      target.category_id != null && o.replaces ? { id: o.replaces.id } : lines[0] ? { id: lines[0].id ?? null } : null;
    if (base != null && replacement?.id != null && replacement.id === base) {
      charged.unit_price = 0;
    } else if (replacement) {
      // Over the recipe's own choice: the first option of the family carrying its ingredient, own group first.
      const candidates = base == null ? [] : (view.item.bases?.find((b) => b.ingredient_id === base)?.candidates ?? []);
      const fits = (c: BaseCandidate) =>
        target.category_id == null ? c.kind === o.kind : c.swap_category_id === target.category_id;
      const fitting = candidates.filter(fits);
      const over = fitting.find((c) => c.group_id != null && c.group_id === o.group_id) ?? fitting[0];
      charged.unit_price = Math.max(o.price - (over?.price ?? 0), 0);
      if (baseLines.some((r) => r.category === target.slug) && !swapped.includes(target.slug)) swapped.push(target.slug);
    }
  }

  const optionals: PricedOptions["optionals"] = [];
  for (const id of selection.optionals ?? []) {
    const f = view.item.optionals?.find((x) => x.id === id);
    if (f && (f.size_label == null || f.size_label === size)) optionals.push({ id: f.id, price: f.price });
  }

  return {
    options,
    optionals,
    option_total: options.reduce((s, o) => s + o.unit_price * o.quantity, 0),
    optional_total: optionals.reduce((s, o) => s + o.price, 0),
  };
}

/** What `optionId` alone costs on a line at `size`: the figure shown beside it. */
export function optionCharge(view: CatalogView, size: string | null, optionId: string): number | null {
  const priced = priceOptions(view, { size_label: size, options: [{ id: optionId }] });
  return "error" in priced ? null : (priced.options[0]?.unit_price ?? null);
}

/**
 * The item as madar-catalog reads it, from the public menu: its sizes come
 * already branch-priced and active, and its price is the branch's item price
 * (else the lowest active size's — the server keeps `base_price` so).
 */
export const storefrontItem = (item: DeliveryMenuItem): ItemView => ({
  id: item.id,
  branch_price: item.price,
  sizes: item.sizes.map((s) => ({ label: s.label, price: s.price, is_active: true })),
});

/**
 * The line's view. The menu sends the server's own views (`item.pricing`,
 * `option_pricing`: the recipe's swap lines and their bases, the options),
 * so a swap is charged over the drink's own beans or milk exactly as the order
 * is. A menu from an older server sends neither: then the view is rebuilt from
 * what the menu shows — its milk is `default_milk_addon_id`'s, and each other
 * option stands for an ingredient of its own (a coffee charged in full).
 */
export function storefrontView(
  item: DeliveryMenuItem,
  addons: DeliveryAddonOption[],
  size: string | null,
  optionPricing?: DeliveryOptionPricing[] | null,
): CatalogView {
  if (item.pricing && optionPricing?.length) {
    return { item: item.pricing as unknown as ItemView, options: optionPricing.map((p) => p.view as unknown as OptionView) };
  }
  const milk = addons.find((a) => a.addon_item_id === item.default_milk_addon_id);
  return {
    item: {
      ...storefrontItem(item),
      recipe: milk ? [{ size_label: size ?? "one_size", category: "milk", ingredient_id: milk.addon_item_id }] : [],
      bases: milk
        ? [{ ingredient_id: milk.addon_item_id, candidates: [{ option_id: milk.addon_item_id, kind: milk.type, price: milk.price }] }]
        : [],
      optionals: item.optionals,
    },
    options: addons.map((a) => ({
      id: a.addon_item_id,
      kind: a.type,
      price: a.price,
      ingredients: [{ id: a.addon_item_id, name: a.name }],
    })),
  };
}

/** A channel's own price for an option: online intake charges it instead of the rule's charge. */
export const channelPrices = (optionPricing?: DeliveryOptionPricing[] | null): Map<string, number> =>
  new Map(
    (optionPricing ?? []).flatMap((p) =>
      p.channel_price == null ? [] : [[(p.view as unknown as OptionView).id, p.channel_price] as const],
    ),
  );
