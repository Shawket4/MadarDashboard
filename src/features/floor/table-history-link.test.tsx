/**
 * A sitting's customer name opens the customer when the sitting says who it
 * was (`customer_id`) and the viewer may see customers; otherwise it is the
 * plain text it always was. Names are invented.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { TableHistory as TableHistoryData, TableSitting } from "@/data/api/generated/models";

const sitting = (over: Partial<TableSitting>): TableSitting =>
  ({ open_ticket_id: "t-1", opened_at: "2026-03-05T18:00:00Z", seated_at: "2026-03-05T18:00:00Z", minutes: 45, status: "settled", total_amount: 12000, guest_count: 2, ...over }) as TableSitting;

let sittings: TableSitting[] = [];
vi.mock("@/data/api/generated/api", () => ({
  useTableHistory: () => ({
    data: { table_id: "tb-1", label: "T1", sittings, total_minor: 0, average_bill_minor: 0, average_minutes: 0, covers: 0, settled_count: 0, turns_per_day_x100: 0, from: "", to: "" } as TableHistoryData,
    isLoading: false,
    isError: false,
  }),
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { TableHistory } = await import("./table-history");

describe("TableHistory — the customer's name", () => {
  it("opens the customer when the sitting carries customer_id and the viewer may see customers", async () => {
    sittings = [sitting({ customer_name: "Sara Ali", customer_id: "c-1" })];
    const open = vi.fn();
    render(<TableHistory tableId="tb-1" customers={{ canOpen: true, open }} />);
    await userEvent.click(screen.getByRole("button", { name: "Sara Ali" }));
    expect(open).toHaveBeenCalledWith("c-1");
  });

  it("stays plain text with no customer_id, without customers.view, or on a surface with no sheet", () => {
    sittings = [sitting({ customer_name: "Sara Ali" })];
    const { unmount } = render(<TableHistory tableId="tb-1" customers={{ canOpen: true, open: vi.fn() }} />);
    expect(screen.getByText("Sara Ali")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    unmount();

    sittings = [sitting({ customer_name: "Sara Ali", customer_id: "c-1" })];
    const second = render(<TableHistory tableId="tb-1" customers={{ canOpen: false, open: vi.fn() }} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    second.unmount();

    render(<TableHistory tableId="tb-1" />);
    expect(screen.getByText("Sara Ali")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("a sitting nobody named still shows its ticket", () => {
    sittings = [sitting({ ticket_ref: "T-104" })];
    render(<TableHistory tableId="tb-1" customers={{ canOpen: true, open: vi.fn() }} />);
    expect(screen.getByText("T-104")).toBeInTheDocument();
  });
});
