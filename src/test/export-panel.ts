/**
 * Drive the shared Export panel (`components/app/export-button`) as a person
 * does: open it, choose the format (and the file and sheet, when asked), press
 * Download.
 */
import { fireEvent, screen, within } from "@testing-library/react";

export interface ExportVia {
  /** The trigger's name; the Export button's by default. */
  trigger?: string | RegExp;
  /** "Excel", "PDF" or "CSV". Left alone when unset (the remembered format). */
  format?: string;
  /** The file, when the panel offers several. */
  file?: string;
  /** The sheet a PDF prints. */
  sheet?: string;
}

/** Open the Export panel; returns it. */
export async function openExportPanel(trigger: string | RegExp = /Export/): Promise<HTMLElement> {
  fireEvent.click(screen.getByRole("button", { name: trigger }));
  return screen.findByRole("dialog");
}

export async function exportVia({ trigger, format, file, sheet }: ExportVia = {}): Promise<void> {
  const panel = await openExportPanel(trigger);
  const choose = (group: string, name: string) =>
    fireEvent.click(within(within(panel).getByRole("radiogroup", { name: group })).getByRole("radio", { name }));
  if (file) choose("File", file);
  if (format) choose("Format", format);
  if (sheet) choose("Sheet", sheet);
  fireEvent.click(within(panel).getByRole("button", { name: /^Download/ }));
}
