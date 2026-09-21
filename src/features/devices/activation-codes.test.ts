import { describe, expect, it } from "vitest";

import { groupCode } from "./activation-codes";

describe("groupCode", () => {
  it("splits an eight-digit code in two for reading aloud", () => {
    expect(groupCode("40721958")).toBe("4072 1958");
    expect(groupCode("123")).toBe("123");
  });
});
