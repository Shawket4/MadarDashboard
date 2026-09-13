import { describe, expect, it } from "vitest";

import { adjustSchema, adjustToWire } from "./adjust-schema";

const base = { branch_id: "b-1", direction: "add" as const, amount: 5, reason: "Missed stamp" };
const issues = (balance: number, v: unknown) => {
  const r = adjustSchema(balance).safeParse(v);
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join(".")}:${i.message}`);
};

describe("a manual adjustment", () => {
  it("accepts a reasoned, whole-number change", () => {
    expect(issues(0, base)).toEqual([]);
  });

  it("requires a reason, trimmed", () => {
    expect(issues(0, { ...base, reason: "   " })).toEqual(["reason:loyalty.errors.adjustReason"]);
    expect(issues(0, { ...base, reason: "ok" })).toEqual(["reason:loyalty.errors.adjustReason"]);
  });

  it.each([0, -2, 1.5, Number.NaN])("refuses an amount of %s", (amount) => {
    expect(issues(10, { ...base, amount })).toContain("amount:loyalty.errors.adjustAmount");
  });

  it("requires a branch", () => {
    expect(issues(0, { ...base, branch_id: "" })).toEqual(["branch_id:loyalty.errors.adjustBranch"]);
  });

  it("refuses a deduction that would take the balance below zero", () => {
    expect(issues(4, { ...base, direction: "deduct", amount: 5 })).toEqual([
      "amount:loyalty.errors.adjustOverdraw",
    ]);
    expect(issues(5, { ...base, direction: "deduct", amount: 5 })).toEqual([]);
    // Adding is never an overdraw, whatever the balance.
    expect(issues(0, { ...base, amount: 500 })).toEqual([]);
  });

  it("sends a signed amount and the reason as the note", () => {
    expect(adjustToWire({ ...base, direction: "deduct", reason: "  Duplicate earn " }, "m-1")).toEqual({
      branch_id: "b-1",
      customer_id: "m-1",
      points: -5,
      note: "Duplicate earn",
    });
    expect(adjustToWire(base, "m-1").points).toBe(5);
  });
});
