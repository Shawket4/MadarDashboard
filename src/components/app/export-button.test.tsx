import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const shakes: unknown[] = [];
vi.mock("@/lib/motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/motion")>()),
  useShake: (_ref: unknown, signal: unknown) => void shakes.push(signal),
}));

// A workbook that cannot be built: exceljs without a Workbook constructor.
vi.mock("exceljs", () => ({ default: {} }));

import { toast } from "@/components/ui/toast";
import { exportToExcel, toastExportError } from "@/lib/excel";

import { ExportButton } from "./export-button";

describe("ExportButton", () => {
  it("shakes when the export rejects, and swallows the rejection", async () => {
    shakes.length = 0;
    const onExport = vi.fn().mockRejectedValue(new Error("disk full"));
    render(<ExportButton onExport={onExport} />);
    fireEvent.click(screen.getByRole("button", { name: /Export/ }));
    await waitFor(() => expect(shakes.at(-1)).toBe(1));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("stays still when the export succeeds", async () => {
    shakes.length = 0;
    const onExport = vi.fn().mockResolvedValue(undefined);
    render(<ExportButton onExport={onExport} />);
    fireEvent.click(screen.getByRole("button", { name: /Export/ }));
    await waitFor(() => expect(onExport).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expect(shakes.every((s) => s === 0)).toBe(true);
  });

  it("a workbook that fails to build shakes the button, with exactly one toast", async () => {
    shakes.length = 0;
    vi.mocked(toast.error).mockClear();
    // The shape of every export handler: toast once, rethrow for the shake.
    const onExport = async () => {
      try {
        await exportToExcel({
          filename: "x",
          sheets: [{ name: "s", title: "s", rows: [{ a: 1 }], columns: [{ header: "a", accessor: (r: Record<string, unknown>) => r.a as number, type: "number" }] }],
        });
      } catch (e) {
        toastExportError(e);
        throw e;
      }
    };
    render(<ExportButton onExport={onExport} />);
    fireEvent.click(screen.getByRole("button", { name: /Export/ }));
    await waitFor(() => expect(shakes.at(-1)).toBe(1));
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(vi.mocked(toast.error).mock.calls[0][0]).toMatch(/Export failed/);
  });

  it("a failed fetch before the workbook toasts its own message once", async () => {
    shakes.length = 0;
    vi.mocked(toast.error).mockClear();
    const onExport = async () => {
      try {
        throw new Error("network down");
      } catch (e) {
        toastExportError(e);
        throw e;
      }
    };
    render(<ExportButton onExport={onExport} />);
    fireEvent.click(screen.getByRole("button", { name: /Export/ }));
    await waitFor(() => expect(shakes.at(-1)).toBe(1));
    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});
