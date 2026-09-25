/**
 * The server's limiter answers 429 with English prose ("Too many requests
 * just now…"): the general and per-address buckets with the code
 * `RATE_LIMITED`, a route's own governor with no code at all. The dashboard
 * words it in the reader's language, never as a network problem, waits and
 * asks again, and keeps the data it had on screen, saying the refresh failed
 * (box phase 2).
 */
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (m: string, o?: unknown) => toastError(m, o) } }));

const { default: i18n } = await import("@/i18n");
const { getErrorMessage } = await import("./errors");
const { queryRetry, onQueryError } = await import("./query");
const { failedEmpty } = await import("@/features/dawam/live");

const limited = (data: Record<string, unknown> = { error: "Too many requests just now. This will clear in a moment." }) =>
  new AxiosError("Request failed with status code 429", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 429,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });

afterEach(async () => {
  await i18n.changeLanguage("en");
  toastError.mockClear();
});

describe("a rate-limited answer (429)", () => {
  it("reads as too many requests, in EN and AR, never as the network", async () => {
    await i18n.changeLanguage("en");
    const en = getErrorMessage(limited());
    expect(en).toMatch(/too many requests/i);
    expect(en).not.toMatch(/network|connection/i);
    await i18n.changeLanguage("ar");
    const ar = getErrorMessage(limited());
    expect(ar).toMatch(/[؀-ۿ]/);
    expect(ar).not.toMatch(/Too many|just now/);
    expect(ar).not.toBe(i18n.t("errors.networkError"));
  });

  // Every 429 said EXPORT_RATE_LIMITED until the server named its limiter
  // (iOS device checks, 2026-09-25); an ordinary read's now says RATE_LIMITED,
  // and a coded 429 read the server's English in Arabic too.
  it("reads the same when the server names the limiter (RATE_LIMITED), in EN and AR", async () => {
    const coded = limited({ error: "Too many requests just now. This will clear in a moment.", code: "RATE_LIMITED" });
    await i18n.changeLanguage("en");
    expect(getErrorMessage(coded)).toBe(i18n.t("errors.tooManyRequests"));
    await i18n.changeLanguage("ar");
    const ar = getErrorMessage(coded);
    expect(ar).toBe(i18n.t("errors.tooManyRequests"));
    expect(ar).not.toMatch(/Too many|just now/);
  });

  // The export gate keeps its own code: too many exports, not too many requests.
  it("words a throttled export (EXPORT_RATE_LIMITED) as too many exports, in EN and AR", async () => {
    const exporting = limited({
      error: "That is 10 exports in a minute. Give it a moment and try again — each one reads the whole filtered dataset.",
      code: "EXPORT_RATE_LIMITED",
    });
    await i18n.changeLanguage("en");
    const en = getErrorMessage(exporting);
    expect(en).toBe(i18n.t("errors.codes.EXPORT_RATE_LIMITED"));
    expect(en).toMatch(/exports/i);
    expect(en).not.toBe(i18n.t("errors.tooManyRequests"));
    await i18n.changeLanguage("ar");
    const ar = getErrorMessage(exporting);
    expect(ar).toBe(i18n.t("errors.codes.EXPORT_RATE_LIMITED"));
    expect(ar).toMatch(/[؀-ۿ]/);
    expect(ar).not.toMatch(/exports|That is/);
    expect(ar).not.toBe(i18n.t("errors.tooManyRequests"));
  });

  it("is asked again a few times, later each time", () => {
    const e = limited();
    expect(queryRetry(0, e)).toBe(true);
    expect(queryRetry(2, e)).toBe(true);
    expect(queryRetry(3, e)).toBe(false);
  });

  it("keeps the data a list had: only a read with nothing to show is a failure", () => {
    expect(failedEmpty({ error: limited(), data: [{ id: 1 }] })).toBe(false);
    expect(failedEmpty({ error: limited(), data: undefined })).toBe(true);
    expect(failedEmpty({ error: null, data: undefined })).toBe(false);
  });

  it("says a Dawam refresh failed while the old data stays on screen", async () => {
    onQueryError(limited(), { queryKey: ["/staff/payroll/current"], state: { data: { period: {} } } } as never);
    await vi.waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(toastError.mock.calls[0][0]).toMatch(/too many requests/i);
    // A first load that fails is the page's own error state, not a toast.
    onQueryError(limited(), { queryKey: ["/staff/payroll/current"], state: { data: undefined } } as never);
    // And other pages keep their own behaviour.
    onQueryError(limited(), { queryKey: ["/orders"], state: { data: [] } } as never);
    await new Promise((r) => setTimeout(r, 20));
    expect(toastError).toHaveBeenCalledTimes(1);
  });
});
