/**
 * Every test starts with the toast API spied and silent (src/test/setup.ts), so
 * no test mocks a toast module of its own. Assert on the real object:
 *
 *   import { toast } from "@/components/ui/toast";
 *   expect(toast.error).toHaveBeenCalledWith("…");
 *   vi.mocked(toast.success).mock.calls
 *
 * A test of the toast module itself calls `vi.restoreAllMocks()` to get the real thing.
 */
import { vi } from "vitest";

import { toast } from "@/components/ui/toast";

const id = (_m: unknown, o?: { id?: string | number }) => String(o?.id ?? "toast");

export function quietToasts(): void {
  for (const k of ["success", "error", "warning", "info", "message", "loading", "apiError"] as const)
    vi.spyOn(toast, k).mockImplementation(id);
  vi.spyOn(toast, "promise").mockImplementation(<T,>(p: Promise<T> | (() => Promise<T>)) => (typeof p === "function" ? p() : p));
  vi.spyOn(toast, "dismiss").mockImplementation(() => {});
  for (const f of Object.values(toast)) vi.mocked(f).mockClear();
}
