/**
 * Generic, branded Excel export engine (rebuilt for the new data layer).
 *
 * Callers pass a declarative, typed column spec; this builds a styled workbook:
 *   branded banner (+ optional rasterized SVG logo), stat pills, zebra rows,
 *   typed number formats, an optional SUM totals row, and multiple sheets.
 * ExcelJS is imported lazily so it never lands in the initial bundle.
 */
import type * as ExcelJSNS from "exceljs";
import { TZDate } from "@date-fns/tz";
import { toast } from "sonner";
import i18n from "@/i18n";
import { fmtDateTimeFull, getActiveTz } from "@/lib/format";

export type ColumnType = "text" | "money" | "moneyRaw" | "number" | "integer" | "percent" | "date" | "dateTime" | "bool";

export interface ExcelColumn<T> {
  /** Optional stable id (unused by the engine; handy for column specs). */
  key?: string;
  header: string;
  accessor: (row: T) => string | number | Date | boolean | null | undefined;
  type?: ColumnType;
  width?: number;
  /** Include this column in the auto-SUM totals row. */
  total?: boolean;
}

export interface ExcelStat {
  label: string;
  value: number | string;
  type?: "money" | "number" | "text";
}

export interface ExcelSheet<T> {
  name: string;
  title: string;
  subtitle?: string;
  columns: ExcelColumn<T>[];
  rows: T[];
  stats?: ExcelStat[];
  totals?: boolean;
}

export interface ExcelConfig {
  filename: string;
  meta?: string;
  logoUrl?: string;
  // Sheets may have heterogeneous row types.
  sheets: ExcelSheet<Record<string, unknown>>[];
}

const PALETTE = {
  brand: "FF0A2540", // navy
  accent: "FFC25B3F", // terracotta
  white: "FFFFFFFF",
  zebra: "FFF6F4F0", // warm off-white
  border: "FFE5E7EB",
  text: "FF111827",
  muted: "FF6B7280",
} as const;

const numFmt = (type: ColumnType | undefined): string | undefined => {
  switch (type) {
    case "money":
    case "moneyRaw":
      return '#,##0.00 "EGP"';
    case "number":
      return "#,##0.00";
    case "integer":
      return "#,##0";
    case "percent":
      return "0.0%";
    case "date":
      return "dd mmm yyyy";
    case "dateTime":
      return "dd mmm yyyy hh:mm AM/PM";
    default:
      return undefined;
  }
};

/**
 * Excel (1900 date system) serial for an instant rendered in `tz`'s wall clock.
 *
 * ExcelJS's `dateToExcel` reads ONLY `Date.getTime()` (the UTC epoch), so passing
 * it a `Date`/`TZDate` encodes the UTC wall clock — exported cells come out offset
 * by the branch's UTC offset from the local time shown in the UI. We instead build
 * the serial from the zone-local parts and hand ExcelJS a plain number (the
 * column's `numFmt` renders it as a date). This matches ExcelJS's own formula
 * (`25569 + getTime()/86_400_000`, default non-1904 workbook) and is independent
 * of the host device timezone.
 */
export const toExcelDateSerial = (d: Date, tz: string): number => {
  const z = new TZDate(d.getTime(), tz);
  const wallUtcMs = Date.UTC(
    z.getFullYear(), z.getMonth(), z.getDate(),
    z.getHours(), z.getMinutes(), z.getSeconds(), z.getMilliseconds(),
  );
  return 25569 + wallUtcMs / 86_400_000;
};

const coerce = (raw: unknown, type: ColumnType | undefined): string | number | Date | null => {
  if (raw == null) return null;
  switch (type) {
    case "money":
      return typeof raw === "number" ? raw / 100 : 0;
    case "moneyRaw":
    case "number":
    case "integer":
    case "percent":
      return typeof raw === "number" ? raw : Number(raw) || 0;
    case "date":
    case "dateTime": {
      const d = raw instanceof Date ? raw : new Date(String(raw));
      if (Number.isNaN(d.getTime())) return null;
      return toExcelDateSerial(d, getActiveTz());
    }
    case "bool":
      return raw ? "✓" : "—";
    default:
      return String(raw);
  }
};

const colLetter = (idx: number): string => {
  let n = idx;
  let s = "";
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
};

const cleanSheetName = (name: string) => name.replace(/[:\\/?*[\]]/g, "").slice(0, 31);

/** Fit (w,h) into a max box, preserving aspect ratio. */
function fitBox(w: number, h: number, maxW = 150, maxH = 52): { width: number; height: number } {
  const ratio = w / h || 3;
  let width = maxW;
  let height = maxW / ratio;
  if (height > maxH) {
    height = maxH;
    width = maxH * ratio;
  }
  return { width: Math.round(width), height: Math.round(height) };
}

/** Rasterize an SVG (or load a raster) logo into a PNG buffer + aspect-correct size. */
async function loadLogo(url: string): Promise<{ buffer: ArrayBuffer; width: number; height: number } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const isSvg = url.toLowerCase().endsWith(".svg") || (res.headers.get("content-type") ?? "").includes("svg");
    if (!isSvg) {
      return { buffer: await res.arrayBuffer(), ...fitBox(150, 50) };
    }
    const svg = await res.text();
    const objectUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const result = await new Promise<{ dataUrl: string; w: number; h: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const nw = img.naturalWidth || 400;
        const nh = img.naturalHeight || 120;
        // Rasterize at higher resolution so the embedded PNG stays crisp.
        const scale = Math.min(3, 900 / nw);
        const w = Math.round(nw * scale);
        const h = Math.round(nh * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas ctx"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ dataUrl: canvas.toDataURL("image/png"), w: nw, h: nh });
      };
      img.onerror = reject;
      img.src = objectUrl;
    });
    URL.revokeObjectURL(objectUrl);
    const bytes = Uint8Array.from(atob(result.dataUrl.split(",")[1]), (c) => c.charCodeAt(0));
    return { buffer: bytes.buffer, ...fitBox(result.w, result.h) };
  } catch {
    return null;
  }
}

function buildSheet(
  wb: ExcelJSNS.Workbook,
  sheet: ExcelSheet<Record<string, unknown>>,
  meta: string | undefined,
  logoId: number | undefined,
  logoExt: { width: number; height: number },
): void {
  const ws = wb.addWorksheet(cleanSheetName(sheet.name), {
    pageSetup: { fitToPage: true, fitToWidth: 1, orientation: "landscape" },
    views: [{ state: "frozen", ySplit: 7 }],
  });

  const cols = sheet.columns.map((c, i) => ({ key: String(i), width: c.width ?? 20 }));
  while (cols.length < 6) cols.push({ key: `_pad${cols.length}`, width: 18 });
  ws.columns = cols;

  const lastCol = colLetter(sheet.columns.length - 1);
  const lastPadded = colLetter(cols.length - 1);

  // Banner
  ws.mergeCells(`A1:${lastPadded}1`);
  ws.getRow(1).height = 60;
  const title = ws.getCell("A1");
  title.value = sheet.title;
  title.font = { name: "Calibri", size: 16, bold: true, color: { argb: PALETTE.brand } };
  title.alignment = { horizontal: "right", vertical: "middle", indent: 2 };
  if (logoId !== undefined) {
    ws.addImage(logoId, { tl: { col: 0.2, row: 0.3 }, ext: logoExt, editAs: "oneCell" });
  }

  ws.mergeCells(`A2:${lastPadded}2`);
  const sub = ws.getCell("A2");
  sub.value = [sheet.subtitle, meta, `${i18n.t("excel.generated", "Generated")}: ${fmtDateTimeFull(new Date())}`]
    .filter(Boolean)
    .join("  ·  ");
  sub.font = { name: "Calibri", size: 9, color: { argb: PALETTE.muted } };
  sub.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(3).height = 6;

  // Stat pills (rows 4–5)
  if (sheet.stats?.length) {
    const span = Math.max(1, Math.floor(sheet.columns.length / sheet.stats.length));
    sheet.stats.forEach((stat, i) => {
      const a = colLetter(i * span);
      const b = colLetter(Math.min(i * span + span - 1, sheet.columns.length - 1));
      ws.mergeCells(`${a}4:${b}4`);
      const lc = ws.getCell(`${a}4`);
      lc.value = stat.label;
      lc.font = { name: "Calibri", size: 8, color: { argb: PALETTE.muted } };
      lc.alignment = { horizontal: "center" };
      ws.mergeCells(`${a}5:${b}5`);
      const vc = ws.getCell(`${a}5`);
      vc.value = stat.value;
      vc.font = { name: "Calibri", size: 12, bold: true, color: { argb: PALETTE.accent } };
      vc.alignment = { horizontal: "center" };
      if (stat.type === "money") vc.numFmt = '#,##0.00 "EGP"';
      else if (stat.type === "number") vc.numFmt = "#,##0";
    });
  }
  ws.getRow(6).height = 6;

  // Header (row 7)
  const header = ws.addRow(sheet.columns.map((c) => c.header));
  header.height = 26;
  header.eachCell((cell) => {
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: PALETTE.white } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PALETTE.brand } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  // Data rows
  const dataStart = 8;
  sheet.rows.forEach((row, idx) => {
    const r = ws.addRow(sheet.columns.map((c) => coerce(c.accessor(row), c.type)));
    r.height = 20;
    r.eachCell({ includeEmpty: true }, (cell, colNum) => {
      const def = sheet.columns[colNum - 1];
      cell.font = { name: "Calibri", size: 10, color: { argb: PALETTE.text } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx % 2 === 0 ? PALETTE.zebra : PALETTE.white } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      const fmt = numFmt(def?.type);
      if (fmt) cell.numFmt = fmt;
    });
  });

  // Totals
  if (sheet.totals && sheet.rows.length > 0) {
    const totals = ws.addRow(
      sheet.columns.map((c, i) =>
        c.total
          ? { formula: `SUM(${colLetter(i)}${dataStart}:${colLetter(i)}${dataStart + sheet.rows.length - 1})` }
          : i === 0
            ? i18n.t("excel.totals", "TOTALS")
            : "",
      ),
    );
    totals.height = 24;
    totals.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: PALETTE.white } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PALETTE.brand } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      const fmt = numFmt(sheet.columns[colNum - 1]?.type);
      if (fmt) cell.numFmt = fmt;
    });
  }

  void lastCol;
}

export async function exportToExcel(config: ExcelConfig): Promise<void> {
  const t = i18n.getFixedT(null, "translation");
  if (config.sheets.every((s) => s.rows.length === 0)) {
    toast.error(t("excel.nothingToExport", "Nothing to export"));
    return;
  }

  const toastId = toast.loading(t("excel.generating", "Generating spreadsheet…"));
  try {
    // exceljs is CommonJS — across bundlers/interop the Workbook constructor may
    // sit on the namespace, on `.default`, or on `.default.default`. Resolve
    // whichever level actually exposes it instead of assuming `.default`.
    const mod = await import("exceljs");
    type WB = { Workbook: typeof ExcelJSNS.Workbook };
    const ExcelJS = [
      mod as unknown as Partial<WB>,
      (mod as { default?: Partial<WB> }).default,
      (mod as { default?: { default?: Partial<WB> } }).default?.default,
    ].find((c): c is WB => typeof c?.Workbook === "function");
    if (!ExcelJS) throw new Error("ExcelJS Workbook constructor not found");
    const wb = new ExcelJS.Workbook();
    wb.creator = "Sufrix";

    let logoId: number | undefined;
    let logoExt = { width: 140, height: 48 };
    const logo = await loadLogo(config.logoUrl ?? "/sufrix.svg");
    if (logo) {
      logoId = wb.addImage({ buffer: logo.buffer, extension: "png" });
      logoExt = { width: logo.width, height: logo.height };
    }

    for (const sheet of config.sheets) buildSheet(wb, sheet, config.meta, logoId, logoExt);

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.filename}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);

    const total = config.sheets.reduce((s, sh) => s + sh.rows.length, 0);
    toast.success(t("excel.done", { count: total, defaultValue: `Exported ${total} rows` }), { id: toastId });
  } catch (err) {
    console.error("Excel export failed", err);
    toast.error(t("excel.failed", "Export failed"), { id: toastId });
  }
}
