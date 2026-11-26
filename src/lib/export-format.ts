/**
 * Which file every export makes: the Excel workbook, a PDF, or a CSV. One
 * choice for the whole dashboard, picked at the top of any Export panel and
 * remembered on this device (like the QR output switches): someone who files
 * PDFs, or feeds CSVs to their accountant's program, wants every export that
 * way, not to be asked each time.
 *
 * `exportFile` (`lib/excel`) reads it, so every export in the app honours it
 * without each handler knowing.
 */
import { useSyncExternalStore } from "react";

import { safeStorage } from "@/lib/safe-storage";

export type ExportFormat = "xlsx" | "pdf" | "csv";

const FORMATS: readonly ExportFormat[] = ["xlsx", "pdf", "csv"];

/**
 * What the Export panel picked for one file beyond its format. A PDF or a CSV
 * is one sheet of a workbook that has several: `sheet` is its index in the
 * workbook's `sheets` (the order the file declared them to the panel). Unset,
 * a PDF is the whole workbook and a CSV its one flat sheet.
 */
export interface ExportPick {
  sheet?: number;
}

const KEY = "madar.export.format";
const listeners = new Set<() => void>();

export const getExportFormat = (): ExportFormat => {
  const v = safeStorage.getItem(KEY);
  return FORMATS.find((f) => f === v) ?? "xlsx";
};

export const setExportFormat = (format: ExportFormat): void => {
  safeStorage.setItem(KEY, format);
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** The chosen format, re-rendering when it changes. */
export const useExportFormat = (): [ExportFormat, (f: ExportFormat) => void] => [
  useSyncExternalStore(subscribe, getExportFormat, getExportFormat),
  setExportFormat,
];
