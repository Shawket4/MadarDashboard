import { describe, expect, it } from "vitest";

import vectors from "./phone_vectors.json";
import { canonicalPhone, formatPhoneDisplay, formatPhoneInput, isValidPhone, phoneSchema, samePhone } from "./phone";

const RULE_CONFLICTS = ["010012345"];

describe("canonicalPhone — the shared vectors", () => {
  it.each(vectors.valid as [string, string][])("%s → %s", (raw, canonical) => {
    expect(canonicalPhone(raw)).toBe(canonical);
    expect(isValidPhone(raw)).toBe(true);
  });

  it.each(vectors.invalid.filter((v) => !RULE_CONFLICTS.includes(v)).map((v) => [v]))("refuses %j", (raw) => {
    expect(canonicalPhone(raw)).toBeNull();
    expect(isValidPhone(raw)).toBe(false);
  });

  /**
   * `010012345` is listed invalid, but the file's own written rule — and the
   * backend's `normalize_phone` today — make it `2010012345`: ten digits, inside
   * [10,15]. The rule is implemented as written; the vector is reported upstream
   * rather than edited here. This pins the disagreement to exactly one vector,
   * and fails the day either side changes so the exemption cannot outlive it.
   */
  it("disagrees with the vectors on exactly one known entry", () => {
    const disagreeing = vectors.invalid.filter((v) => canonicalPhone(v) !== null);
    expect(disagreeing).toEqual(RULE_CONFLICTS);
    expect(canonicalPhone("010012345")).toBe("2010012345");
  });

  it("is idempotent on every canonical form", () => {
    for (const [, canonical] of vectors.valid as [string, string][]) {
      expect(canonicalPhone(canonical)).toBe(canonical);
    }
  });

  it("refuses null and undefined", () => {
    expect(canonicalPhone(null)).toBeNull();
    expect(canonicalPhone(undefined)).toBeNull();
  });
});

describe("samePhone", () => {
  it("compares canonically", () => {
    expect(samePhone("0100 123 4567", "+201001234567")).toBe(true);
    expect(samePhone("01001234567", "01001234568")).toBe(false);
    expect(samePhone("", "")).toBe(false);
  });
});

describe("formatPhoneDisplay", () => {
  it("groups an Egyptian mobile", () => {
    expect(formatPhoneDisplay("201001234567")).toBe("+20 100 123 4567");
    expect(formatPhoneDisplay("01001234567")).toBe("+20 100 123 4567");
  });
  it("prefixes anything else", () => {
    expect(formatPhoneDisplay("966512345678")).toBe("+966512345678");
    expect(formatPhoneDisplay("20221234567")).toBe("+20221234567");
  });
  it("leaves a non-phone as given", () => {
    expect(formatPhoneDisplay("n/a")).toBe("n/a");
    expect(formatPhoneDisplay("")).toBe("");
    expect(formatPhoneDisplay(null)).toBe("");
  });
});

describe("formatPhoneInput", () => {
  it("round-trips through the canonical form", () => {
    expect(formatPhoneInput("201001234567")).toBe("01001234567");
    expect(formatPhoneInput("966512345678")).toBe("+966512345678");
    for (const [, canonical] of vectors.valid as [string, string][]) {
      expect(canonicalPhone(formatPhoneInput(canonical))).toBe(canonical);
    }
  });
});

describe("phoneSchema", () => {
  const issue = (s: ReturnType<typeof phoneSchema>, v: string) => {
    const r = s.safeParse(v);
    return r.success ? null : r.error.issues[0]?.message;
  };
  it("optional: empty passes, garbage does not", () => {
    const s = phoneSchema({ required: false });
    expect(issue(s, "")).toBeNull();
    expect(issue(s, "  ")).toBeNull();
    expect(issue(s, "12345")).toBe("common.errors.phoneInvalid");
    expect(s.parse(" 0100 123 4567 ")).toBe("0100 123 4567");
  });
  it("required: empty is its own message", () => {
    const s = phoneSchema({ required: true });
    expect(issue(s, " ")).toBe("common.errors.phoneRequired");
    expect(issue(s, "abc")).toBe("common.errors.phoneInvalid");
    expect(issue(s, "01001234567")).toBeNull();
  });
  it("takes the feature's own message keys", () => {
    const s = phoneSchema({ required: false, messages: { invalid: "customers.errors.phoneInvalid" } });
    expect(issue(s, "x")).toBe("customers.errors.phoneInvalid");
  });
});
