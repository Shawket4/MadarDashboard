import { describe, expect, it } from "vitest";

import vectors from "@/lib/menu_order_vectors.json";
import { inMenuOrder } from "./menu-order";

type Case = { name: string; locale: string; categories: { id: string; name: string }[]; expected: string[] };

describe("inMenuOrder (madar-catalog order, menu_order_vectors.json)", () => {
  it.each((vectors.categories as Case[]).map((c) => [c.name, c] as const))("%s", (_, c) => {
    expect(inMenuOrder(c.categories, c.locale).map((x) => x.id)).toEqual(c.expected);
  });

  it("keeps every field of the caller's categories", () => {
    const cats = [
      { id: "b", name: "B", display_order: 1, image_url: "x" },
      { id: "a", name: "A", display_order: 0, image_url: null },
    ];
    expect(inMenuOrder(cats, "en")).toEqual([cats[1], cats[0]]);
  });
});
