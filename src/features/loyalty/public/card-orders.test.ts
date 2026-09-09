import { describe, expect, it } from "vitest";

import { newestFirst } from "./card-orders";
import type { PastOrder } from "@/data/api/generated/models/pastOrder";

const order = (id: string, placed_at: string): PastOrder => ({
  id,
  placed_at,
  branch_name: "Zamalek",
  total: 12_500,
  items: ["2 × Latte"],
});

describe("newestFirst", () => {
  it("puts the most recent visit at the top", () => {
    // "My last visit" moving to the bottom is not a subtle bug to a customer,
    // so the order is decided here rather than trusted from the wire.
    const sorted = newestFirst([
      order("a", "2026-09-01T10:00:00Z"),
      order("c", "2026-09-07T10:00:00Z"),
      order("b", "2026-09-04T10:00:00Z"),
    ]);
    expect(sorted.map((o) => o.id)).toEqual(["c", "b", "a"]);
  });

  it("does not mutate what it was given", () => {
    const input = [order("a", "2026-09-01T10:00:00Z"), order("b", "2026-09-04T10:00:00Z")];
    newestFirst(input);
    expect(input.map((o) => o.id)).toEqual(["a", "b"]);
  });
});
