/**
 * Purchase orders remember the last price: a new line's total defaults to the
 * last price paid for the ingredient (the chosen supplier's, else any
 * supplier's) × the quantity, with a hint saying where it came from. A total
 * someone typed is never overwritten, and changing the supplier re-defaults
 * only the untouched lines.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import type { LastPrice } from "@/data/api/generated/models";

// jsdom has no layout: cmdk scrolls the active option into view on open.
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = vi.fn();

const lastPrice = (over: Partial<LastPrice> & Pick<LastPrice, "org_ingredient_id" | "prices">): LastPrice => ({
  source: "supplier",
  supplier_id: "s1",
  supplier_name: "Alpha",
  po_id: "po-1",
  po_status: "received",
  received: true,
  ordered_at: "2026-10-10T10:00:00Z",
  received_at: "2026-10-12T10:00:00Z",
  unit: "kg",
  unit_price: over.prices[0]?.unit_price ?? 0,
  ...over,
});

/** What the server remembers: Alpha sold flour at 45.00/kg; nobody sold
 *  sugar to Alpha; Beta never sold flour, so it falls back to Gamma's 50.00/kg. */
const LAST: Record<string, LastPrice[]> = {
  s1: [lastPrice({ org_ingredient_id: "flour", prices: [{ unit: "g", unit_price: 4.5 }, { unit: "kg", unit_price: 4500 }] })],
  s2: [
    lastPrice({
      org_ingredient_id: "flour",
      source: "any",
      supplier_id: "s3",
      supplier_name: "Gamma",
      prices: [{ unit: "g", unit_price: 5 }, { unit: "kg", unit_price: 5000 }],
    }),
    lastPrice({ org_ingredient_id: "sugar", supplier_id: "s2", supplier_name: "Beta", prices: [{ unit: "g", unit_price: 6 }] }),
  ],
};

const customInstance = vi.fn((config: { url: string; params?: { supplier_id?: string } }) => {
  if (config.url === "/purchasing/orgs/org-1/last-prices") {
    return Promise.resolve(LAST[config.params?.supplier_id ?? ""] ?? []);
  }
  return Promise.resolve({});
});
vi.mock("@/data/api/custom-instance", () => ({ customInstance: (c: never) => customInstance(c) }));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { PurchaseOrderDialog } = await import("./purchase-order-dialog");

const ingredient = (id: string, name: string) =>
  ({ id, name, unit: "g", cost_per_unit: 3, is_active: true, archived_at: null }) as never;
const catalog = [ingredient("flour", "Flour"), ingredient("sugar", "Sugar")];
const suppliers = [
  { id: "s1", name: "Alpha", is_active: true },
  { id: "s2", name: "Beta", is_active: true },
] as never;

function renderDialog() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <PurchaseOrderDialog
        branchId="b1"
        open
        onOpenChange={vi.fn()}
        suppliers={suppliers}
        catalog={catalog}
        prefillSupplierId="s1"
        prefillLines={[
          { org_ingredient_id: "flour", quantity_ordered: 2000 },
          { org_ingredient_id: "sugar", quantity_ordered: 1000 },
        ]}
      />
    </QueryClientProvider>,
  );
}

const hints = () => screen.queryAllByTestId("po-line-last-price");

describe("PurchaseOrderDialog: the last price is the default", () => {
  it("prefills from the supplier's last price, with a hint; no last price keeps the catalog estimate", async () => {
    renderDialog();
    // Flour: 4.5 piastres a gram × 2000 g (the catalog would say 60.00).
    expect(await screen.findByDisplayValue("90.00")).toBeInTheDocument();
    expect(customInstance).toHaveBeenCalledWith(
      expect.objectContaining({ url: "/purchasing/orgs/org-1/last-prices", params: { supplier_id: "s1" } }),
    );
    const [hint] = hints();
    expect(hints()).toHaveLength(1);
    expect(hint).toHaveTextContent(/Last: EGP 0\.045 \/ g · /);
    expect(hint).not.toHaveTextContent("another supplier");
    // Sugar: Alpha never sold it, so the catalog's 3 piastres a gram × 1000 g.
    expect(screen.getByDisplayValue("30.00")).toBeInTheDocument();
  });

  it("never overwrites a typed total; a new supplier re-defaults only the untouched lines", async () => {
    renderDialog();
    await screen.findByDisplayValue("90.00");
    // Type sugar's total by hand.
    fireEvent.change(screen.getByDisplayValue("30.00"), { target: { value: "70" } });
    expect(screen.getByDisplayValue("70")).toBeInTheDocument();

    // Switch the supplier to Beta.
    fireEvent.click(screen.getAllByRole("combobox")[0]);
    fireEvent.click(await screen.findByText("Beta"));

    // Flour (untouched) follows: Beta never sold it, so Gamma's 5 piastres a
    // gram × 2000 g, marked as from another supplier.
    expect(await screen.findByDisplayValue("100.00")).toBeInTheDocument();
    await waitFor(() => expect(hints()[0]).toHaveTextContent("from another supplier"));
    expect(hints()[0]).toHaveTextContent(/Last: EGP 0\.05 \/ g/);
    // Sugar keeps what was typed, though Beta has a last price for it.
    expect(screen.getByDisplayValue("70")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("60.00")).toBeNull();
    // Its hint still says what Beta charged last.
    expect(within(hints()[1]).getByText(/Last: EGP 0\.06 \/ g/)).toBeInTheDocument();
  });

  it("changing the quantity re-defaults an untouched total from the last price", async () => {
    renderDialog();
    fireEvent.change(await screen.findByDisplayValue("2000"), { target: { value: "500" } });
    expect(await screen.findByDisplayValue("22.50")).toBeInTheDocument();
  });
});
