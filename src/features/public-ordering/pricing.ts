/**
 * What one line of a menu item costs, as the storefront estimates it while the
 * customer chooses: madar-catalog's rule (`unit_price`, `price_options`,
 * `option_charge`), the one the server prices the order with, called through
 * WebAssembly (the public package). pricing.test.ts runs it against that
 * crate's vectors (src/lib/catalog_vectors.json, pinned to its tag).
 *
 * The rule reads madar-catalog's view of an item (`CatalogView`). The public
 * menu does not send that view, so `storefrontView` builds it from what the
 * menu does send.
 */
import type { DeliveryAddonOption } from "@/data/api/generated/models/deliveryAddonOption";
import type { DeliveryMenuItem } from "@/data/api/generated/models/deliveryMenuItem";
import type { DeliveryOptionPricing } from "@/data/api/generated/models/deliveryOptionPricing";
import { rules, type CatalogView, type ItemView, type OptionView, type PricedOptions, type PriceError, type Selection } from "@/lib/rules";

export type { CatalogView, ItemView, OptionView, PricedOptions, PriceError, Selection };

/**
 * One unit of the item at `size`, before any option; with no size, the "from"
 * price. `null`: no active priced size — the server refuses the line.
 */
export function unitPrice(item: ItemView, size: string | null | undefined): number | null {
  const p = rules.unit_price(item, size);
  return typeof p === "number" ? p : null;
}

/**
 * The options and optional fields of a line, priced without its size: one of
 * each swap family (the last pick), a swap charged over the recipe's own choice.
 */
export const priceOptions = (view: CatalogView, selection: Selection): PricedOptions | PriceError =>
  rules.price_options(view, selection);

/** What `optionId` alone costs on a line at `size`: the figure shown beside it. */
export const optionCharge = (view: CatalogView, size: string | null, optionId: string): number | null =>
  rules.option_charge(view, size, optionId);

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
        ? [{ ingredient_id: milk.addon_item_id, candidates: [{ option_id: milk.addon_item_id, name: milk.name, kind: milk.type, price: milk.price }] }]
        : [],
      optionals: item.optionals,
    },
    options: addons.map((a) => ({
      id: a.addon_item_id,
      name: a.name,
      kind: a.type,
      price: a.price,
      // The menu names no unit; the price rule never reads it.
      ingredients: [{ id: a.addon_item_id, name: a.name, unit: "" }],
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
