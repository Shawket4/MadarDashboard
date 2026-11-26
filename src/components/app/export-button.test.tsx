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
import { getExportFormat, setExportFormat } from "@/lib/export-format";

/** Open the Export menu and pick `item` (Excel, PDF, a file). */
const pick = async (item: string | RegExp) => {
  fireEvent.pointerDown(screen.getByRole("button", { name: /Export/ }), { button: 0, pointerType: "mouse" });
  fireEvent.click(await screen.findByRole("menuitem", { name: item }));
};

describe("ExportButton", () => {
  it("shakes when the export rejects, and swallows the rejection", async () => {
    shakes.length = 0;
    const onExport = vi.fn().mockRejectedValue(new Error("disk full"));
    render(<ExportButton onExport={onExport} />);
    await pick("Excel");
    await waitFor(() => expect(shakes.at(-1)).toBe(1));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("stays still when the export succeeds", async () => {
    shakes.length = 0;
    const onExport = vi.fn().mockResolvedValue(undefined);
    render(<ExportButton onExport={onExport} />);
    await pick("Excel");
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
    await pick("Excel");
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
    await pick("Excel");
    await waitFor(() => expect(shakes.at(-1)).toBe(1));
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it("offers more files under their own heading, and each one runs (and shakes) like the main export", async () => {
    shakes.length = 0;
    const onExport = vi.fn().mockResolvedValue(undefined);
    const recipes = vi.fn().mockRejectedValue(new Error("no"));
    render(
      <ExportButton
        onExport={onExport}
        label="Export"
        excelLabel="Menu (Excel)"
        moreHeading="Recipes"
        more={[{ key: "r", label: "Recipes with costs (Excel)", onSelect: recipes }]}
      />,
    );
    const trigger = screen.getByRole("button", { name: /Export/ });
    fireEvent.pointerDown(trigger, { button: 0, pointerType: "mouse" });
    const items = await screen.findAllByRole("menuitem");
    expect(items.map((i) => i.textContent)).toEqual(["Menu (Excel)", "Recipes with costs (Excel)"]);
    expect(screen.getByText("Recipes")).toBeTruthy();
    fireEvent.click(items[1]);
    await waitFor(() => expect(recipes).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(shakes.at(-1)).toBe(1));
    expect(onExport).not.toHaveBeenCalled();
  });

  it("one file: the menu is the choice, and picking a format exports in it at once", async () => {
    setExportFormat("xlsx");
    const onExport = vi.fn().mockImplementation(() => {
      // The export reads the format at the moment it runs.
      formats.push(getExportFormat());
    });
    const formats: string[] = [];
    render(<ExportButton onExport={onExport} />);
    await pick("PDF");
    await waitFor(() => expect(onExport).toHaveBeenCalledTimes(1));
    expect(formats).toEqual(["pdf"]);
    expect(getExportFormat()).toBe("pdf"); // remembered for the next export
    await pick("Excel");
    await waitFor(() => expect(onExport).toHaveBeenCalledTimes(2));
    expect(formats).toEqual(["pdf", "xlsx"]);
  });

  it("several files: the format sits at the top, keeps the menu open, and the file follows it", async () => {
    setExportFormat("xlsx");
    const onExport = vi.fn();
    render(<ExportButton onExport={onExport} excelLabel="Menu" more={[{ key: "r", label: "Recipes", onSelect: vi.fn() }]} />);
    fireEvent.pointerDown(screen.getByRole("button", { name: /Export/ }), { button: 0, pointerType: "mouse" });
    const pdf = await screen.findByRole("menuitemradio", { name: "PDF" });
    expect(screen.getByRole("menuitemradio", { name: "Excel" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(pdf);
    expect(getExportFormat()).toBe("pdf");
    // Still open: the file is picked next.
    fireEvent.click(await screen.findByRole("menuitem", { name: "Menu" }));
    await waitFor(() => expect(onExport).toHaveBeenCalledTimes(1));
    setExportFormat("xlsx");
  });
});
