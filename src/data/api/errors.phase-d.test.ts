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
});
