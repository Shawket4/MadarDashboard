import { describe, expect, it } from "vitest";
import { keepWhilePaging } from "./keep-while-paging";

const prev = { rows: ["a"] };
const q = (params: Record<string, unknown>) => ({ queryKey: ["/orders", params] });

describe("keepWhilePaging", () => {
  it("keeps the previous result when only the page changed", () => {
    const keep = keepWhilePaging(["/orders", { branch_id: "b", page: 2, per_page: 20 }]);
    expect(keep(prev, q({ branch_id: "b", page: 1, per_page: 20 }))).toBe(prev);
  });

  it("drops it when a filter changed, so the page shows skeletons", () => {
    const keep = keepWhilePaging(["/orders", { branch_id: "b", status: "voided", page: 1, per_page: 20 }]);
    expect(keep(prev, q({ branch_id: "b", page: 1, per_page: 20 }))).toBeUndefined();
  });

  it("drops it across endpoints and when there is no previous query", () => {
    const keep = keepWhilePaging(["/tills", { branch_id: "b", page: 2 }]);
    expect(keep(prev, q({ branch_id: "b", page: 1 }))).toBeUndefined();
    expect(keep(prev, undefined)).toBeUndefined();
  });

  it("pages a load-more list by its window", () => {
    const key = (p: object) => ["/customers", p];
    expect(keepWhilePaging(key({ q: "a", limit: 100 }), "limit")(prev, { queryKey: key({ q: "a", limit: 50 }) })).toBe(prev);
    expect(keepWhilePaging(key({ q: "b", limit: 50 }), "limit")(prev, { queryKey: key({ q: "a", limit: 50 }) })).toBeUndefined();
  });

  it("treats an absent filter and an undefined one as the same list", () => {
    const keep = keepWhilePaging(["/orders", { branch_id: "b", status: undefined, page: 3 }]);
    expect(keep(prev, q({ branch_id: "b", page: 2 }))).toBe(prev);
  });
});
