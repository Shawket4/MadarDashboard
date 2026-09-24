/**
 * Copy the team E2E caught: the late-arrival field label read "arriving by"
 * (lower case), and the advance review promised "Above the cap it waits for
 * the owner" while the server refuses a manager outright (409
 * ADVANCE_OVER_CAP) and leaves the ask pending for the owner.
 */
import { describe, expect, it } from "vitest";
import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";

describe("E2E team copy", () => {
  it("labels start with a capital", () => {
    expect(en.staff.arrivingBy).toBe("Arriving by");
  });
  it("the advance review says only the owner can approve above the cap", () => {
    expect(en.dawam.reviewAdvanceHint).not.toMatch(/waits for the owner/);
    expect(en.dawam.reviewAdvanceHint).toMatch(/only the owner/);
    expect(ar.dawam.reviewAdvanceHint).toMatch(/المالك/);
    expect(ar.dawam.reviewAdvanceHint).not.toMatch(/ينتظر المالك/);
  });
});

describe("Latin digits in Arabic Dawam copy (C-4, DSH-8)", () => {
  it("no Arabic-Indic digits in the dawam / staff / errors strings", () => {
    const bad: string[] = [];
    const walk = (o: unknown, p: string) => {
      if (typeof o === "string") { if (/[٠-٩]/.test(o)) bad.push(`${p} = ${o}`); return; }
      if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) walk(v, p ? `${p}.${k}` : k);
    };
    walk({ dawam: ar.dawam, staff: ar.staff, errors: ar.errors }, "");
    expect(bad).toEqual([]);
  });
});

describe("Organizations dialog in Arabic (L-37)", () => {
  it("has an Arabic label for the time zone", () => {
    expect((ar as { orgs?: { timezone?: string } }).orgs?.timezone).toBe("المنطقة الزمنية");
    expect((en as { orgs?: { timezone?: string } }).orgs?.timezone).toBe("Timezone");
    expect((ar as { orgs?: { timezoneHint?: string } }).orgs?.timezoneHint).toMatch(/الفروع/);
  });
});

/**
 * Dawam refusals now carry a code (backend fd4436f, B-TEAM-2): each reads in
 * the user's language through errors.codes.*, with its figures, and never
 * with the server's "Forbidden:/Conflict:" English.
 */
describe("Dawam refusal codes (B-TEAM-2)", () => {
  const CODES = [
    "ABOVE_LIMIT", "ADVANCE_OVER_CAP", "CORRECTION_WAITING", "EMPLOYMENT_NOT_ACTIVE", "FLAG_HANDLED",
    "MANAGER_REQUEST_ABOVE", "OVERLAPPING_REQUEST", "OWN_ADVANCE", "OWN_CLAIM", "OWN_COVER", "OWN_DECISION",
    "OWN_OVERTIME", "OWN_PAY_LINE", "OWN_PUNCH", "OWN_REQUEST", "OWN_SWAP",
  ];
  const codes = (l: unknown) => (l as { errors: { codes: Record<string, string> } }).errors.codes;
  it("has English and Arabic wording for every code", () => {
    for (const c of CODES) {
      expect(codes(en)[c], `en ${c}`).toBeTruthy();
      expect(codes(ar)[c], `ar ${c}`).toBeTruthy();
      expect(codes(ar)[c].replace(/\{\{\w+\}\}/g, ""), `ar ${c} is Arabic`).not.toMatch(/[A-Za-z]{3,}/);
    }
  });
  it("names the figure in the advance cap", async () => {
    const i18n = (await import("@/i18n")).default;
    await i18n.changeLanguage("ar");
    expect(i18n.t("errors.codes.ADVANCE_OVER_CAP", { more_egp: 2700 })).toMatch(/2700/);
    await i18n.changeLanguage("en");
    expect(i18n.t("errors.codes.ADVANCE_OVER_CAP", { more_egp: 2700 })).toMatch(/2700 EGP/);
  });
  it("turns a coded 409 into the user's language", async () => {
    const i18n = (await import("@/i18n")).default;
    const { AxiosError } = await import("axios");
    const { getErrorMessage } = await import("@/data/api/errors");
    await i18n.changeLanguage("ar");
    const err = new AxiosError("x", "409", undefined, undefined, {
      status: 409, statusText: "Conflict", headers: {}, config: {} as never,
      data: { error: "Conflict: You already have a request like this for that time.", code: "OVERLAPPING_REQUEST", vars: {} },
    });
    expect(getErrorMessage(err)).toBe(codes(ar).OVERLAPPING_REQUEST);
    await i18n.changeLanguage("en");
  });
});
