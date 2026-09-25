/**
 * The refusal codes the backend fixes added (FOLLOWUPS, BC-2, B-ROTA-4/7,
 * B-ROTA-9): each reads in the reader's language, with its figures, and a
 * 403 the server didn't code reads as the plain "no permission".
 */
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it } from "vitest";

const { default: i18n } = await import("@/i18n");
const { getErrorMessage, isStaleRefusal } = await import("./errors");

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
  // The hunt's coded refusals (H2-B9, HUNT-BACKEND "Codes a client must word").
  ...HUNT_CODES(),
];

function HUNT_CODES(): string[] {
  return [
    "SHIFT_STARTED", "NO_PENDING_CLAIM", "CLAIM_ALREADY_DECIDED", "OPEN_SHIFT_NOT_FOUND", "NO_CLAIM_WAITING",
    "OPEN_SHIFT_CLOSED", "PICK_A_COLLEAGUE", "NOT_ROSTERED", "NO_SWAP_WAITING", "NO_SWAP_TO_CANCEL",
    "EMPLOYEE_NOT_FOUND", "BRANCH_NOT_FOUND", "NO_BRANCH_YET", "EMPLOYEE_NO_BRANCH", "EMPLOYEE_REQUIRED",
    "RANGE_BACKWARDS", "RANGE_TOO_WIDE", "TIMES_BOTH_OR_NEITHER", "DAY_OFF_NO_TIMES", "PICK_SOMEONE_ELSE",
    "ASSIGNMENT_NOT_FOUND", "OVERRIDE_NOT_FOUND", "DAY_OF_WEEK_INVALID", "SHIFT_NOT_FOUND", "SHIFT_NAME_REQUIRED",
    "SHIFT_EMPTY", "SHIFT_SETTING_INVALID", "SHIFT_DAYS_REQUIRED", "SHIFT_DAY_TIMES_INVALID", "SHIFT_DAY_TIMES_OFF_DAY",
    "PREFERENCES_INVALID", "STATUS_UNKNOWN", "REQUEST_KIND_UNKNOWN", "SHIFT_NOT_FOR_KIND", "END_BEFORE_START",
    "HALF_DAY_ONE_DATE", "HALF_ONLY_FOR_HALF_DAY", "HALF_DAY_WHICH_HALF", "LATE_ARRIVAL_TIME_REQUIRED",
    "EARLY_DEPARTURE_TIME_REQUIRED", "WINDOW_EMPTY", "EXCUSE_TIMES_REQUIRED", "MISSION_TITLE_REQUIRED",
    "CORRECTION_TARGET_REQUIRED", "CORRECTION_TIME_REQUIRED", "CHECK_OUT_BEFORE_CHECK_IN", "RECORD_NOT_FOUND",
    "RECORD_OTHER_DATE", "SHIFT_NOT_STARTED", "REQUEST_NOT_FOUND", "CANCEL_REASON_REQUIRED", "CORRECTION_APPLIED",
    "LEAVE_PAY_REQUIRED", "NO_COVER_WAITING", "NO_OVERTIME_WAITING", "AMOUNT_REQUIRED", "FLAG_ACTION_UNKNOWN",
    "CLOCK_OUT_FIRST", "SHIFT_ALREADY_WORKED", "REASON_REQUIRED", "DEDUCTION_IS_AN_AMOUNT",
    "AMOUNT_OR_PERCENT_REQUIRED", "ADJUSTMENT_NOT_FOUND", "ADJUSTMENT_KIND_INVALID", "NOT_A_RUNNING_LINE",
    "ADVANCE_NOT_FOUND", "EXPENSE_VIA_INVALID", "AMOUNT_NOT_POSITIVE", "PURPOSE_REQUIRED", "DATE_IN_FUTURE",
    "PAY_METHOD_INVALID", "PERIOD_NOT_FOUND", "PAYROLL_NOT_APPROVED", "PAYSLIP_ALREADY_PAID", "PERIOD_NOT_OPENED",
  ];
}

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

  it("words each code with its figures (H2-B9)", async () => {
    const cases: [Record<string, unknown>, RegExp, RegExp][] = [
      // [vars on the refusal, EN must match, AR must match]
      [{ code: "SHIFT_SETTING_INVALID", vars: { field: "grace_minutes" } }, /Grace/, new RegExp(i18n.t("staff.graceMinutes", { lng: "ar" }).replace(/[()]/g, "."))],
      [{ code: "SHIFT_SETTING_INVALID", vars: { field: "ot_night_multiplier" } }, /Night overtime/, /الليلي/],
      [{ code: "SHIFT_SETTING_INVALID", vars: { field: "overtime_threshold_minutes" } }, /Overtime after/, /[؀-ۿ]/],
      [{ code: "SHIFT_DAY_TIMES_OFF_DAY", vars: { day_of_week: 5 } }, /Fri/, /جمعة/],
      [{ code: "ALREADY_DECIDED", vars: { status: "declined" } }, /Declined/i, new RegExp(i18n.t("staff.req_declined", { lng: "ar" }))],
      [{ code: "RANGE_TOO_WIDE", vars: { max_days: 62 } }, /62/, /62/],
      [{ code: "STATUS_UNKNOWN", vars: { status: "maybe" } }, /maybe/, /maybe/],
      [{ code: "REQUEST_KIND_UNKNOWN", vars: { kind: "nap" } }, /nap/, /nap/],
    ];
    for (const [data, enRe, arRe] of cases) {
      const err = apiError({ ...data, error: "SERVER ENGLISH" }, 400);
      await i18n.changeLanguage("en");
      expect(getErrorMessage(err), JSON.stringify(data)).toMatch(enRe);
      expect(getErrorMessage(err)).not.toMatch(/\{\{|grace_minutes|ot_night|overtime_threshold/);
      await i18n.changeLanguage("ar");
      expect(getErrorMessage(err), JSON.stringify(data)).toMatch(arRe);
      expect(getErrorMessage(err)).not.toMatch(/\{\{|grace_minutes|ot_night|overtime_threshold|declined|SERVER/);
    }
  });

  it("tells an approved request's cancel from someone else's, and a filled open shift from a cancelled one", async () => {
    const pairsOf = [
      ["CANCEL_REASON_REQUIRED", "approved", "pending"],
      ["OPEN_SHIFT_CLOSED", "filled", "cancelled"],
    ];
    for (const lang of ["en", "ar"]) {
      await i18n.changeLanguage(lang);
      for (const [code, a, b] of pairsOf) {
        const one = getErrorMessage(apiError({ code, error: "x", vars: { status: a } }, 400));
        const two = getErrorMessage(apiError({ code, error: "x", vars: { status: b } }, 400));
        expect(one, `${lang} ${code}`).not.toBe(two);
        expect(one).not.toBe("x");
        expect(two).not.toBe("x");
      }
    }
  });

  it("refreshes the list after a refusal that means it is out of date", () => {
    for (const code of [
      "NO_CLAIM_WAITING", "NO_SWAP_WAITING", "OPEN_SHIFT_CLOSED", "NO_COVER_WAITING", "NO_OVERTIME_WAITING",
      "NO_SWAP_TO_CANCEL", "NO_PENDING_CLAIM", "CLAIM_ALREADY_DECIDED", "PAYSLIP_ALREADY_PAID",
    ]) {
      expect(isStaleRefusal(apiError({ code, error: "x" })), code).toBe(true);
    }
    expect(isStaleRefusal(apiError({ code: "REASON_REQUIRED", error: "x" }, 400))).toBe(false);
  });
});
