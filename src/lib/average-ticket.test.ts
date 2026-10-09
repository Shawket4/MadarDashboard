// @vitest-environment node
//
// madar-shared's pos_metrics_vectors.json (src/lib, pinned to its tag): every
// window the backend's SQL scenario recorded averages its own net sales over
// its order count as this does; plus the Rust test's own rounding cases.
import { describe, expect, it } from "vitest";

import vectors from "./pos_metrics_vectors.json";
import { averageTicket } from "./average-ticket";

describe("average ticket matches madar-shared's POS metrics", () => {
  it.each(vectors.expected)("$from .. $to", (w) => {
    expect(averageTicket(w.net_sales, w.order_count)).toBe(w.average_ticket);
  });

  it.each([
    [0, 0, 0],
    [1000, 0, 0],
    [1000, -1, 0],
    [5, 2, 3],
    [7, 3, 2],
    [8, 3, 3],
    [-5, 2, -2],
  ])("rounds %i / %i half up to %i", (sales, orders, want) => {
    expect(averageTicket(sales, orders)).toBe(want);
  });
});
