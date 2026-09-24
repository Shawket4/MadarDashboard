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

  it("words the payroll refusals in the reader's language, with the amount (E2E payroll AV-5)", async () => {
    await i18n.changeLanguage("ar");
    const cap = apiError({ code: "ADVANCE_OVER_CAP", error: "That's over the advance cap — at most 3250 EGP more; the owner can approve it.", vars: { more_egp: 3250, more_piastres: 325000 } });
    expect(getErrorMessage(cap)).toMatch(/3250/);
    expect(getErrorMessage(cap)).not.toMatch(/[A-Za-z]{3,}/);
    for (const code of ["ABOVE_LIMIT", "OWN_ADVANCE", "OWN_PAY_LINE"]) {
      expect(getErrorMessage(apiError({ code, error: "English" }))).not.toBe("English");
    }
    await i18n.changeLanguage("en");
    expect(getErrorMessage(cap)).toMatch(/3250 EGP/);
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

  it("words deciding your own flag (OWN_DECISION) in the user's language", async () => {
    // E2E clocking: Karim ignoring his own flag on the Arabic dashboard saw the
    // server's English "Someone else has to decide this one."
    const err = apiError({ code: "OWN_DECISION", error: "Someone else has to decide this one." });
    await i18n.changeLanguage("en");
    expect(getErrorMessage(err)).toMatch(/about you/);
    await i18n.changeLanguage("ar");
    expect(getErrorMessage(err)).not.toBe("Someone else has to decide this one.");
    expect(getErrorMessage(err)).toMatch(/يخصّك/);
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

  it("names who is already on the block when a move would drop it (ALREADY_ROSTERED with vars, B-ROTA-1)", async () => {
    const named = apiError({ code: "ALREADY_ROSTERED", error: "x", vars: { name: "Karim Mostafa", shift: "Morning", date: "2026-10-03" } });
    await i18n.changeLanguage("en");
    expect(getErrorMessage(named)).toMatch(/^Karim Mostafa is already on Morning on .+\. Nothing was moved\.$/);
    // The app's claim path sends no figures: the plain wording stays.
    expect(getErrorMessage(apiError({ code: "ALREADY_ROSTERED", error: "x" }))).toBe("They're already on that shift.");
    await i18n.changeLanguage("ar");
    expect(getErrorMessage(named)).toMatch(/^Karim Mostafa مُجدول بالفعل في وردية Morning يوم .+\. لم يُنقل شيء\.$/);
    await i18n.changeLanguage("en");
  });
});

