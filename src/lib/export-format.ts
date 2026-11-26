/**
 * Which file every export makes: the Excel workbook or a PDF of the same
 * sheets. One choice for the whole dashboard, picked at the top of any Export
 * menu and remembered on this device (like the QR output switches): someone
 * who files PDFs wants every export as a PDF, not to be asked each time.
 *
 * `exportToExcel` reads it, so every export in the app honours it without
 * each handler knowing. A CSV is its own format and ignores it.
 */
import { useSyncExternalStore } from "react";

import { safeStorage } from "@/lib/safe-storage";

export type ExportFormat = "xlsx" | "pdf";

const KEY = "madar.export.format";
const listeners = new Set<() => void>();

export const getExportFormat = (): ExportFormat => (safeStorage.getItem(KEY) === "pdf" ? "pdf" : "xlsx");

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
