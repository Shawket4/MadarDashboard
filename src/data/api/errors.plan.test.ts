/**
 * Plan refusals (madar-plan): a 403 `{code: plan_*, feature, error, error_ar}`.
 * The English UI reads `error`, the Arabic one `error_ar`, and both end with
 * how to go on (contact Madar to upgrade).
 */
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it } from "vitest";

const { default: i18n } = await import("@/i18n");
const { getErrorMessage, isPlanRefusal } = await import("./errors");

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

  it("knows all five codes, and no others", () => {
    for (const c of ["plan_feature", "plan_branch_limit", "plan_device_limit", "plan_no_realtime", "plan_till_inactive"]) {
      expect(isPlanRefusal(c)).toBe(true);
    }
    expect(isPlanRefusal("OWNER_ONLY")).toBe(false);
    expect(isPlanRefusal(undefined)).toBe(false);
  });
});
