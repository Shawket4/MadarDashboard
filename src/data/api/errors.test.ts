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
});
