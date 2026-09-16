import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PreviewResponse } from "../../recipe/modeling-api";

const response: PreviewResponse = {
  size_label: "Can",
  quantity: 1,
  price: {
    base: 15000,
    options: [
      { option_id: "oat", name: "Oat", price_delta: 5500, reason: "swap over Full Cream" },
      { option_id: "caramel", name: "Caramel", price_delta: 3000, reason: "adds" },
    ],
    total: 23500,
  },
  deductions: [
    { ingredient_id: "i1", name: "Oat Milk", category_slug: "milk", quantity: 250, unit: "g", source: "swap", note: "swapped from Full Cream Milk", skipped: false },
    { ingredient_id: "i2", name: "Straw", category_slug: "packaging", quantity: 1, unit: "pcs", source: "packaging", note: "skipped on dine-in", skipped: true },
  ],
  cost: { total: 3840, cost_missing: false, margin_pct: 0.84 },
  warnings: [{ rule: "F4", message: "No milk line" }],
  defaults: { "g-milk": "full" },
};

const customInstance = vi.fn().mockResolvedValue(response);
vi.mock("@/data/api/custom-instance", () => ({ customInstance: (...a: unknown[]) => customInstance(...a) }));

await import("@/i18n");
const { PreviewPanel } = await import("./preview-panel");

const studio = {
  id: "m-1",
  sizes: [{ id: "s1", label: "Can", price: 15000, is_active: true, sort: 0, recipe: [], cost_incomplete: false }],
  options: [],
  modifier_groups: [
    {
      attachment_id: "a", group_id: "g-milk", is_required: true, min: 1, max: 1, name: "Milk", name_translations: null,
      selection_type: "single", sort: 0,
      options: [
        { id: "full", name: "Full Cream", price: 0, included: true, is_active: true, is_default: false, recipe: [], cost_incomplete: false },
        { id: "oat", name: "Oat", price: 5500, included: true, is_active: true, is_default: false, recipe: [], cost_incomplete: false },
      ],
    },
  ],
} as never;

describe("PreviewPanel", () => {
  it("renders the price line, a struck-through skipped packaging row and warnings", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={qc}><PreviewPanel studio={studio} /></QueryClientProvider>);

    expect(await screen.findByTestId("preview-price-line", {}, { timeout: 3000 })).toHaveTextContent("150 + 55 + 30 = 235");
    const straw = screen.getByText(/Straw/).closest("li")!;
    expect(straw).toHaveAttribute("data-skipped", "true");
    expect(straw.querySelector(".line-through")).not.toBeNull();
    expect(within(straw).getByText(/skipped on dine-in/)).toBeInTheDocument();
    expect(screen.getByText("F4")).toBeInTheDocument();
    expect(customInstance).toHaveBeenCalledWith(
      expect.objectContaining({ url: "/menu-items/m-1/preview", method: "POST", data: expect.objectContaining({ quantity: 1, service_mode: "takeaway" }) }),
    );
  });
});
