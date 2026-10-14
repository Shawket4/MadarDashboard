/**
 * Plan refusals (madar-plan): a 403 `{code: plan_*, feature, error, error_ar}`.
 * The English UI reads `error`, the Arabic one `error_ar`, and both end with
 * how to go on (contact Madar to upgrade).
 */
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it } from "vitest";

const { default: i18n } = await import("@/i18n");
const { getErrorMessage, isPlanRefusal, needsMadar, madarActionFor, madarContactHref } = await import("./errors");

const refusal = (data: Record<string, unknown>) =>
  new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 403,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("plan refusals", () => {
  const err = refusal({
    code: "plan_feature",
    feature: "inventory",
    error: "Inventory is not part of the Free plan.",
    error_ar: "المخزون ليس ضمن الباقة المجانية.",
  });

  it("reads the English sentence in English, then the upgrade hint", () => {
    expect(getErrorMessage(err)).toBe("Inventory is not part of the Free plan. Contact Madar to move to the paid plan.");
  });

  it("reads error_ar in Arabic", async () => {
    await i18n.changeLanguage("ar");
    const msg = getErrorMessage(err);
    expect(msg.startsWith("المخزون ليس ضمن الباقة المجانية.")).toBe(true);
    expect(msg).toMatch(/مدار/);
  });

  it("falls back to the dashboard's own words when the server sends no sentence", async () => {
    const bare = refusal({ code: "plan_branch_limit" });
    expect(getErrorMessage(bare)).toMatch(/Free plan/);
    await i18n.changeLanguage("ar");
    expect(getErrorMessage(bare)).toMatch(/الباقة المجانية/);
  });

  it("knows every plan_ code, and no others", () => {
    for (const c of ["plan_feature", "plan_branch_limit", "plan_device_limit", "plan_no_realtime", "plan_till_inactive"]) {
      expect(isPlanRefusal(c)).toBe(true);
    }
    expect(isPlanRefusal("plan_something_new")).toBe(true);
    expect(isPlanRefusal("PLAN_CHANGED")).toBe(false);
    expect(isPlanRefusal("OWNER_ONLY")).toBe(false);
    expect(isPlanRefusal(undefined)).toBe(false);
  });
});

describe("Madar-only changes (PATCH /orgs/{id})", () => {
  const field = refusal({ code: "ORG_FIELD_MADAR_ONLY", error: "Forbidden: only Madar may set this" });
  const currency = Object.assign(refusal({ code: "ORG_CURRENCY_LOCKED" }), {});
  (currency.response as { status: number }).status = 409;

  it("never shows the generic permission line, and says who to ask", () => {
    for (const e of [field, currency]) {
      const msg = getErrorMessage(e);
      expect(msg).not.toBe("You don't have permission to perform this action.");
      expect(msg).toMatch(/Contact Madar/);
    }
  });

  it("reads in formal Arabic and still names Madar", async () => {
    await i18n.changeLanguage("ar");
    for (const e of [field, currency]) expect(getErrorMessage(e)).toMatch(/مدار/);
    expect(getErrorMessage(field)).not.toMatch(/صلاحية/);
  });

  it("flags them, and plan refusals, as needing Madar; nothing else", () => {
    expect(needsMadar(field)).toBe(true);
    expect(needsMadar(currency)).toBe(true);
    expect(needsMadar(refusal({ code: "plan_feature" }))).toBe(true);
    expect(needsMadar(refusal({ code: "OWNER_ONLY" }))).toBe(false);
    expect(needsMadar(new Error("x"))).toBe(false);
  });

  it("links the message it wrote to a WhatsApp chat in the reader's language", async () => {
    const msg = getErrorMessage(currency);
    expect(madarActionFor(msg)).toMatch(/^https:\/\/wa\.me\/201211116899\?text=/);
    expect(decodeURIComponent(madarActionFor(msg) ?? "")).toMatch(/currency/);
    expect(madarActionFor("some other message")).toBeUndefined();
    const plan = refusal({ code: "plan_feature", feature: "inventory" });
    expect(decodeURIComponent(madarContactHref(plan))).toMatch(/Inventory/);
  });

  it("a plain 403 without a code stays the generic permission line", () => {
    expect(getErrorMessage(refusal({}))).toBe("You don't have permission to perform this action.");
  });
});
