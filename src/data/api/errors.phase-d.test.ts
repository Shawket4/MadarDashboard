/**
 * The refusals the owner's Phase D decisions (24 Sep 2026) added: each reads
 * in the reader's language, with its figures.
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

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("Phase D refusals", () => {
  it("D1: a punch on a shift a colleague covers names the coverer (SHIFT_COVERED)", async () => {
    const err = apiError({ code: "SHIFT_COVERED", error: "Salma is covering this shift.", vars: { coverer_name: "Salma Adel" } });
    expect(getErrorMessage(err)).toBe("Salma Adel is covering this shift. End or reject the cover first.");
    await i18n.changeLanguage("ar");
    const ar = getErrorMessage(err);
    expect(ar).toMatch(/Salma Adel/);
    expect(ar).toMatch(/يغطّي/);
  });

  it("D3: a holiday decided by someone who isn't the owner (OWNER_ONLY, 403, no vars)", async () => {
    const err = apiError({ code: "OWNER_ONLY", error: "Only the owner decides public holidays." }, 403);
    expect(getErrorMessage(err)).toBe("Only the owner can do this.");
    await i18n.changeLanguage("ar");
    expect(getErrorMessage(err)).toMatch(/المالك/);
  });

  it("D7: an over-cap refusal names no amount for a manager, and the amount for someone who sees the salary", async () => {
    const manager = apiError({ code: "ADVANCE_OVER_CAP", error: "x", vars: { over_cap: true } });
    expect(getErrorMessage(manager)).toBe("That's over the advance cap. Only the owner can approve it.");
    const payroll = apiError({ code: "ADVANCE_OVER_CAP", error: "x", vars: { over_cap: true, more_piastres: 165_000, more_egp: 1650 } });
    expect(getErrorMessage(payroll)).toMatch(/1650 EGP/);
    await i18n.changeLanguage("ar");
    expect(getErrorMessage(manager)).toMatch(/المالك/);
    expect(getErrorMessage(manager)).not.toMatch(/\d/);
  });

  it("D8: a rejection with no reason (REASON_REQUIRED, 400, no vars)", async () => {
    const err = apiError({ code: "REASON_REQUIRED", error: "A reason is required." }, 400);
    // A rejection is worded as one by its dialog (reasonFor "decline", A5); bare, it is generic.
    expect(getErrorMessage(err, { reasonFor: "decline" })).toBe("Say why you're declining.");
    expect(getErrorMessage(err)).toBe("Say why: this needs a reason.");
    await i18n.changeLanguage("ar");
    expect(getErrorMessage(err)).not.toMatch(/[A-Za-z]/);
  });

  it("D9: approving with salaries missing names the people (SALARY_MISSING {names})", async () => {
    const err = apiError({ code: "SALARY_MISSING", error: "x", vars: { names: ["Omar Nabil", "Aya Hassan"], employee_ids: ["e1", "e2"] } });
    expect(getErrorMessage(err)).toBe("No salary is set for Omar Nabil, Aya Hassan. Set it, or mark them not on payroll, before approving.");
    await i18n.changeLanguage("ar");
    const ar = getErrorMessage(err);
    expect(ar).toMatch(/Omar Nabil/);
    expect(ar).toMatch(/راتب/);
  });

  it("M43: a server sentence never starts with the error's kind (\"Conflict: …\")", () => {
    expect(getErrorMessage(apiError({ error: "Conflict: You already have a request that day." }))).toBe("You already have a request that day.");
    expect(getErrorMessage(apiError({ error: "Bad request: A reason is required." }, 400))).toBe("A reason is required.");
    expect(getErrorMessage(apiError({ error: "Not found: No such shift." }, 404))).toBe("No such shift.");
    // A sentence that merely contains a colon stays whole.
    expect(getErrorMessage(apiError({ error: "Time off: 3 days left" }))).toBe("Time off: 3 days left");
  });

  it("box verify: the staff-app codes have dashboard words too (DEVICE_REVOKED, STAFF_APP_ONLY, MANAGER_ACCOUNT_NEEDED)", async () => {
    for (const [code, status] of [["DEVICE_REVOKED", 401], ["STAFF_APP_ONLY", 403], ["MANAGER_ACCOUNT_NEEDED", 403]] as const) {
      const err = apiError({ code, error: "SERVER ENGLISH" }, status);
      await i18n.changeLanguage("en");
      const en = getErrorMessage(err);
      await i18n.changeLanguage("ar");
      const ar = getErrorMessage(err);
      expect(en).not.toBe("SERVER ENGLISH");
      expect(ar).not.toMatch(/[A-Za-z]{3,}/);
      expect(ar).not.toBe(en);
    }
  });

  it("M39: moving a till tag to someone who isn't active (EMPLOYEE_INACTIVE {status})", async () => {
    const err = apiError({ code: "EMPLOYEE_INACTIVE", error: "x", vars: { status: "terminated" } }, 403);
    expect(getErrorMessage(err)).toBe("They aren't active any more, so nothing can be moved to them.");
    await i18n.changeLanguage("ar");
    expect(getErrorMessage(err)).not.toMatch(/[A-Za-z]{3,}/);
  });
});

