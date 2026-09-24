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
    expect(ar).toMatch(/بيغطّي/);
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
});

