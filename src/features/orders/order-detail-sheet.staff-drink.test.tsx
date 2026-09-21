/**
 * A staff drink on the order sheet. The server stores the money NET of the
 * comp, so the sheet's job is to show the price the line would have rung at,
 * what the pool took off it, and what was charged — and for the order's totals
 * to still add up from the figures on screen. It must never subtract the comp
 * from a stored figure a second time.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { OrderFull } from "@/data/api/generated/models";
import { fmtMoney } from "@/lib/format";

import { addonNormalTotal, orderStaffComp, staffDrinkLine } from "./staff-drink-lines";

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
const addon = (over: Partial<Item["addons"][number]>): Item["addons"][number] => ({
  id: "a-1",
  order_item_id: "li-1",
  addon_item_id: "ad-1",
  addon_name: "Oat milk",
  name_translations: {},
  quantity: 1,
  unit_price: 0,
  line_total: 0,
  ...over,
});
const line = (over: Partial<Item>): Item =>
  ({
    id: "li-1",
    order_id: "o-1",
    item_name: "Latte",
    name_translations: {},
    size_label: null,
    quantity: 1,
    unit_price: 7000,
    line_total: 7000,
    line_cost: 1800,
    addons: [],
    optionals: [],
    ...over,
  }) as Item;

/**
 * A large latte on the pool. Small is 70.00 (free); large is 85.00, so the size
 * pays 15.00. The required milk pick (20.00) is the default: free. An optional
 * extra shot (25.00) is never free. Charged: 15 + 0 + 25 = 40.00, tax 14% on it.
 */
const staffLatte = line({
  id: "li-1",
  size_label: "Large",
  unit_price: 8500,
  line_total: 1500,
  staff_comp_minor: 9000,
  staff_drink_id: "sd-1",
  addons: [
    addon({ id: "a-1", addon_name: "Whole milk", unit_price: 2000, line_total: 0, staff_comp_minor: 2000 }),
    addon({ id: "a-2", addon_name: "Extra shot", unit_price: 2500, line_total: 2500, staff_comp_minor: 0 }),
  ],
});
const paidCroissant = line({ id: "li-2", item_name: "Croissant", unit_price: 6000, line_total: 6000, staff_comp_minor: 0, staff_drink_id: null });

const staffOrder = {
  id: "o-1",
  order_number: 12,
  status: "completed",
  order_type: "dine_in",
  payments: [],
  payment_legs: [],
  created_at: "2026-09-21T10:00:00Z",
  items: [staffLatte, paidCroissant],
  subtotal: 10000,
  discount_amount: 0,
  tax_amount: 1400,
  delivery_fee: 0,
  total_amount: 11400,
} as unknown as Partial<OrderFull>;

const mount = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <OrderDetailSheet orderId="o-1" open onOpenChange={() => {}} />
    </QueryClientProvider>,
  );

beforeEach(async () => {
  order = { ...staffOrder };
  await i18n.changeLanguage("en");
});
afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("reading a staff drink off a line", () => {
  it("adds the comp back to the net figures, and never takes it off twice", () => {
    expect(staffDrinkLine(staffLatte)).toEqual({ normal: 13000, comp: 9000, charged: 4000 });
    expect(addonNormalTotal(staffLatte.addons[0])).toBe(2000);
    expect(addonNormalTotal(staffLatte.addons[1])).toBe(2500);
  });

  it("counts a priced optional, per unit, as charged", () => {
    const withOptional = line({
      quantity: 2,
      unit_price: 7000,
      line_total: 0,
      staff_comp_minor: 14000,
      staff_drink_id: "sd-2",
      optionals: [{ id: "op-1", order_item_id: "li-1", field_name: "Syrup", name_translations: {}, price: 500 }],
    });
    expect(staffDrinkLine(withOptional)).toEqual({ normal: 15000, comp: 14000, charged: 1000 });
  });

  it("is not a staff drink without a comp or a drink id — including rows from before the fields existed", () => {
    expect(staffDrinkLine(paidCroissant)).toBeNull();
    expect(staffDrinkLine(line({}))).toBeNull();
    expect(orderStaffComp([staffLatte, paidCroissant, line({})])).toBe(9000);
    expect(orderStaffComp(undefined)).toBe(0);
  });
});

describe("OrderDetailSheet — a staff drink", () => {
  it("badges the pooled line only, and shows the comp as a line discount", () => {
    mount();
    expect(screen.getAllByText("Staff drink")).toHaveLength(1);
    const boxes = screen.getAllByTestId("staff-line");
    expect(boxes).toHaveLength(1);
    const box = within(boxes[0]);
    expect(box.getByText("Normal price, with extras").nextElementSibling).toHaveTextContent(fmtMoney(13000));
    expect(box.getByText("Staff drink · given free").nextElementSibling).toHaveTextContent(fmtMoney(-9000));
    expect(box.getByText("Charged").nextElementSibling).toHaveTextContent(fmtMoney(4000));
  });

  it("shows a covered pick at its normal price with what came off, and a paid pick as before", () => {
    mount();
    const covered = screen.getAllByTestId("addon-staff-comp");
    expect(covered).toHaveLength(1);
    expect(covered[0]).toHaveTextContent(fmtMoney(2000));
    expect(covered[0]).toHaveTextContent(`given free ${fmtMoney(-2000)}`);
    expect(screen.getByText(`(${fmtMoney(2500)})`)).toBeInTheDocument();
  });

  it("keeps the order's totals adding up with the comp shown", () => {
    mount();
    const figure = (label: string) => screen.getByText(label).nextElementSibling?.textContent;
    expect(figure("Items at normal price")).toBe(fmtMoney(19000));
    expect(figure("Staff drinks · given free")).toBe(fmtMoney(-9000));
    expect(figure("Subtotal")).toBe(fmtMoney(10000));
    expect(figure("Total")).toBe(fmtMoney(11400));
    // normal − comp = subtotal; subtotal + tax = total; the lines sum to the subtotal.
    expect(19000 - 9000).toBe(10000);
    expect(staffDrinkLine(staffLatte)!.charged + paidCroissant.line_total).toBe(10000);
  });

  it("leaves an ordinary sale exactly as it was", () => {
    order = { ...staffOrder, items: [paidCroissant], subtotal: 6000, tax_amount: 840, total_amount: 6840 };
    mount();
    expect(screen.queryByText("Staff drink")).not.toBeInTheDocument();
    expect(screen.queryByTestId("staff-line")).not.toBeInTheDocument();
    expect(screen.queryByText("Items at normal price")).not.toBeInTheDocument();
  });

  it("reads in Arabic, with every figure isolated from the sentence around it", async () => {
    await i18n.changeLanguage("ar");
    mount();
    expect(i18n.dir()).toBe("rtl");
    expect(screen.getByText("مشروب موظفين")).toBeInTheDocument();
    const box = screen.getByTestId("staff-line");
    expect(box).toHaveTextContent("السعر العادي بالإضافات");
    expect(box).toHaveTextContent("مشروب موظفين · اتقدّم ببلاش");
    expect(box).toHaveTextContent("المدفوع");
    expect(box.querySelectorAll("bdi")).toHaveLength(3);
    expect(screen.getByText("الأصناف بسعرها العادي")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Staff drink|given free|Normal price|Charged/);
  });
});
