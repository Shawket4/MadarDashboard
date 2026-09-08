import { describe, expect, it } from "vitest";

import { isComplete } from "./birthday-picker";

describe("isComplete", () => {
  it("treats half a birthday as no birthday", () => {
    // A month with no day greets nobody; a day with no month would greet
    // everybody, twelve times a year. The server refuses the pair too.
    expect(isComplete({ month: 3, day: null })).toBe(false);
    expect(isComplete({ month: null, day: 17 })).toBe(false);
    expect(isComplete({ month: null, day: null })).toBe(false);
    expect(isComplete({ month: 3, day: 17 })).toBe(true);
  });
});
