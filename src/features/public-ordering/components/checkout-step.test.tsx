/**
 * Online checkout shows what intake will charge: the deals the server applies,
 * then the channel discount on what is left, then the fee.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CartQuote } from "@/data/api/generated/models/cartQuote";
import type { DeliveryMenuItem } from "@/data/api/generated/models/deliveryMenuItem";

import type { CartLine } from "../types";

const { default: i18n } = await import("@/i18n");
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

describe("CheckoutStep with tax: the total is what the order is booked at", () => {
  afterEach(() => void i18n.changeLanguage("en"));
  // 2 × 150 = 300, a deal takes 50, a 10% channel discount 25, a 15.00 fee.
  const renderTaxed = (policy: { tax_rate: number; tax_inclusive: boolean } | null, lang = "en") => {
    void i18n.changeLanguage(lang);
    return render(
      <CheckoutStep
        channel="outside"
        form={emptyForm()}
        onChange={vi.fn()}
        lines={[line]}
        deliveryFee={1500}
        discountAmount={2500}
        quote={quote}
        taxPolicy={policy}
        submitting={false}
        error={null}
        onSubmit={vi.fn()}
      />,
    );
  };

  it("adds exclusive tax as its own line, on the items after the deal and discount, before the fee", () => {
    renderTaxed({ tax_rate: 0.14, tax_inclusive: false });
    // 225.00 × 14% = 31.50; 225 + 31.50 + 15 = 271.50 (intake's figure).
    expect(screen.getByText("Tax (14%)").parentElement?.textContent).toMatch(/31\.50/);
    expect(totalText()).toMatch(/271\.50/);
  });

  it("names inclusive tax under the total without adding it", () => {
    renderTaxed({ tax_rate: 0.14, tax_inclusive: true });
    // 225.00 − round(225.00 / 1.14) = 27.63, already inside 225 + 15 = 240.00.
    expect(screen.queryByText("Tax (14%)")).toBeNull();
    expect(screen.getByText(/Includes .*27\.63.* tax \(14%\)/)).toBeInTheDocument();
    expect(totalText()).toMatch(/240\.00/);
  });

  it("shows no tax line where the branch charges none", () => {
    renderTaxed({ tax_rate: 0, tax_inclusive: false });
    expect(screen.queryByText(/Tax \(/)).toBeNull();
    expect(totalText()).toMatch(/240\.00/);
  });

  it("reads in Arabic", () => {
    renderTaxed({ tax_rate: 0.14, tax_inclusive: false }, "ar");
    expect(screen.getByText("الضريبة (14%)")).toBeInTheDocument();
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
