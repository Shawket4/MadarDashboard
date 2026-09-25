/**
 * The refusal codes the backend fixes added (FOLLOWUPS, BC-2, B-ROTA-4/7,
 * B-ROTA-9): each reads in the reader's language, with its figures, and a
 * 403 the server didn't code reads as the plain "no permission".
 */
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it } from "vitest";

const { default: i18n } = await import("@/i18n");
const { getErrorMessage } = await import("./errors");

const apiError = (data: Record<string, unknown>, status = 409) =>
  new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });

/** Every code a Dawam screen can meet (FOLLOWUPS.md + BC-2 + B-ROTA-4/7). */
const DAWAM_CODES = [
  "OWN_DECISION", "SETTING_OUT_OF_RANGE", "ALREADY_ROSTERED", "ADVANCE_OVER_CAP", "OWN_PAY_LINE", "OWN_ADVANCE",
  "OWN_OVERTIME", "OWN_COVER", "OWN_PUNCH", "OWN_CLAIM", "OWN_SWAP", "OWN_REQUEST", "MANAGER_REQUEST_ABOVE",
  "ABOVE_LIMIT", "FLAG_HANDLED", "EMPLOYMENT_NOT_ACTIVE", "OVERLAPPING_REQUEST", "CORRECTION_WAITING",
  "PHONE_NOT_REGISTERED", "OTP_RECENTLY_SENT", "OTP_WRONG", "OTP_TOO_MANY_TRIES", "OTP_NONE_ACTIVE",
  "COORDINATES_OUT_OF_RANGE", "NOT_CLOCKED_IN", "SHIFT_NOT_COVERABLE", "ALREADY_CLAIMED", "SWAP_EXISTS",
  "SHIFT_INACTIVE", "PERIOD_CLOSED", "DAWAM_OFF", "PRIVACY_NOT_ACCEPTED",
  // Sign-in to a suspended business (E2E setup re-verify, D-310).
  "ORG_SUSPENDED",
  // A decision someone made first; a cover flag is confirmed or rejected only (H2-B2, H2-B3).
  "ALREADY_DECIDED", "FLAG_COVER_CONFIRM_OR_REJECT",
  // A pending-only list asked without a range; a board's branch the person isn't at (H2-B5, H2-B8).
  "RANGE_REQUIRED", "EMPLOYEE_NOT_AT_BRANCH",
];

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("the backend fixes' refusal codes", () => {
  it("has EN and AR words for every code, and they differ", async () => {
    for (const code of DAWAM_CODES) {
      const err = apiError({ code, error: "SERVER ENGLISH", vars: {} });
      await i18n.changeLanguage("en");
      const en = getErrorMessage(err);
      await i18n.changeLanguage("ar");
      const ar = getErrorMessage(err);
      expect(en, code).not.toBe("SERVER ENGLISH");
      expect(ar, code).not.toBe("SERVER ENGLISH");
      expect(ar, code).not.toBe(en);
      expect(ar, code).toMatch(/[؀-ۿ]/);
    }
  });

  it("fills in the sign-in figures (OTP_RECENTLY_SENT, OTP_WRONG)", async () => {
    const wait = apiError({ code: "OTP_RECENTLY_SENT", error: "x", vars: { wait_seconds: 60 } });
    const wrong = apiError({ code: "OTP_WRONG", error: "x", vars: { attempts_left: 2 } });
    for (const lang of ["en", "ar"]) {
      await i18n.changeLanguage(lang);
      expect(getErrorMessage(wait)).toMatch(/60/);
      expect(getErrorMessage(wrong)).toMatch(/2/);
    }
  });

  it("reads an uncoded 403 as the plain no-permission words, in both languages (B-ROTA-9)", async () => {
    const err = apiError({ error: "Forbidden: This needs hr.schedule.publish for every branch" }, 403);
    await i18n.changeLanguage("en");
    expect(getErrorMessage(err)).toBe(i18n.t("errors.unauthorized"));
    await i18n.changeLanguage("ar");
    expect(getErrorMessage(err)).toBe(i18n.t("errors.unauthorized"));
    expect(getErrorMessage(err)).not.toMatch(/Forbidden|every branch/);
  });

  it("still words a coded 403 by its code", async () => {
    await i18n.changeLanguage("ar");
    const err = apiError({ code: "OWN_PAY_LINE", error: "You can't add pay lines for yourself." }, 403);
    expect(getErrorMessage(err)).toBe(i18n.t("errors.codes.OWN_PAY_LINE"));
  });

  it("names the block, the count, the days and the date in the rota refusals (B-ROTA-2, B-ROTA-3)", async () => {
    const inUse = apiError({ code: "SHIFT_IN_USE", error: "x", vars: { n: 2, name: "Evening" } });
    const days = apiError({ code: "SHIFT_DAYS_IN_USE", error: "x", vars: { n: 1, name: "Morning", days: [1, 5] } });
    const overlap = apiError({ code: "SHIFTS_OVERLAP", error: "x", vars: { a: "Morning", b: "E2E Morning", date: "2026-10-04" } });
    await i18n.changeLanguage("en");
    expect(getErrorMessage(inUse)).toMatch(/2 .*Evening/);
    expect(getErrorMessage(days)).toMatch(/Morning/);
    expect(getErrorMessage(days)).toMatch(/Mon.*Fri/);
    expect(getErrorMessage(overlap)).toMatch(/Morning.*E2E Morning/);
    expect(getErrorMessage(overlap)).not.toMatch(/night/);
    await i18n.changeLanguage("ar");
    for (const e of [inUse, days, overlap]) expect(getErrorMessage(e)).not.toBe("x");
    expect(getErrorMessage(inUse)).toMatch(/Evening/);
    expect(getErrorMessage(days)).toMatch(/إثنين/);
    expect(getErrorMessage(overlap)).toMatch(/E2E Morning/);
  });

  it("says a request was already decided, and how, in the reader's language", async () => {
    const err = apiError({ code: "REQUEST_ALREADY_DECIDED", error: "This request is already approved", vars: { status: "approved" } });
    await i18n.changeLanguage("en");
    expect(getErrorMessage(err)).toMatch(/already/i);
    expect(getErrorMessage(err)).toMatch(/approved/i);
    await i18n.changeLanguage("ar");
    expect(getErrorMessage(err)).toMatch(i18n.t("staff.req_approved"));
    expect(getErrorMessage(err)).not.toMatch(/[A-Za-z]{3,}/);
  });
});
