import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mutate = vi.fn();

vi.mock("@/data/api/generated/api", () => ({
  useReorderCategories: () => ({ mutate, isPending: false }),
}));

await import("@/i18n");
const { CategoryReorderList } = await import("./category-reorder-list");

const CATEGORIES = [
  { id: "c-1", org_id: "org-1", name: "Drinks", name_translations: {}, image_url: null, display_order: 0, is_active: true },
  { id: "c-2", org_id: "org-1", name: "Food", name_translations: {}, image_url: null, display_order: 1, is_active: true },
];

describe("CategoryReorderList", () => {
  it("renders categories in order with drag handles and move buttons", () => {
    render(<CategoryReorderList orgId="org-1" categories={CATEGORIES as never} />);
    const names = screen.getAllByText(/Drinks|Food/).map((el) => el.textContent);
    expect(names).toEqual(["Drinks", "Food"]);
    // Keyboard-accessible fallback: up/down move buttons per row.
    expect(screen.getAllByLabelText("Move up")).toHaveLength(2);
    expect(screen.getAllByLabelText("Move down")).toHaveLength(2);
  });

  it("moving the first row down persists the new order via the reorder endpoint", () => {
    render(<CategoryReorderList orgId="org-1" categories={CATEGORIES as never} />);
    const downButtons = screen.getAllByLabelText("Move down");
    downButtons[0].click();
    expect(mutate).toHaveBeenCalledWith({ data: { org_id: "org-1", ordered_ids: ["c-2", "c-1"] } });
  });

  it("shows an empty state with no categories", () => {
    render(<CategoryReorderList orgId="org-1" categories={[]} />);
    expect(screen.getByText("No categories yet")).toBeInTheDocument();
  });
});
