import { describe, expect, it } from "vitest";

import { customersListParams } from "./queries";

describe("customersListParams", () => {
  it("trims the search, drops empties and starts the window at the top", () => {
    expect(customersListParams({ q: "  sara ", member: undefined, from: null }, 50)).toEqual({
      q: "sara", member: undefined, source: undefined, limit: 50, offset: 0,
    });
    expect(customersListParams({ q: "", member: true, from: "online" }, 100)).toMatchObject({ q: undefined, member: true, source: "online" });
  });
});
