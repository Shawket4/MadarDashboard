import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getErrorMessage } from "@/data/api/errors";
import i18n from "@/i18n";

import {
  ACTION_MIN_MS,
  DURATIONS,
  FORM_ERROR_ID,
  Toaster,
  __resetToastsForTests,
  loadToasts,
  resolveToast,
  toast,
  toastFormError,
  useErrorToast,
  type ToastItem,
} from "./index";
import { MAX_VISIBLE, PILL_CHARS, impl, toSileo } from "./sileo";

// The real toast API here, not the silent spies every other test gets.
beforeEach(() => {
  vi.restoreAllMocks();
  impl.dismiss();
  __resetToastsForTests();
});

const live = () => [...document.querySelectorAll("[data-sileo-toast]:not([data-exiting='true'])")];
const item = (o: Partial<ToastItem> = {}): ToastItem => ({ id: "x", kind: "success", message: "Saved", duration: 4000, ...o });

describe("resolveToast", () => {
  it("gives each severity its standard duration, and loading none", () => {
    for (const k of ["success", "error", "warning", "info", "loading"] as const) expect(resolveToast(k, "m").duration).toBe(DURATIONS[k]);
    expect(DURATIONS.error).toBeGreaterThan(DURATIONS.success!);
  });

  it("keeps a toast with an action long enough to reach it", () => {
    expect(resolveToast("success", "m", { action: { label: "Undo", onClick() {} } }).duration).toBe(ACTION_MIN_MS);
    expect(resolveToast("success", "m", { duration: 20_000, action: { label: "Undo", onClick() {} } }).duration).toBe(20_000);
  });

  it("reads Infinity as until dismissed, and an explicit duration as given", () => {
    expect(resolveToast("info", "m", { duration: Infinity }).duration).toBeNull();
    expect(resolveToast("info", "m", { duration: 1500 }).duration).toBe(1500);
  });

  it("uses the caller's id as a string, else a fresh one", () => {
    expect(resolveToast("info", "m", { id: 7 }).id).toBe("7");
    expect(resolveToast("info", "m").id).not.toBe(resolveToast("info", "m").id);
  });
});

describe("toSileo", () => {
  it("puts a short message in the pill", () => {
    const o = toSileo(item({ message: "Saved" }));
    expect(o).toMatchObject({ id: "x", type: "success", title: "Saved", duration: 4000, autopilot: false, position: "top-center" });
  });

  it("moves a long message to the body under a severity title, open for the toast's life", () => {
    const msg = "x".repeat(PILL_CHARS + 1);
    const o = toSileo(item({ kind: "error", message: msg, duration: 8000 }));
    expect(o.title).toBe("Error");
    expect(o.autopilot).toEqual({ expand: 0, collapse: 8000 });
    render(<>{o.description}</>);
    expect(screen.getByText(msg)).toBeInTheDocument();
  });

  it("titles in the reader's language", async () => {
    await i18n.changeLanguage("ar");
    expect(toSileo(item({ kind: "warning", message: "y".repeat(PILL_CHARS + 1) })).title).toBe("تنبيه");
    await i18n.changeLanguage("en");
  });

  it("maps the action to Sileo's button", () => {
    const onClick = vi.fn();
    const o = toSileo(item({ action: { label: "Undo", onClick } }));
    act(() => o.button!.onClick());
    expect(o.button!.title).toBe("Undo");
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("keeps a body open on a toast with no timeout (Sileo would only open it on hover)", () => {
    const o = toSileo(item({ duration: null, description: "more" }));
    expect(o.duration).toBeGreaterThan(3_600_000);
    expect(o.autopilot).toEqual({ expand: 0, collapse: o.duration });
    expect(toSileo(item({ kind: "loading", duration: null })).duration).toBeNull();
  });

  it("offers Contact Madar on a refusal that points at Madar, and leaves others alone", () => {
    const err = (status: number, data: Record<string, unknown>) =>
      new AxiosError("x", "ERR", undefined, undefined, { status, statusText: "", headers: {}, config: { headers: new AxiosHeaders() }, data });
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const madar = toSileo(item({ kind: "error", message: getErrorMessage(err(403, { code: "ORG_FIELD_MADAR_ONLY" })), duration: 8000 }));
    expect(madar.button?.title).toBe("Contact Madar");
    expect(madar.duration).toBe(12_000);
    madar.button!.onClick();
    expect(open).toHaveBeenCalledWith(expect.stringContaining("wa.me/"), "_blank", "noopener,noreferrer");
    expect(toSileo(item({ kind: "error", message: getErrorMessage(err(500, {})) })).button).toBeUndefined();
  });
});

describe("the facade", () => {
  it("queues calls made before the library loads and replays them in order, minus the dismissed", async () => {
    toast.success("One");
    const two = toast.error("Two");
    toast.info("Three");
    toast.dismiss(two);
    render(<Toaster />);
    await waitFor(() => expect(live()).toHaveLength(2));
    expect(live().map((el) => el.querySelector("[data-sileo-title]")?.textContent)).toEqual(["One", "Three"]);
  });

  it("replaces a toast with the same id instead of stacking it", async () => {
    render(<Toaster />);
    toast.error("First", { id: "same" });
    toast.error("Second", { id: "same" });
    await waitFor(() => expect(live()).toHaveLength(1));
    await waitFor(() => expect(live()[0]).toHaveTextContent("Second"));
  });

  it(`shows at most ${MAX_VISIBLE}, the newest`, async () => {
    render(<Toaster />);
    await loadToasts();
    for (const m of ["a", "b", "c", "d", "e"]) act(() => void toast.success(m));
    await waitFor(() => expect(live()).toHaveLength(MAX_VISIBLE));
    expect(live().map((el) => el.textContent)).toEqual(expect.arrayContaining([expect.stringContaining("e")]));
  });

  it("turns a promise's loading toast into its success, in place", async () => {
    render(<Toaster />);
    let resolve!: (v: number) => void;
    const p = toast.promise(new Promise<number>((r) => (resolve = r)), { loading: "Saving", success: (n) => `Saved ${n}`, error: "Failed" });
    await waitFor(() => expect(live()[0]).toHaveAttribute("data-state", "loading"));
    await act(async () => resolve(3));
    await expect(p).resolves.toBe(3);
    await waitFor(() => expect(live()[0]).toHaveAttribute("data-state", "success"));
    expect(live()).toHaveLength(1);
    expect(live()[0]).toHaveTextContent("Saved 3");
  });

  it("turns a failed promise into its error", async () => {
    render(<Toaster />);
    const p = toast.promise(Promise.reject(new Error("no")), { loading: "Saving", success: "Saved", error: (e) => `Failed: ${(e as Error).message}` });
    await expect(p).rejects.toThrow("no");
    await waitFor(() => expect(live()[0]).toHaveAttribute("data-state", "error"));
    expect(live()[0]).toHaveTextContent("Failed: no");
  });

  it("toasts a failed request in getErrorMessage's words", async () => {
    render(<Toaster />);
    toast.apiError(new AxiosError("x", "ERR_NETWORK"));
    await waitFor(() => expect(live()).toHaveLength(1));
    expect(live()[0]).toHaveAttribute("data-state", "error");
  });

  it("says each toast to screen readers, errors assertively, before the library has loaded", () => {
    render(<Toaster />);
    act(() => void toast.success("Saved"));
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
    act(() => void toast.error("Couldn't save", { description: "Try again" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't save. Try again");
  });

  it("dismisses a toast when it is pressed", async () => {
    render(<Toaster />);
    toast.success("Saved");
    await waitFor(() => expect(live()).toHaveLength(1));
    act(() => (live()[0] as HTMLElement).click());
    await waitFor(() => expect(live()).toHaveLength(0));
  });

  it("runs the action once and then dismisses its toast", async () => {
    const onClick = vi.fn();
    render(<Toaster />);
    toast.success("Deleted", { action: { label: "Undo", onClick } });
    await waitFor(() => expect(live()).toHaveLength(1));
    act(() => (document.querySelector("[data-sileo-button]") as HTMLElement).click());
    expect(onClick).toHaveBeenCalledOnce();
    await waitFor(() => expect(live()).toHaveLength(0));
  });

  it("silences Sileo's own live region and hides its decorative SVG", async () => {
    render(<Toaster />);
    toast.info("Hello");
    await waitFor(() => expect(document.querySelector("[data-sileo-viewport]")).toHaveAttribute("aria-live", "off"));
    expect(document.querySelector("[data-sileo-svg]")).toHaveAttribute("aria-hidden", "true");
  });

  it("exposes the action as a button", async () => {
    render(<Toaster />);
    toast.success("Deleted", { action: { label: "Undo", onClick() {} } });
    expect(await screen.findByRole("button", { name: "Undo" })).toHaveAttribute("data-sileo-button");
  });
});

describe("guest form errors", () => {
  it("replaces the last form toast rather than stacking another", () => {
    const error = vi.spyOn(toast, "error");
    toastFormError("Please enter your name.");
    toastFormError("Please enter your name.");
    expect(new Set(error.mock.calls.map((c) => c[1]?.id))).toEqual(new Set([FORM_ERROR_ID]));
  });

  it("says when more than one field needs fixing", () => {
    const error = vi.spyOn(toast, "error");
    toastFormError("Please enter your name.", true);
    expect(error.mock.calls[0]![1]).toMatchObject({ description: "Other fields need attention too." });
    toastFormError("Please enter your name.");
    expect(error.mock.calls[1]![1]).toMatchObject({ description: undefined });
  });

  it("useErrorToast toasts each error as it is raised, and nothing while there is none", () => {
    const error = vi.spyOn(toast, "error");
    const { rerender } = renderHook(({ m }: { m: string | null }) => useErrorToast(m), { initialProps: { m: null as string | null } });
    expect(error).not.toHaveBeenCalled();
    rerender({ m: "That time just filled up." });
    rerender({ m: "That time just filled up." });
    expect(error).toHaveBeenCalledTimes(1);
    // Pages clear before a retry, so the same failure again is a new toast.
    rerender({ m: null });
    rerender({ m: "That time just filled up." });
    expect(error).toHaveBeenCalledTimes(2);
  });
});
