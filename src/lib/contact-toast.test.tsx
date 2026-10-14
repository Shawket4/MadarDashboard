import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

const calls: unknown[][] = [];
vi.mock("sonner", () => {
  const error = (...a: unknown[]) => void calls.push(a);
  return { toast: { error } };
});

const { toast } = await import("sonner");
const { getErrorMessage } = await import("@/data/api/errors");
const { installContactToast } = await import("./contact-toast");

const err = (status: number, data: Record<string, unknown>) =>
  new AxiosError("x", "ERR", undefined, undefined, { status, statusText: "", headers: {}, config: { headers: new AxiosHeaders() }, data });

afterEach(() => void (calls.length = 0));

describe("contact toast", () => {
  installContactToast();
  installContactToast(); // idempotent

  it("adds a Contact Madar action to a Madar-only refusal", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    toast.error(getErrorMessage(err(403, { code: "ORG_FIELD_MADAR_ONLY" })));
    const opts = calls[0][1] as { action: { label: string; onClick: () => void } };
    expect(opts.action.label).toBe("Contact Madar");
    opts.action.onClick();
    expect(open).toHaveBeenCalledWith(expect.stringContaining("wa.me/201211116899"), "_blank", "noopener,noreferrer");
    open.mockRestore();
  });

  it("leaves every other toast alone", () => {
    toast.error(getErrorMessage(err(500, {})));
    expect(calls[0][1]).toBeUndefined();
  });
});
