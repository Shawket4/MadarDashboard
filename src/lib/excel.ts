/**
 * Generic, branded Excel export engine (rebuilt for the new data layer).
 *
 * Callers pass a declarative, typed column spec; this builds a styled workbook:
 *   branded banner (+ optional rasterized SVG logo), stat pills, zebra rows,
 *   typed number formats, an optional SUM totals row, and multiple sheets.
 * ExcelJS is imported lazily so it never lands in the initial bundle.
 */
import type * as ExcelJSNS from "exceljs";
import { rules } from "@/lib/rules";
import { toast } from "@/components/ui/toast";
import i18n from "@/i18n";
import { getErrorMessage } from "@/data/api/errors";
import { downloadBlob } from "@/lib/download";
import { businessDate, fmtDate, fmtDateTimeFull, fmtMoney, fmtNumber, fmtPercent, getActiveTz } from "@/lib/format";
import { getExportFormat } from "@/lib/export-format";
import { renderPdf } from "@/data/api/generated/api";
import type { PrintBlock, PrintDoc, PrintSheet } from "@/data/api/generated/models";

export type ColumnType =
  | "text"
  | "money"
  | "moneyRaw"
  | "number"
  | "integer"
  | "percent"
  | "date"
  | "dateTime"
  | "bool"
  /** An amount as it is (18, 0.5, 12.25): no fixed decimals. */
  | "quantity";

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

/** One cell of a table in a sheet of tables: a value, or a value and its type. */
export type ExcelCell =
  | string
  | number
  | null
  | { value: string | number | Date | boolean | null | undefined; type?: ColumnType };

/**
 * One titled table inside a sheet of several (a drink's recipe). Its first
 * column is the row's label; the rest are values.
 */
export interface ExcelBlock {
  title: string;
  /** Muted words after the title (what it follows, that it is off the menu). */
  note?: string;
  /** Column headers. */
  header: string[];
  /** Body rows, zebra-striped like every sheet's. */
  rows: ExcelCell[][];
  /** Summary rows under the body (cost, price, food cost): bold, ruled above. */
  footer?: ExcelCell[][];
  /** A wrapped line under the table (how it's made). */
  caption?: string;
}

/** A band naming what the tables under it belong to (a category). */
export interface ExcelGroup {
  group: string;
  blocks: ExcelBlock[];
}

/**
 * A sheet of tables rather than one: the same banner, subtitle and stat pills
 * as every sheet, then groups of titled tables, one after another.
 */
export interface ExcelBlockSheet {
  kind: "blocks";
  name: string;
  title: string;
  subtitle?: string;
  stats?: ExcelStat[];
  /** One width per column, shared by every table (a sheet has one set of columns). */
  widths: number[];
  groups: ExcelGroup[];
}

export type AnySheet = ExcelSheet<Record<string, unknown>> | ExcelBlockSheet;

export const isBlockSheet = (s: AnySheet): s is ExcelBlockSheet => (s as ExcelBlockSheet).kind === "blocks";

/** What a sheet holds, for "nothing to export" and the done toast: rows, or tables. */
const sheetSize = (s: AnySheet): number =>
  isBlockSheet(s) ? s.groups.reduce((n, g) => n + g.blocks.length, 0) : s.rows.length;

export interface ExcelConfig {
  filename: string;
  meta?: string;
  logoUrl?: string;
  // Sheets may have heterogeneous row types.
  sheets: AnySheet[];
  /** The success toast's words, when "Exported N rows" would miscount (a sheet of tables). */
  doneMessage?: string;
}

/**
 * Ink on paper (owner, 2026-11-25: "use ink for all export tokens"). Every
 * band, title and figure an export draws is ink; the page is white paper with
 * a cool tint for the zebra rows; secondary words are slate. The Flutter
 * dashboard's `ExcelPalette` (dashboard_core export.dart) and its xlsx writer
 * carry the same values.
 */
const INK = "FF14181E";

/**
 * The one typeface every workbook is set in: the dashboard's own (owner,
 * 2026-11-25). A spreadsheet cannot embed a font, so a viewer without it
 * installed sees their app's default instead; the PDF export embeds it.
 */
export const EXPORT_FONT = "IBM Plex Sans Arabic";
const PALETTE = {
  brand: INK, // the banner title, the header and totals bands
  accent: INK, // group bands and stat figures
  white: "FFFFFFFF", // paper
  zebra: "FFEDF2F3", // cool off-white (paper tint)
  border: "FFD7E0E1",
  text: INK,
  muted: "FF76828B", // slate
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
    // Excel's own General format: 18, 0.5, 12.25, never "18.00".
    case "quantity":
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
  const ms = d.getTime();
  // The wall clock is madar-time's `local_parts`; seconds carry over as they are (zones move by whole minutes).
  const { date, hour, minute } = rules.local_parts(tz, ms);
  const wallUtcMs = Date.parse(`${date}T00:00:00Z`) + (hour * 60 + minute) * 60_000 + (((ms % 60_000) + 60_000) % 60_000);
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
    case "quantity":
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

/**
 * Rows 1–6 of every sheet, whichever kind: the banner (the title, with the logo
 * at its start), the subtitle line, and the stat pills, which share out the
 * first `statColumns` columns.
 */
function drawHead(
  ws: ExcelJSNS.Worksheet,
  head: { title: string; subtitle?: string; stats?: ExcelStat[] },
  statColumns: number,
  lastPadded: string,
  meta: string | undefined,
  logoId: number | undefined,
  logoExt: { width: number; height: number },
): void {
  // Banner
  ws.mergeCells(`A1:${lastPadded}1`);
  ws.getRow(1).height = 60;
  const title = ws.getCell("A1");
  title.value = head.title;
  title.font = { name: EXPORT_FONT, size: 16, bold: true, color: { argb: PALETTE.brand } };
  title.alignment = { horizontal: "right", vertical: "middle", indent: 2 };
  if (logoId !== undefined) {
    ws.addImage(logoId, { tl: { col: 0.2, row: 0.3 }, ext: logoExt, editAs: "oneCell" });
  }

  ws.mergeCells(`A2:${lastPadded}2`);
  const sub = ws.getCell("A2");
  sub.value = [head.subtitle, meta, `${i18n.t("excel.generated", "Generated")}: ${fmtDateTimeFull(new Date())}`]
    .filter(Boolean)
    .join("  ·  ");
  sub.font = { name: EXPORT_FONT, size: 9, color: { argb: PALETTE.muted } };
  sub.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(3).height = 6;

  // Stat pills (rows 4–5). They share out the sheet's columns, and never
  // fewer columns than there are pills: a recipe book whose widest drink has
  // one size is three columns and four pills, and sharing three among four
  // merged two pills over one cell, which fails the whole workbook.
  if (head.stats?.length) {
    const across = Math.max(statColumns, head.stats.length);
    const span = Math.max(1, Math.floor(across / head.stats.length));
    head.stats.forEach((stat, i) => {
      const a = colLetter(i * span);
      const b = colLetter(Math.min(i * span + span - 1, across - 1));
      ws.mergeCells(`${a}4:${b}4`);
      const lc = ws.getCell(`${a}4`);
      lc.value = stat.label;
      lc.font = { name: EXPORT_FONT, size: 8, color: { argb: PALETTE.muted } };
      lc.alignment = { horizontal: "center" };
      ws.mergeCells(`${a}5:${b}5`);
      const vc = ws.getCell(`${a}5`);
      vc.value = stat.value;
      vc.font = { name: EXPORT_FONT, size: 12, bold: true, color: { argb: PALETTE.accent } };
      vc.alignment = { horizontal: "center" };
      if (stat.type === "money") vc.numFmt = '#,##0.00 "EGP"';
      else if (stat.type === "number") vc.numFmt = "#,##0";
    });
  }
  ws.getRow(6).height = 6;
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

  const lastPadded = colLetter(cols.length - 1);
  drawHead(ws, sheet, sheet.columns.length, lastPadded, meta, logoId, logoExt);

  // Header (row 7)
  const header = ws.addRow(sheet.columns.map((c) => c.header));
  header.height = 26;
  header.eachCell((cell) => {
    cell.font = { name: EXPORT_FONT, size: 10, bold: true, color: { argb: PALETTE.white } };
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
      cell.font = { name: EXPORT_FONT, size: 10, color: { argb: PALETTE.text } };
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
      cell.font = { name: EXPORT_FONT, size: 10, bold: true, color: { argb: PALETTE.white } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PALETTE.brand } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      const fmt = numFmt(sheet.columns[colNum - 1]?.type);
      if (fmt) cell.numFmt = fmt;
    });
  }
}

/** A block cell's value and type, whichever way it was given. */
const cellOf = (c: ExcelCell): { value: unknown; type: ColumnType | undefined } =>
  c !== null && typeof c === "object" ? { value: c.value, type: c.type } : { value: c, type: undefined };

/**
 * How tall a merged, wrapped line of `text` must be across columns of these
 * widths. Excel never grows a merged row to fit, so the height is set: about
 * one character per width unit at 9 pt, 12 pt a line.
 */
export const captionHeight = (text: string, widths: number[]): number => {
  const perLine = Math.max(20, Math.floor(widths.reduce((a, w) => a + w, 0) * 1.1));
  const lines = text.split("\n").reduce((n, l) => n + Math.max(1, Math.ceil(l.length / perLine)), 0);
  return Math.max(18, lines * 12 + 6);
};

/**
 * A sheet of tables (`ExcelBlockSheet`). Rows 1–6 are every sheet's head; then,
 * per group, a band in the accent colour, and per table: its title (bold, brand
 * ink, the note muted after it), the header band, zebra body rows, bold footer
 * rows ruled off above, the caption wrapped across the sheet, and a gap.
 * The first column of a table is its row labels, so it reads from the start;
 * the rest are centred like every sheet's values. Portrait, one page wide.
 */
function buildBlockSheet(
  wb: ExcelJSNS.Workbook,
  sheet: ExcelBlockSheet,
  meta: string | undefined,
  logoId: number | undefined,
  logoExt: { width: number; height: number },
): void {
  const ws = wb.addWorksheet(cleanSheetName(sheet.name), {
    pageSetup: { fitToPage: true, fitToWidth: 1, fitToHeight: 0, orientation: "portrait" },
  });
  const widths = [...sheet.widths];
  while (widths.length < 6) widths.push(18);
  ws.columns = widths.map((width, i) => ({ key: String(i), width }));
  const lastPadded = colLetter(widths.length - 1);
  drawHead(ws, sheet, sheet.widths.length, lastPadded, meta, logoId, logoExt);

  const font = (extra: Partial<ExcelJSNS.Font> = {}): Partial<ExcelJSNS.Font> => ({
    name: EXPORT_FONT,
    size: 10,
    color: { argb: PALETTE.text },
    ...extra,
  });
  const fill = (argb: string): ExcelJSNS.Fill => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
  const align = (col: number): Partial<ExcelJSNS.Alignment> =>
    col === 0 ? { vertical: "middle", horizontal: "left", indent: 1 } : { vertical: "middle", horizontal: "center" };

  let r = 7;
  const writeCells = (row: number, cells: ExcelCell[], style: (col: number, cell: ExcelJSNS.Cell) => void) => {
    cells.forEach((c, col) => {
      const { value, type } = cellOf(c);
      const cell = ws.getCell(row, col + 1);
      cell.value = coerce(value, type) as ExcelJSNS.CellValue;
      const fmt = numFmt(type);
      if (fmt) cell.numFmt = fmt;
      style(col, cell);
    });
  };

  for (const group of sheet.groups) {
    ws.mergeCells(`A${r}:${lastPadded}${r}`);
    const band = ws.getCell(`A${r}`);
    band.value = group.group;
    band.font = font({ size: 12, bold: true, color: { argb: PALETTE.white } });
    band.fill = fill(PALETTE.accent);
    band.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    ws.getRow(r).height = 24;
    ws.getRow(r + 1).height = 6;
    r += 2;

    for (const block of group.blocks) {
      const ncols = Math.max(1, block.header.length);

      // Title, the note muted after it.
      ws.mergeCells(`A${r}:${lastPadded}${r}`);
      const title = ws.getCell(`A${r}`);
      title.value = block.note
        ? {
            richText: [
              { text: block.title, font: font({ size: 12, bold: true, color: { argb: PALETTE.brand } }) },
              { text: `   ${block.note}`, font: font({ size: 9, color: { argb: PALETTE.muted } }) },
            ],
          }
        : block.title;
      title.font = font({ size: 12, bold: true, color: { argb: PALETTE.brand } });
      title.alignment = { vertical: "bottom", horizontal: "left" };
      ws.getRow(r).height = 22;
      r += 1;

      if (block.header.length) {
        block.header.forEach((h, col) => {
          const cell = ws.getCell(r, col + 1);
          cell.value = h;
          cell.font = font({ bold: true, color: { argb: PALETTE.white } });
          cell.fill = fill(PALETTE.brand);
          cell.alignment = { ...align(col), wrapText: true };
        });
        ws.getRow(r).height = 22;
        r += 1;
      }

      block.rows.forEach((cells, idx) => {
        const zebra = idx % 2 === 0 ? PALETTE.zebra : PALETTE.white;
        // Every column of the table is filled, a cell left blank included.
        const padded = [...cells, ...Array<ExcelCell>(Math.max(0, ncols - cells.length)).fill(null)];
        writeCells(r, padded, (col, cell) => {
          cell.font = font();
          cell.fill = fill(zebra);
          cell.alignment = align(col);
        });
        ws.getRow(r).height = 20;
        r += 1;
      });

      (block.footer ?? []).forEach((cells, idx) => {
        const padded = [...cells, ...Array<ExcelCell>(Math.max(0, ncols - cells.length)).fill(null)];
        writeCells(r, padded, (col, cell) => {
          cell.font = font({ bold: true });
          cell.fill = fill(PALETTE.white);
          cell.alignment = align(col);
          if (idx === 0) cell.border = { top: { style: "thin", color: { argb: PALETTE.brand } } };
        });
        ws.getRow(r).height = 20;
        r += 1;
      });

      if (block.caption) {
        ws.mergeCells(`A${r}:${lastPadded}${r}`);
        const cap = ws.getCell(`A${r}`);
        cap.value = block.caption;
        cap.font = font({ size: 9, color: { argb: PALETTE.muted } });
        cap.alignment = { vertical: "top", horizontal: "left", wrapText: true, indent: 1 };
        ws.getRow(r).height = captionHeight(block.caption, widths);
        r += 1;
      }

      ws.getRow(r).height = 10;
      r += 1;
    }
  }
}

const csvCell = (v: string): string => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

const csvValue = (raw: unknown, type: ColumnType | undefined): string => {
  if (raw == null) return "";
  switch (type) {
    case "money":
      return csvCell(String(typeof raw === "number" ? raw / 100 : raw));
    case "date":
    case "dateTime": {
      const d = raw instanceof Date ? raw : new Date(String(raw));
      return Number.isNaN(d.getTime()) ? "" : d.toISOString();
    }
    default:
      return csvCell(String(raw));
  }
};

export interface CsvConfig {
  filename: string;
  sheets: ExcelSheet<Record<string, unknown>>[];
}

/**
 * CSV sibling of `exportToExcel` — no ExcelJS, no styling, just rows. RFC 4180
 * quoting, `money` columns divided back to a plain number, dates as ISO strings.
 *
 * A CSV is one flat file, so a multi-sheet config exports only the first sheet.
 * ponytail: no zip dependency in this repo for a "one file per sheet" export;
 * add one (or a zip lib) only if a multi-sheet CSV is actually requested.
 */
export async function exportToCsv(config: CsvConfig): Promise<void> {
  const t = i18n.getFixedT(null, "translation");
  const sheet = config.sheets[0];
  if (!sheet || config.sheets.every((s) => s.rows.length === 0)) {
    toast.error(t("excel.nothingToExport", "Nothing to export"));
    return;
  }
  if (config.sheets.length > 1) {
    console.warn(`exportToCsv: ${config.sheets.length} sheets given, exporting only "${sheet.name}"`);
  }

  const header = sheet.columns.map((c) => csvCell(c.header)).join(",");
  const lines = sheet.rows.map((row) =>
    sheet.columns.map((c) => csvValue(c.accessor(row), c.type)).join(","),
  );
  const blob = new Blob([[header, ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `${config.filename}-${businessDate()}.csv`); // the shop's today, not UTC's
  toast.success(t("excel.done", { count: sheet.rows.length, defaultValue: `Exported ${sheet.rows.length} rows` }));
}

// ── The PDF of the same sheets ───────────────────────────────────────────────
//
// A spreadsheet cannot carry its typeface; a PDF can. The backend draws the
// pages (`POST /exports/pdf`, MadarRust src/exports/pdf.rs) for both
// dashboards, in IBM Plex Sans Arabic, embedded. This side turns the very
// sheets a workbook is built from into that document, every value written
// out the way the dashboard shows it, so a PDF and a workbook of one export
// always agree.

/** A cell as the person reads it. */
export const displayValue = (raw: unknown, type: ColumnType | undefined): string => {
  if (raw == null || raw === "") return "";
  switch (type) {
    case "money":
      return typeof raw === "number" ? fmtMoney(raw) : String(raw);
    case "moneyRaw":
      return typeof raw === "number" ? fmtMoney(Math.round(raw * 100)) : String(raw);
    case "number":
      return fmtNumber(Number(raw), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case "integer":
      return fmtNumber(Number(raw), { maximumFractionDigits: 0 });
    case "percent":
      return fmtPercent(Number(raw));
    case "quantity":
      return fmtNumber(Number(raw), { maximumFractionDigits: 3 });
    case "date":
      return fmtDate(raw instanceof Date ? raw : String(raw));
    case "dateTime":
      return fmtDateTimeFull(raw instanceof Date ? raw : String(raw));
    case "bool":
      return raw ? "✓" : "—";
    default:
      return String(raw);
  }
};

const statValue = (s: ExcelStat): string =>
  typeof s.value === "number" && s.type === "money"
    ? fmtMoney(s.value * 100)
    : typeof s.value === "number" && s.type === "number"
      ? fmtNumber(s.value, { maximumFractionDigits: 0 })
      : String(s.value);

/** The line under every sheet's banner: its subtitle, the export's meta, when. */
const subtitleLine = (subtitle: string | undefined, meta: string | undefined): string =>
  [subtitle, meta, `${i18n.t("excel.generated", "Generated")}: ${fmtDateTimeFull(new Date())}`].filter(Boolean).join("  ·  ");

const cellText = (c: ExcelCell): string => {
  const { value, type } = cellOf(c);
  return displayValue(value, type);
};

/** One sheet, as the document the backend prints. */
const printSheet = (sheet: AnySheet, meta: string | undefined): PrintSheet => {
  const head = {
    title: sheet.title,
    subtitle: subtitleLine(sheet.subtitle, meta),
    stats: (sheet.stats ?? []).map((s) => ({ label: s.label, value: statValue(s) })),
  };
  if (isBlockSheet(sheet)) {
    const blocks: PrintBlock[] = [];
    for (const group of sheet.groups) {
      blocks.push({ kind: "group", text: group.group });
      for (const b of group.blocks) {
        blocks.push({
          kind: "table",
          title: b.title,
          note: b.note ?? null,
          // The first column is the row's label: it reads from the start.
          columns: b.header.map((header, i) => ({ header, width: sheet.widths[i] ?? 15, align: i === 0 ? "start" : "center" })),
          rows: b.rows.map((r) => b.header.map((_, i) => cellText(r[i] ?? null))),
          footer: (b.footer ?? []).map((r) => b.header.map((_, i) => cellText(r[i] ?? null))),
          caption: b.caption ?? null,
        });
      }
    }
    return { ...head, landscape: false, blocks };
  }
  const totals = sheet.totals && sheet.rows.length > 0
    ? sheet.columns.map((c, i) => {
        if (!c.total) return i === 0 ? i18n.t("excel.totals", "TOTALS") : "";
        const sum = sheet.rows.reduce((acc, r) => acc + (Number(c.accessor(r)) || 0), 0);
        return displayValue(sum, c.type);
      })
    : null;
  return {
    ...head,
    landscape: true,
    blocks: [
      {
        kind: "table",
        columns: sheet.columns.map((c) => ({ header: c.header, width: c.width ?? 20, align: "center" })),
        rows: sheet.rows.map((r) => sheet.columns.map((c) => displayValue(c.accessor(r), c.type))),
        totals,
      },
    ],
  };
};

/** The whole export, as the document the backend prints. */
export const toPrintDoc = (config: ExcelConfig): PrintDoc => ({
  filename: `${config.filename}-${businessDate()}`,
  rtl: (i18n.resolvedLanguage ?? i18n.language ?? "en").startsWith("ar"),
  sheets: config.sheets.map((s) => printSheet(s, config.meta)),
});

/** The PDF of `config`'s sheets: toasts and failures exactly as the workbook's. */
export async function exportToPdf(config: ExcelConfig): Promise<void> {
  const t = i18n.getFixedT(null, "translation");
  if (config.sheets.every((s) => sheetSize(s) === 0)) {
    toast.error(t("excel.nothingToExport", "Nothing to export"));
    return;
  }
  const toastId = toast.loading(t("excel.generatingPdf", "Generating PDF…"));
  try {
    const doc = toPrintDoc(config);
    const pdf = await renderPdf(doc);
    downloadBlob(new Blob([pdf], { type: "application/pdf" }), `${doc.filename}.pdf`);
    const total = config.sheets.reduce((s, sh) => s + sheetSize(sh), 0);
    toast.success(config.doneMessage ?? t("excel.done", { count: total, defaultValue: `Exported ${total} rows` }), {
      id: toastId,
    });
  } catch (err) {
    console.error("PDF export failed", err);
    // The server's own words when it refused (a document too large to print).
    toast.error(getErrorMessage(err) || t("excel.failed", "Export failed"), { id: toastId });
    throw new ExportFailed(err);
  }
}

/**
 * The export, in the format chosen at the top of the Export menu
 * (`lib/export-format`): the workbook, or a PDF of the same sheets.
 */
export async function exportToExcel(config: ExcelConfig): Promise<void> {
  if (getExportFormat() === "pdf") return exportToPdf(config);
  const t = i18n.getFixedT(null, "translation");
  if (config.sheets.every((s) => sheetSize(s) === 0)) {
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
    wb.creator = "Madar";

    let logoId: number | undefined;
    let logoExt = { width: 140, height: 48 };
    const logo = await loadLogo(config.logoUrl ?? "/madar.svg");
    if (logo) {
      logoId = wb.addImage({ buffer: logo.buffer, extension: "png" });
      logoExt = { width: logo.width, height: logo.height };
    }

    for (const sheet of config.sheets) {
      if (isBlockSheet(sheet)) buildBlockSheet(wb, sheet, config.meta, logoId, logoExt);
      else buildSheet(wb, sheet, config.meta, logoId, logoExt);
    }

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    downloadBlob(blob, `${config.filename}-${businessDate()}.xlsx`); // the shop's today, not UTC's

    const total = config.sheets.reduce((s, sh) => s + sheetSize(sh), 0);
    toast.success(config.doneMessage ?? t("excel.done", { count: total, defaultValue: `Exported ${total} rows` }), {
      id: toastId,
    });
  } catch (err) {
    console.error("Excel export failed", err);
    toast.error(t("excel.failed", "Export failed"), { id: toastId });
    // Rethrown so the Export button shakes; the toast above is the only one.
    throw new ExportFailed(err);
  }
}

/** A workbook that failed to build. exportToExcel has already toasted "Export failed". */
class ExportFailed extends Error {
  constructor(cause: unknown) {
    super("Export failed", { cause });
    this.name = "ExportFailed";
  }
}

/**
 * The one toast for a failed export, in every export handler's catch: a fetch
 * that failed gets its message; a workbook that failed was already toasted.
 */
export function toastExportError(e: unknown) {
  if (!(e instanceof ExportFailed)) toast.error(getErrorMessage(e));
}
