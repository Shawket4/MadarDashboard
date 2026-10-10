/**
 * B2 / W9 (INV-CNT-041): clearing a counted figure used to send nothing, so
 * the server kept the old figure and finalize used it while the screen said
 * "not counted". The cleared row is now sent as `counted_qty: null` before
 * finalize, so the server un-counts it.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const upsertItems = vi.fn().mockResolvedValue({});
const finalizeStocktake = vi.fn().mockResolvedValue({});
const stocktake = {
  id: "st-1",
  status: "in_progress",
  started_at: "2026-10-10T08:00:00Z",
  variance_threshold_pct: 10,
  scope: { kind: "full" },
  items: [
    { org_ingredient_id: "milk", ingredient_name: "Milk", unit: "ml", category_id: "c", category_name: "Dairy", opening_qty: 1000, book_qty: 1000, unit_cost: null, is_new: false, counted_qty: 990, variance_reason: null },
    { org_ingredient_id: "beans", ingredient_name: "Beans", unit: "g", category_id: "c2", category_name: "Coffee", opening_qty: 500, book_qty: 500, unit_cost: null, is_new: false, counted_qty: null, variance_reason: null },
  ],
};

vi.mock("@tanstack/react-router", () => ({ Link: (p: { children: ReactNode }) => <a>{p.children}</a> }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("@/components/app/confirm-dialog", () => ({ useConfirm: () => vi.fn() }));
vi.mock("@/data/api/generated/api", () => ({
  useGetStocktake: () => ({ data: stocktake, isLoading: false, error: null }),
  useListCatalog: () => ({ data: [] }),
  upsertItems: (...a: unknown[]) => upsertItems(...a),
  finalizeStocktake: (...a: unknown[]) => finalizeStocktake(...a),
  cancelStocktake: vi.fn(),
}));
vi.mock("./lib", async () => ({
  ...(await vi.importActual<typeof import("./lib")>("./lib")),
  invalidateInventory: vi.fn(),
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { CountEditor } = await import("./count-editor");

describe("CountEditor un-count (W9, B2)", () => {
  it("a cleared figure reads not counted and is sent as null before finalize", async () => {
    const onFinalized = vi.fn();
    render(<CountEditor stocktakeId="st-1" onFinalized={onFinalized} onCancelled={vi.fn()} />);
    const milk = screen.getByLabelText("Counted Milk");
    expect(milk).toHaveValue(990);
    expect(screen.getAllByText("not counted")).toHaveLength(1);

    fireEvent.change(milk, { target: { value: "" } });
    expect(screen.getAllByText("not counted")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Review & finalize" }));
    await waitFor(() => expect(finalizeStocktake).toHaveBeenCalledWith("st-1"));
    // Only the row the server held is un-counted; the never-counted one is not sent.
    expect(upsertItems).toHaveBeenCalledWith("st-1", { items: [{ org_ingredient_id: "milk", counted_qty: null }] });
    expect(upsertItems.mock.invocationCallOrder[0]).toBeLessThan(finalizeStocktake.mock.invocationCallOrder[0]);
    expect(onFinalized).toHaveBeenCalledWith("st-1");
  });
});
