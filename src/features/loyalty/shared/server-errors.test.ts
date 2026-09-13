import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";

const { default: i18n } = await import("@/i18n");
const { loyaltyServerError } = await import("./server-errors");

const refusal = (error: string) =>
  new AxiosError("Bad Request", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 400,
    statusText: "Bad Request",
    data: { error },
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

describe("loyalty server refusals", () => {
  const t = i18n.getFixedT("en");

  it("recognises a missing adjustment note", () => {
    const r = loyaltyServerError(refusal("Say why the points are being adjusted (note)"), t);
    expect(r.kind).toBe("noteRequired");
    expect(r.message).toMatch(/reason is required/);
  });

  it("recognises an inactive reward item", () => {
    const r = loyaltyServerError(refusal("reward items must be active menu items of this org"), t);
    expect(r.kind).toBe("inactiveReward");
    expect(r.message).toMatch(/no longer active/);
  });

  it("translates for Arabic readers", () => {
    const r = loyaltyServerError(refusal("reward items must be active menu items of this org"), i18n.getFixedT("ar"));
    expect(r.message).toMatch(/نشط/);
  });

  it("passes anything else through as the server said it", () => {
    const r = loyaltyServerError(refusal("An adjustment of zero points changes nothing"), t);
    expect(r).toEqual({ kind: "other", message: "An adjustment of zero points changes nothing" });
  });
});
