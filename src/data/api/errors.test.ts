import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";

const { default: i18n } = await import("@/i18n");
const { getErrorMessage } = await import("./errors");

const apiError = (data: Record<string, unknown>) =>
  new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 400,
    statusText: "Bad Request",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });

describe("getErrorMessage", () => {
  it("translates a known error code in both languages", async () => {
    const err = apiError({ code: "EMPTY_ALLOW_LIST", error: "EMPTY_ALLOW_LIST: a restricted list needs at least one payment method" });
    await i18n.changeLanguage("en");
    expect(getErrorMessage(err)).toBe("Pick at least one payment method, or allow all.");
    await i18n.changeLanguage("ar");
    expect(getErrorMessage(err)).toBe("اختر طريقة دفع واحدة على الأقل، أو اسمح بكل الطرق.");
    await i18n.changeLanguage("en");
  });

  it("falls back to the server message for unknown codes", () => {
    expect(getErrorMessage(apiError({ code: "SOMETHING_NEW", error: "Server says no" }))).toBe("Server says no");
  });

  it("words a closed month by whether it is paid (PERIOD_CLOSED vars.paid)", async () => {
    await i18n.changeLanguage("en");
    const approved = apiError({ code: "PERIOD_CLOSED", error: "x", vars: { date: "2026-09-24", paid: false } });
    const paid = apiError({ code: "PERIOD_CLOSED", error: "x", vars: { date: "2026-09-24", paid: true } });
    expect(getErrorMessage(approved)).toMatch(/Reopen it first/);
    expect(getErrorMessage(paid)).not.toMatch(/[Rr]eopen/);
    expect(getErrorMessage(paid)).toMatch(/paid.*open month/);
    await i18n.changeLanguage("ar");
    expect(getErrorMessage(paid)).not.toMatch(/افتح/);
    expect(getErrorMessage(paid)).toMatch(/مصروف/);
    await i18n.changeLanguage("en");
  });

  it("fills a refusal's figures into its words (OUTSIDE_FENCE, SHIFT_ENDED)", async () => {
    await i18n.changeLanguage("en");
    expect(getErrorMessage(apiError({ code: "OUTSIDE_FENCE", error: "x", vars: { distance_m: 1470, radius_m: 200 } }))).toBe(
      "The phone is 1470 m from the branch; clocking in needs it within 200 m.",
    );
    expect(getErrorMessage(apiError({ code: "SHIFT_ENDED", error: "x", vars: { shift: "Evening" } }))).toBe("Evening has already ended.");
    await i18n.changeLanguage("ar");
    expect(getErrorMessage(apiError({ code: "SHIFT_ENDED", error: "x", vars: { shift: "Evening" } }))).toBe("وردية Evening انتهت خلاص.");
    await i18n.changeLanguage("en");
  });
});
