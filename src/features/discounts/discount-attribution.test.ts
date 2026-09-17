import { describe, expect, it } from "vitest";
import type { TFunction } from "i18next";

import { bpsLabel, discountAttribution, discountKindLabel } from "./discount-attribution";

const t = ((key: string, opts?: string | { defaultValue: string; name?: string }) => {
  if (typeof opts === "string") return opts;
  return (opts?.defaultValue ?? key).replace("{{name}}", opts?.name ?? "");
}) as unknown as TFunction;

describe("discount attribution", () => {
  it("formats basis points", () => {
    expect(bpsLabel(1250)).toBe("12.5%");
    expect(bpsLabel(1000)).toBe("10%");
    expect(bpsLabel(null)).toBeNull();
  });
  it("labels kinds, unknown as not recorded", () => {
    expect(discountKindLabel(t, "manual_amount")).toBe("Amount by hand");
    expect(discountKindLabel(t, null)).toBe("Not recorded");
  });
  it("names who applied and who approved", () => {
    expect(
      discountAttribution(t, {
        discount_kind: "manual_percent",
        discount_percent_bps: 1500,
        discount_applied_by_name: "Sara",
        discount_approved_by_name: "Omar",
      }),
    ).toBe("Percent by hand · 15% · by Sara · approved by Omar");
    expect(discountAttribution(t, {})).toBeNull();
  });
});
