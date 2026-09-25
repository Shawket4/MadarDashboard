/**
 * Combos and deals on the order sheet (contract §3.2). The server stores a
 * combo as a money-less header followed by its parts, and a deal's cut is
 * already out of the plain line's `line_total`. The sheet must show the combo
 * once (header figure = parts + surcharges + add-ons), its parts indented under
 * it, the deal as a line note and a summary row — and the summary must still
 * add up to the stored total without taking anything off twice.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { OrderDeal, OrderFull } from "@/data/api/generated/models";
import { fmtMoney } from "@/lib/format";

import { ComboHeaderRow, ComboPartNote, DealLineNote } from "@/features/combos/combo-order-lines";

let order: Partial<OrderFull> = {};

vi.mock("@/data/api/generated/api", () => ({
  useGetOrder: () => ({ data: order, isLoading: false }),
  useListCatalog: () => ({ data: [] }),
  useGetDeliveryOrder: () => ({ data: undefined }),
  useGetCustomer: () => ({ data: undefined }),
}));
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return { ...real, useAuthz: () => real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: [], ask_manager: [], limits: {} }) };
});
vi.mock("@/features/customers/customer-detail-sheet", () => ({ CustomerDetailSheet: () => null }));

const i18n = (await import("@/i18n")).default;
const { OrderDetailSheet } = await import("./order-detail-sheet");

type Item = OrderFull["items"][number];
const line = (over: Partial<Item>): Item =>
  ({
    id: "li",
    order_id: "o-1",
    item_name: "Item",
    name_translations: {},
    size_label: null,
    quantity: 1,
    unit_price: 0,
    line_total: 0,
    line_cost: 0,
    cost_missing: false,
    deductions_snapshot: [],
    line_kind: "item",
    addons: [],
    optionals: [],
    ...over,
  }) as Item;

/**
 * "Lunch deal" ×1 at P = 150.00. Shares 85.71 / 28.58 / 35.71 (sum = P); the
 * latte is Large (+8.00 surcharge) with an oat milk add-on at 15.00.
 * Header figure = 8571 + 2858 + (3571 + 800) + 1500 = 17300.
 */
const header = line({
  id: "h1",
  item_name: "Lunch deal",
  name_translations: { ar: "وجبة الغداء" },
  line_kind: "combo",
  unit_price: 0,
  line_total: 0,
  combo_unit_price: 15000,
});
const burger = line({
  id: "p1",
  item_name: "Burger",
  line_kind: "combo_part",
  combo_line_id: "h1",
  combo_slot_name: "Main",
  unit_price: 11000,
  combo_share: 8571,
  combo_surcharge: 0,
  line_total: 8571,
});
const fries = line({
  id: "p2",
  item_name: "Fries",
  line_kind: "combo_part",
  combo_line_id: "h1",
  combo_slot_name: "Side",
  unit_price: 4000,
  combo_share: 2858,
  combo_surcharge: 0,
  line_total: 2858,
});
const latte = line({
  id: "p3",
  item_name: "Latte",
  size_label: "Large",
  line_kind: "combo_part",
  combo_line_id: "h1",
  combo_slot_name: "Drink",
  unit_price: 8500,
  combo_share: 3571,
  combo_surcharge: 800,
  line_total: 4371,
  addons: [
    {
      id: "a1",
      order_item_id: "p3",
      addon_item_id: "ad-oat",
      addon_name: "Oat milk",
      name_translations: {},
      quantity: 1,
      unit_price: 1500,
      line_total: 1500,
    },
  ] as Item["addons"],
});
/** Two croissants at 60.00; "Any 2 bites" took 20.00 off — already out of line_total. */
const croissant = line({
  id: "c1",
  item_name: "Croissant",
  quantity: 2,
  unit_price: 6000,
  deal_minor: 2000,
  line_total: 10000,
});
const deal: OrderDeal = {
  id: "d1",
  deal_rule_id: "dr1",
  name: "Any 2 bites",
  name_translations: { ar: "أي قطعتين" },
  times: 1,
  discount: 2000,
  discount_server: 2000,
  lines: [{ order_item_id: "c1", units: 2, discount: 2000 }],
};

const COMBO_TOTAL = 8571 + 2858 + 4371 + 1500; // 17300
const SUBTOTAL = COMBO_TOTAL + 10000; // 27300 — what the lines rang at, net of the deal
const TAX = 3822; // 14%
const TOTAL = SUBTOTAL + TAX; // 31122

const comboOrder = {
  id: "o-1",
  order_number: 42,
  status: "completed",
  order_type: "dine_in",
  payments: [],
  payment_legs: [],
  created_at: "2026-09-21T12:00:00Z",
  items: [header, burger, fries, latte, croissant],
  deals: [deal],
  subtotal: SUBTOTAL,
  discount_amount: 0,
  tax_amount: TAX,
  delivery_fee: 0,
  total_amount: TOTAL,
} as unknown as Partial<OrderFull>;

const mount = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <OrderDetailSheet orderId="o-1" open onOpenChange={() => {}} />
    </QueryClientProvider>,
  );

const figure = (label: string) => screen.getByText(label).nextElementSibling?.textContent;

beforeEach(async () => {
  order = { ...comboOrder };
  await i18n.changeLanguage("en");
});
afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("OrderDetailSheet — a combo and a deal", () => {
  it("shows the combo header with its name, quantity and whole figure", () => {
    mount();
    const headers = screen.getAllByTestId("combo-header");
    expect(headers).toHaveLength(1);
    const h = within(headers[0]);
    expect(headers[0]).toHaveTextContent("Lunch deal");
    expect(headers[0]).toHaveTextContent("1 ×");
    expect(h.getByText("Combo")).toBeInTheDocument();
    expect(headers[0]).toHaveTextContent(`${fmtMoney(15000)} each, before extras`);
    expect(h.getByText(fmtMoney(17300))).toBeInTheDocument();
  });

  it("indents the parts under the header with slot, size, upgrade and add-on", () => {
    const { container } = mount();
    const rows = Array.from(container.ownerDocument.querySelectorAll("[data-line-kind]"));
    // Header first, then its parts in slot order, then the plain line.
    expect(rows.map((r) => r.getAttribute("data-line-kind"))).toEqual(["combo", "combo_part", "combo_part", "combo_part", "item"]);

    const parts = rows.filter((r) => r.getAttribute("data-line-kind") === "combo_part") as HTMLElement[];
    for (const p of parts) expect(p.className).toMatch(/\bms-3\b/);

    expect(parts[0]).toHaveTextContent("Burger");
    expect(within(parts[0]).getByTestId("combo-part-note")).toHaveTextContent(/^Main$/);
    expect(parts[1]).toHaveTextContent("Fries");
    expect(within(parts[1]).getByTestId("combo-part-note")).toHaveTextContent(/^Side$/);

    const lat = within(parts[2]);
    expect(lat.getByText("(Large)")).toBeInTheDocument();
    expect(lat.getByTestId("combo-part-note")).toHaveTextContent(`Drink · +${fmtMoney(800)} upgrade`);
    expect(parts[2]).toHaveTextContent("+ Oat milk");
    expect(lat.getByText(`(${fmtMoney(1500)})`)).toBeInTheDocument();

    // A part's figure is its share (muted), not a top-level bold price; parts carry no deal note.
    const latteFigure = lat.getByText(fmtMoney(4371));
    expect(latteFigure.className).toMatch(/text-muted-foreground/);
    expect(latteFigure.className).not.toMatch(/font-semibold/);
    for (const p of parts) expect(within(p).queryByTestId("deal-line-note")).not.toBeInTheDocument();
    // The header itself is not repeated as a priced plain line.
    expect(screen.getAllByText("Lunch deal")).toHaveLength(1);
  });

  it("notes the deal on its line and lists it in the summary with its discount", () => {
    const { container } = mount();
    const plain = container.ownerDocument.querySelector('[data-line-kind="item"]') as HTMLElement;
    expect(plain).toHaveTextContent("Croissant");
    expect(within(plain).getByTestId("deal-line-note")).toHaveTextContent(`Any 2 bites · ${fmtMoney(-2000)}`);
    expect(within(plain).getByText(fmtMoney(10000))).toBeInTheDocument();
    expect(screen.getAllByTestId("deal-line-note")).toHaveLength(1);
    expect(figure("Any 2 bites")).toBe(fmtMoney(-2000));
  });

  it("keeps the summary adding up to the stored total", () => {
    mount();
    expect(figure("Items at normal price")).toBe(fmtMoney(29300));
    expect(figure("Subtotal")).toBe(fmtMoney(SUBTOTAL));
    expect(figure("Tax")).toBe(fmtMoney(TAX));
    expect(figure("Total")).toBe(fmtMoney(TOTAL));
    // normal − deal = subtotal; the shown line figures (combo header + croissant) = subtotal.
    expect(29300 - 2000).toBe(SUBTOTAL);
    expect(COMBO_TOTAL + croissant.line_total).toBe(SUBTOTAL);
  });

  it("reads in Arabic: the combo's Arabic name, the Arabic deal name and labels", async () => {
    await i18n.changeLanguage("ar");
    mount();
    expect(i18n.dir()).toBe("rtl");
    const h = screen.getByTestId("combo-header");
    expect(h).toHaveTextContent("وجبة الغداء");
    expect(h).not.toHaveTextContent("Lunch deal");
    expect(within(h).getByText("كومبو")).toBeInTheDocument();
    expect(h).toHaveTextContent("للواحد، قبل الإضافات");
    expect(screen.getByTestId("deal-line-note")).toHaveTextContent(`أي قطعتين · ${fmtMoney(-2000)}`);
    expect(figure("أي قطعتين")).toBe(fmtMoney(-2000));
    expect(within(screen.getAllByTestId("combo-part-note")[2]).getByText(/ترقية/)).toBeInTheDocument();
    expect(screen.getByText("الأصناف بسعرها العادي")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Any 2 bites|Lunch deal|upgrade|before extras/);
  });
});

describe("combo-order-lines components", () => {
  it("ComboPartNote shows nothing extra without a surcharge, and the upgrade alone without a slot", () => {
    const { rerender } = render(<ComboPartNote line={{ combo_slot_name: "Side", combo_surcharge: 0 }} />);
    expect(screen.getByTestId("combo-part-note")).toHaveTextContent(/^Side$/);
    rerender(<ComboPartNote line={{ combo_slot_name: null, combo_surcharge: 500 }} />);
    expect(screen.getByTestId("combo-part-note")).toHaveTextContent(`+${fmtMoney(500)} upgrade`);
    expect(screen.getByTestId("combo-part-note").textContent).not.toContain("·");
  });

  it("DealLineNote renders nothing without a cut, and a generic label when the deal is missing", () => {
    const { container, rerender } = render(<DealLineNote line={{ id: "x", deal_minor: 0 }} deals={[deal]} lang="en" />);
    expect(container).toBeEmptyDOMElement();
    rerender(<DealLineNote line={{ id: "x", deal_minor: 300 }} deals={[deal]} lang="en" />);
    expect(screen.getByTestId("deal-line-note")).toHaveTextContent(`Deal · ${fmtMoney(-300)}`);
  });

  it("ComboHeaderRow omits the per-unit line when P is unknown and shows notes", () => {
    render(
      <ComboHeaderRow
        line={{ id: "h", item_name: "Lunch deal", quantity: 2, combo_unit_price: null, notes: "no onions" }}
        total={30000}
        lang="en"
      />,
    );
    const h = screen.getByTestId("combo-header");
    expect(h).toHaveTextContent("2 ×");
    expect(h).not.toHaveTextContent("each, before extras");
    expect(h).toHaveTextContent("no onions");
    expect(within(h).getByText(fmtMoney(30000))).toBeInTheDocument();
  });
});
