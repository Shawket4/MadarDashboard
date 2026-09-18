import { describe, expect, it } from "vitest";
import type { TFunction } from "i18next";

import { discountSchema } from "./util";

const t = ((key: string, def?: string) => def ?? key) as unknown as TFunction;

const parse = (dtype: "percentage" | "fixed", value: number) =>
  discountSchema(t).safeParse({ name: "Staff", dtype, value, is_active: true });

const messages = (r: ReturnType<typeof parse>) =>
  r.success ? [] : r.error.issues.map((i) => i.message);

describe("a discount can never be configured to go negative", () => {
  it("refuses a percentage over 100, and says what the limit means", () => {
    const r = parse("percentage", 150);
    expect(r.success).toBe(false);
    expect(messages(r)[0]).toContain("between 0 and 100");
    // The message explains the ceiling rather than just naming it.
    expect(messages(r)[0]).toContain("free");
  });

  it("allows exactly 100% — a comp is a real thing to configure", () => {
    expect(parse("percentage", 100).success).toBe(true);
  });

  it("refuses a negative value of either type", () => {
    for (const dtype of ["percentage", "fixed"] as const) {
      const r = parse(dtype, -1);
      expect(r.success).toBe(false);
      expect(messages(r)[0]).toContain("less than zero");
    }
  });

  it("allows a fixed amount larger than 100 EGP", () => {
    // The regression this fixes: one flat `.max(MAX_PERCENT)` read as
    // "100 EGP" for a fixed amount, so an ordinary 200 EGP discount was
    // refused by an untranslated "Too big".
    expect(parse("fixed", 200).success).toBe(true);
    expect(parse("fixed", 100000).success).toBe(true);
  });

  it("allows zero — a discount switched off at zero is not an error", () => {
    expect(parse("percentage", 0).success).toBe(true);
    expect(parse("fixed", 0).success).toBe(true);
  });
});
