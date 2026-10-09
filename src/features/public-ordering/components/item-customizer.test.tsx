/**
 * The item sheet on the QR and online pages: which add-ons an item offers.
 * An item that lists ANY modifier group has its add-ons set — after "detach
 * all" it keeps only its own empty Options group — and then offers exactly
 * what its groups hold: nothing, never the org's whole add-on catalog, and no
 * "Show all add-ons". Only an item never set up in the unified model keeps the
 * legacy allowlist view with its "show all".
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DeliveryAddonOption } from "@/data/api/generated/models/deliveryAddonOption";
import type { DeliveryMenuItem } from "@/data/api/generated/models/deliveryMenuItem";

// The real i18n instance, so the words are the shipped ones.
await import("@/i18n");
const { ItemCustomizer } = await import("./item-customizer");
const { lineUnitPrice } = await import("../utils");

/** The org's add-on catalog: what a fallback would (wrongly) offer. */
const CATALOG: DeliveryAddonOption[] = [
  { addon_item_id: "oat", name: "Oat milk", name_translations: {}, price: 1500, type: "milk_type", is_available: true },
  { addon_item_id: "shot", name: "Extra shot", name_translations: {}, price: 1000, type: "extra", is_available: true },
  { addon_item_id: "syrup", name: "Vanilla syrup", name_translations: {}, price: 800, type: "extra", is_available: true },
];

const group = (name: string, options: { option_id: string; name: string; price: number }[]) => ({
  group_id: `g-${name}`,
  name,
  name_translations: {},
  selection_type: "multi",
  min_selections: 0,
  max_selections: null,
  is_required: false,
  addon_type: "extra",
  options: options.map((o) => ({ ...o, name_translations: {} })),
});

const item = (over: Partial<DeliveryMenuItem>): DeliveryMenuItem =>
  ({
    id: "croissant",
    kind: "item",
    name: "Croissant",
    name_translations: {},
    description: null,
    category_id: "c-1",
    price: 4500,
    sizes: [],
    optionals: [],
    allowed_addon_ids: [],
    modifier_groups: [],
    ...over,
  }) as DeliveryMenuItem;

const open = (it: DeliveryMenuItem) =>
  render(<ItemCustomizer item={it} addons={CATALOG} open onOpenChange={() => {}} onConfirm={vi.fn()} />);

const catalogShown = () => CATALOG.filter((a) => screen.queryByText(a.name) !== null).map((a) => a.name);

describe("ItemCustomizer — an item's add-ons", () => {
  it("an item whose groups hold nothing offers no add-ons, and no way to all of them", () => {
    // Its own Options group, empty: every group was detached.
    open(item({ modifier_groups: [group("Options", [])] }));
    expect(catalogShown()).toEqual([]);
    expect(screen.queryByRole("button", { name: /Show all add-ons/ })).toBeNull();
  });

  it("an item whose groups hold options offers exactly those, with no 'show all'", () => {
    open(item({ modifier_groups: [group("Extras", [{ option_id: "shot", name: "Extra shot", price: 1000 }])] }));
    expect(catalogShown()).toEqual(["Extra shot"]);
    expect(screen.queryByRole("button", { name: /Show all add-ons/ })).toBeNull();
  });

  it("an item never set up in the unified model keeps its allowlist and 'show all'", () => {
    open(item({ allowed_addon_ids: ["syrup"] }));
    expect(catalogShown()).toEqual(["Vanilla syrup"]);
    expect(screen.getByRole("button", { name: /Show all add-ons/ })).toBeInTheDocument();
  });
});

describe("ItemCustomizer — what it charges (madar-catalog's rule, ../pricing.ts)", () => {
  const coffee = (id: string, name: string, price: number): DeliveryAddonOption => ({
    addon_item_id: id,
    name,
    name_translations: {},
    price,
    type: "coffee_type",
    is_available: true,
  });
  const latte = item({
    id: "latte",
    name: "Latte",
    price: 3500,
    sizes: [
      { label: "Small", price: 3000 },
      { label: "Large", price: 4000 },
    ],
    allowed_addon_ids: ["decaf", "colombian"],
  });

  it("says 'from' what a sizeless line costs — the item's price — not the cheapest size", () => {
    render(<ItemCustomizer item={latte} addons={[]} open onOpenChange={() => {}} onConfirm={vi.fn()} />);
    expect(screen.getByText(/^from /)).toHaveTextContent(/35\.00/);
  });

  it("keeps one coffee — the last picked — as the server will", () => {
    const onConfirm = vi.fn();
    const addons = [coffee("decaf", "Decaf", 500), coffee("colombian", "Colombian", 200)];
    render(<ItemCustomizer item={latte} addons={addons} open onOpenChange={() => {}} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText("Decaf"));
    fireEvent.click(screen.getByText("Colombian"));
    fireEvent.click(screen.getByRole("button", { name: /^Add ·/ }));
    const line = onConfirm.mock.calls[0][0];
    expect(line.addons.map((a: { addon_item_id: string; quantity: number; price: number }) => [a.addon_item_id, a.quantity, a.price])).toEqual([
      ["colombian", 1, 200],
    ]);
    expect(lineUnitPrice(line)).toBe(3000 + 200);
  });
});
