import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const error = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (...a: unknown[]) => error(...a) }, Toaster: () => null }));

await import("@/i18n");
const { toastFormError, useErrorToast } = await import("./public-toaster");

beforeEach(() => error.mockClear());

describe("toastFormError", () => {
  it("replaces the last form toast rather than stacking another", () => {
    toastFormError("Please enter your name.");
    toastFormError("Please enter your name.");
    const ids = error.mock.calls.map((c) => (c[1] as { id: string }).id);
    expect(new Set(ids).size).toBe(1);
  });

  it("says when more than one field needs fixing", () => {
    toastFormError("Please enter your name.", true);
    expect(error.mock.calls[0]![1]).toMatchObject({ description: "Other fields need attention too." });
    toastFormError("Please enter your name.");
    expect(error.mock.calls[1]![1]).toMatchObject({ description: undefined });
  });
});

describe("useErrorToast", () => {
  it("toasts each error as it is raised, and nothing while there is none", () => {
    const { rerender } = renderHook(({ m }: { m: string | null }) => useErrorToast(m), {
      initialProps: { m: null as string | null },
    });
    expect(error).not.toHaveBeenCalled();
    rerender({ m: "That time just filled up." });
    expect(error).toHaveBeenCalledTimes(1);
    rerender({ m: "That time just filled up." });
    expect(error).toHaveBeenCalledTimes(1);
    // Pages clear before a retry, so the same failure again is a new toast.
    rerender({ m: null });
    rerender({ m: "That time just filled up." });
    expect(error).toHaveBeenCalledTimes(2);
  });
});
