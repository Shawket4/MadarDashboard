/**
 * "Teller" on an order means who sold it (TELLER_PICK §3.1): the person picked
 * at checkout (`sold_by`), else whoever was signed in (`teller_id`). With
 * nobody picked, every surface reads exactly as before.
 */
import { render, screen } from "@testing-library/react";
import type { TFunction } from "i18next";
import { describe, expect, it, vi } from "vitest";

import type { Order } from "@/data/api/generated/models";

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: vi.fn(() => false) }));

await import("@/i18n");
const { DataTable } = await import("@/components/app/data-table");
const { sellerName, signedInOther, tellerColumn } = await import("./seller");

const t = ((key: string, fallback?: string) => fallback ?? key) as unknown as TFunction;

const order = (over: Partial<Order> = {}) =>
  ({ id: "o1", teller_id: "u-mona", teller_name: "Mona Adel", sold_by: null, sold_by_name: null, ...over }) as Order;
const picked = order({ sold_by: "u-karim", sold_by_name: "Karim Saleh" });

describe("who sold an order", () => {
  it("is the person picked at checkout", () => {
    expect(sellerName(picked)).toBe("Karim Saleh");
  });

  it("is whoever was signed in when nobody was picked (or the order predates the field)", () => {
    expect(sellerName(order())).toBe("Mona Adel");
    expect(sellerName({ teller_name: "Mona Adel" })).toBe("Mona Adel");
  });
});

describe("the signed-in person, named apart", () => {
  it("only when someone else was picked", () => {
    expect(signedInOther(picked)).toBe("Mona Adel");
  });

  it("not when the signed-in person picked themselves, nor when nobody was picked", () => {
    expect(signedInOther(order({ sold_by: "u-mona", sold_by_name: "Mona Adel" }))).toBeNull();
    expect(signedInOther(order())).toBeNull();
    expect(signedInOther({ teller_id: "u-mona", teller_name: "Mona Adel" })).toBeNull();
  });
});

describe("the orders list's Teller column", () => {
  it("shows the picked name, and the signed-in one when nobody was picked", () => {
    const rows = [picked, order({ id: "o2", teller_name: "Youssef Nabil", teller_id: "u-youssef" })];
    render(<DataTable columns={[tellerColumn(t)]} data={rows} getRowId={(r) => r.id} />);
    expect(screen.getByRole("columnheader", { name: "Teller" })).toBeInTheDocument();
    const cells = screen.getAllByRole("cell").map((c) => c.textContent);
    expect(cells).toEqual(["Karim Saleh", "Youssef Nabil"]);
    expect(screen.queryByText("Mona Adel")).not.toBeInTheDocument();
  });
});
