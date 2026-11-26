import { fireEvent, render, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const shakes: unknown[] = [];
vi.mock("@/lib/motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/motion")>()),
  useShake: (_ref: unknown, signal: unknown) => void shakes.push(signal),
}));

// A workbook that cannot be built: exceljs without a Workbook constructor.
vi.mock("exceljs", () => ({ default: {} }));

import { toast } from "@/components/ui/toast";
import { exportFile, toastExportError } from "@/lib/excel";
import { exportVia, openExportPanel } from "@/test/export-panel";

import { ExportButton } from "./export-button";
import { getExportFormat, setExportFormat } from "@/lib/export-format";

const radios = (panel: HTMLElement, group: string) =>
  within(within(panel).getByRole("radiogroup", { name: group })).getAllByRole("radio");

describe("ExportButton", () => {
  beforeEach(() => {
    shakes.length = 0;
    setExportFormat("xlsx");
  });

  it("shakes when the export rejects, and swallows the rejection", async () => {
    const onExport = vi.fn().mockRejectedValue(new Error("disk full"));
    render(<ExportButton onExport={onExport} />);
    await exportVia();
    await waitFor(() => expect(shakes.at(-1)).toBe(1));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("stays still when the export succeeds", async () => {
    const onExport = vi.fn().mockResolvedValue(undefined);
    render(<ExportButton onExport={onExport} />);
    await exportVia();
    await waitFor(() => expect(onExport).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expect(shakes.every((s) => s === 0)).toBe(true);
  });

  it("a workbook that fails to build shakes the button, with exactly one toast", async () => {
    vi.mocked(toast.error).mockClear();
    // The shape of every export handler: toast once, rethrow for the shake.
    const onExport = async () => {
      try {
        await exportFile({
          filename: "x",
          sheets: [{ name: "s", title: "s", rows: [{ a: 1 }], columns: [{ header: "a", accessor: (r: Record<string, unknown>) => r.a as number, type: "number" }] }],
        });
      } catch (e) {
        toastExportError(e);
        throw e;
      }
    };
    render(<ExportButton onExport={onExport} />);
    await exportVia({ format: "Excel" });
    await waitFor(() => expect(shakes.at(-1)).toBe(1));
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(vi.mocked(toast.error).mock.calls[0][0]).toMatch(/Export failed/);
  });

  it("a failed fetch before the workbook toasts its own message once", async () => {
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
    await exportVia();
    await waitFor(() => expect(shakes.at(-1)).toBe(1));
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it("one file: the format, then Download in it; the format is remembered", async () => {
    const formats: string[] = [];
    // The export reads the format at the moment it runs.
    const onExport = vi.fn().mockImplementation(() => void formats.push(getExportFormat()));
    render(<ExportButton onExport={onExport} />);
    const panel = await openExportPanel();
    // No file list and no sheet: there is only the one.
    expect(within(panel).queryByRole("radiogroup", { name: "File" })).toBeNull();
    // Every export offers all three.
    expect(radios(panel, "Format").map((r) => r.textContent)).toEqual(["Excel", "PDF", "CSV"]);
    fireEvent.click(within(panel).getByRole("radio", { name: "PDF" }));
    expect(getExportFormat()).toBe("pdf");
    fireEvent.click(within(panel).getByRole("button", { name: "Download PDF" }));
    await waitFor(() => expect(onExport).toHaveBeenCalledTimes(1));
    expect(formats).toEqual(["pdf"]);
    // Next time it opens on PDF, and CSV is remembered the same way.
    const again = await openExportPanel();
    expect(within(again).getByRole("radio", { name: "PDF" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(within(again).getByRole("radio", { name: "CSV" }));
    expect(getExportFormat()).toBe("csv");
    fireEvent.click(within(again).getByRole("button", { name: "Download CSV" }));
    await waitFor(() => expect(formats).toEqual(["pdf", "csv"]));
  });

  it("a PDF or CSV of a workbook with several sheets asks which, and hands the pick to the export", async () => {
    const onExport = vi.fn();
    render(<ExportButton onExport={onExport} sheets={["Items", "Categories", "Addons"]} />);
    let panel = await openExportPanel();
    // Excel is the whole workbook: no sheet to choose.
    expect(within(panel).queryByRole("radiogroup", { name: "Sheet" })).toBeNull();
    fireEvent.click(within(panel).getByRole("radio", { name: "PDF" }));
    expect(radios(panel, "Sheet").map((r) => r.textContent)).toEqual(["Items", "Categories", "Addons"]);
    expect(within(panel).getByRole("radio", { name: "Items" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(within(panel).getByRole("radio", { name: "Categories" }));
    fireEvent.click(within(panel).getByRole("button", { name: "Download PDF" }));
    await waitFor(() => expect(onExport).toHaveBeenCalledWith({ sheet: 1 }));
    // A CSV asks the same, and keeps the sheet chosen.
    panel = await openExportPanel();
    fireEvent.click(within(panel).getByRole("radio", { name: "CSV" }));
    expect(within(panel).getByRole("radio", { name: "Categories" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(within(panel).getByRole("button", { name: "Download CSV" }));
    await waitFor(() => expect(onExport).toHaveBeenLastCalledWith({ sheet: 1 }));
    // In Excel the pick is not passed: the workbook is every sheet.
    panel = await openExportPanel();
    fireEvent.click(within(panel).getByRole("radio", { name: "Excel" }));
    fireEvent.click(within(panel).getByRole("button", { name: "Download Excel" }));
    await waitFor(() => expect(onExport).toHaveBeenLastCalledWith({}));
  });

  it("a sheet of tables has no CSV: the CSV is the other sheet, without asking", async () => {
    const onExport = vi.fn();
    render(<ExportButton onExport={onExport} sheets={[{ label: "Recipe tables", csv: false }, "Ingredient lines"]} />);
    let panel = await openExportPanel();
    fireEvent.click(within(panel).getByRole("radio", { name: "PDF" }));
    expect(radios(panel, "Sheet").map((r) => r.textContent)).toEqual(["Recipe tables", "Ingredient lines"]);
    fireEvent.click(within(panel).getByRole("radio", { name: "CSV" }));
    expect(within(panel).queryByRole("radiogroup", { name: "Sheet" })).toBeNull();
    fireEvent.click(within(panel).getByRole("button", { name: "Download CSV" }));
    await waitFor(() => expect(onExport).toHaveBeenCalledWith({ sheet: 1 }));
    panel = await openExportPanel();
    fireEvent.click(within(panel).getByRole("radio", { name: "PDF" }));
    fireEvent.click(within(panel).getByRole("button", { name: "Download PDF" }));
    await waitFor(() => expect(onExport).toHaveBeenLastCalledWith({ sheet: 0 }));
  });

  it("several files: the panel lists them, and each runs (and shakes) like the page's own", async () => {
    const onExport = vi.fn().mockResolvedValue(undefined);
    const recipes = vi.fn().mockRejectedValue(new Error("no"));
    render(
      <ExportButton
        onExport={onExport}
        fileLabel="Menu"
        more={[{ key: "r", label: "Recipes with costs", onExport: recipes, sheets: [{ label: "Recipe tables", csv: false }, "Ingredient lines"] }]}
      />,
    );
    const panel = await openExportPanel();
    expect(radios(panel, "File").map((r) => r.textContent)).toEqual(["Menu", "Recipes with costs"]);
    expect(within(panel).getByRole("radio", { name: "Menu" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(within(panel).getByRole("radio", { name: "Recipes with costs" }));
    fireEvent.click(within(panel).getByRole("button", { name: "Download Excel" }));
    await waitFor(() => expect(recipes).toHaveBeenCalledWith({}));
    await waitFor(() => expect(shakes.at(-1)).toBe(1));
    expect(onExport).not.toHaveBeenCalled();
    // The file stays picked for the next export.
    await exportVia({ format: "CSV" });
    await waitFor(() => expect(recipes).toHaveBeenLastCalledWith({ sheet: 1 }));
  });
});
