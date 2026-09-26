/**
 * Online checkout shows what intake will charge: the deals the server applies,
 * then the channel discount on what is left, then the fee.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CartQuote } from "@/data/api/generated/models/cartQuote";
import type { DeliveryMenuItem } from "@/data/api/generated/models/deliveryMenuItem";

import type { CartLine } from "../types";

await import("@/i18n");
const { CheckoutStep, emptyForm } = await import("./checkout-step");

const brownie = { id: "b", kind: "item", name: "Brownies", name_translations: {}, price: 15000, sizes: [] } as unknown as DeliveryMenuItem;
const line: CartLine = { uid: "l", item: brownie, size_label: null, base_price: 15000, quantity: 2, addons: [], optionals: [], notes: null };

const quote: CartQuote = {
  lines: [{ index: 0, quantity: 2, unit_price: 15000, line_total: 30000, deal_minor: 5000 }],
  items_total: 30000,
  deals: [{ deal_rule_id: "d", name: "Any 2 bakes for 250", name_translations: {}, times: 1, discount: 5000, lines: [] }],
  deal_discount: 5000,
  total_after_deals: 25000,
};

const renderCheckout = (q: CartQuote | null) =>
  render(
    <CheckoutStep
      channel="pickup"
      form={emptyForm()}
      onChange={vi.fn()}
      lines={[line]}
      deliveryFee={0}
      quote={q}
      submitting={false}
      error={null}
      onSubmit={vi.fn()}
    />,
  );

const totalText = () => screen.getByText("Total").parentElement?.textContent ?? "";

describe("CheckoutStep with deals", () => {
  it("shows the deal row and charges the total after it", () => {
    renderCheckout(quote);
    expect(screen.getByText(/Deal · Any 2 bakes for 250/)).toBeInTheDocument();
    expect(totalText()).toMatch(/250\.00/);
  });

  it("without a quote, falls back to the estimate", () => {
    renderCheckout(null);
    expect(screen.queryByText(/Deal ·/)).toBeNull();
    expect(totalText()).toMatch(/300\.00/);
  });
});

describe("CheckoutStep validation", () => {
  it("toasts the first problem, so a customer at the bottom of the form sees it", async () => {
    const sonner = await import("sonner");
    const spy = vi.spyOn(sonner.toast, "error");
    const onSubmit = vi.fn();
    render(
      <CheckoutStep
        channel="outside"
        form={emptyForm()}
        onChange={vi.fn()}
        lines={[line]}
        deliveryFee={0}
        quote={null}
        submitting={false}
        error={null}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /place order/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledOnce();
    const [message, opts] = spy.mock.calls[0]!;
    expect(message).toBe(screen.getAllByText(message as string)[0]!.textContent);
    expect(opts).toMatchObject({ description: "Other fields need attention too." });
  });
});
