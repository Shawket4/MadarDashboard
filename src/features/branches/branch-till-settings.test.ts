import { describe, expect, it } from "vitest";
import { z } from "zod";

// Mirrors the branch dialog's till settings rule (TILLS_CONTRACT §1.2 branches CHECK).
const oldBillHours = z.coerce.number<number>().int().min(1).max(168);

describe("branch till settings", () => {
  it("old bill hours must be 1..168", () => {
    expect(oldBillHours.safeParse("3").success).toBe(true);
    expect(oldBillHours.safeParse(0).success).toBe(false);
    expect(oldBillHours.safeParse(169).success).toBe(false);
  });
});
