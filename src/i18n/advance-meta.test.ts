/**
 * "EGP 800.00 over 1 installments" (E2E, Approvals): an advance's summary
 * counts its installments with real plurals, in both languages.
 */
import { describe, expect, it } from "vitest";
import i18n from "@/i18n";

const meta = (lng: string, count: number) => i18n.getFixedT(lng)("dawam.advanceMeta", { amount: "X", count });

describe("advance summary plurals", () => {
  it("English: one installment, 2 installments", () => {
    expect(meta("en", 1)).toBe("X in one installment");
    expect(meta("en", 2)).toBe("X over 2 installments");
  });
  it("Arabic: every category reads right", () => {
    expect(meta("ar", 1)).toBe("X على قسط واحد");
    expect(meta("ar", 2)).toBe("X على قسطين");
    expect(meta("ar", 3)).toBe("X على 3 أقساط");
    expect(meta("ar", 12)).toBe("X على 12 قسطًا");
  });
});
