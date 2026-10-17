import { describe, expect, it } from "vitest";
import { NAV, isParent } from "@/config/nav";
import { ROUTE_PREFETCH } from "./route-prefetch";

// Every place the sidebar and the command palette can hover.
const targets = NAV.flatMap((g) => g.entries.flatMap((e) => (isParent(e) ? [e.basePath, ...e.children.map((c) => c.to)] : [e.to])));

describe("ROUTE_PREFETCH", () => {
  it.each(targets)("has an entry for nav route %s", (route) => {
    expect(ROUTE_PREFETCH[route], `add "${route}" to its area in src/lib/prefetch/`).toBeTypeOf("function");
  });

  it("has no entry for a route the nav no longer links", () => {
    expect(Object.keys(ROUTE_PREFETCH).filter((r) => !targets.includes(r))).toEqual([]);
  });
});
