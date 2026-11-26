/**
 * The CSV of one sheet: the data, for another program to read.
 *
 * Every export can be a CSV (`exportFile` in `lib/excel`, the format chosen in
 * the Export panel); this module writes the text. A CSV is one flat table, so
 * it is one sheet: a workbook of several asks which (the panel's Sheet), and a
 * sheet of tables (the recipe book) has no CSV.
 *
 * What is written, and why:
 * - A UTF-8 byte-order mark first, so Excel opens Arabic as Arabic rather than
 *   as mojibake (it reads a CSV without one in the machine's code page).
 * - The header row, then the rows: no banner, no totals, nothing a program
 *   would have to skip.
 * - RFC 4180: CRLF between records; a field with a comma, quote or line break
 *   in quotes, its quotes doubled.
 * - Values a program can read, not the dashboard's display: money in pounds
 *   with two decimals and no currency sign (`1620` piastres → `16.20`),
 *   numbers without grouping, a percentage as `41.2%` (Excel and Sheets read
 *   it back as 0.412), dates as `2026-11-26` and times as `2026-11-26 14:05`
 *   on the shop's clock (madar-time, never the device's zone), yes/no as
 *   `true` / `false`.
 * - Text that a spreadsheet would run as a formula (`=…`, `@…`, `+`/`-` not
 *   followed by a number) is prefixed with `'`: customer names come from the
 *   public sign-up, and a CSV is opened in Excel.
 */
import type { ColumnType, ExcelSheet } from "@/lib/excel";
import { rules } from "@/lib/rules";

export const CSV_BOM = "﻿";

/** Text a spreadsheet would evaluate: a formula, or a sign that is not a number's. */
const FORMULA = /^[=@\t\r]|^[+-](?![\d\s().,-]*$)/;

/** One field, guarded and quoted as RFC 4180 asks. */
export const csvField = (text: string): string => {
  const safe = FORMULA.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** A number without float noise or grouping: 0.30000000000000004 → "0.3". */
const plain = (n: number, maxDecimals: number): string => {
  if (!Number.isFinite(n)) return "";
  const s = n.toFixed(maxDecimals);
  return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** An instant on the shop's wall clock: its date, and with `time`, `HH:MM`. */
const onShopClock = (raw: unknown, tz: string, time: boolean): string => {
  // A calendar date is already the shop's: never move it through a zone.
  if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = raw instanceof Date ? raw : new Date(String(raw));
  if (Number.isNaN(d.getTime())) return "";
  const { date, hour, minute } = rules.local_parts(tz, d.getTime());
  return time ? `${date} ${pad(hour)}:${pad(minute)}` : date;
};

/** One value as the CSV writes it (see the module's note). */
export const csvValue = (raw: unknown, type: ColumnType | undefined, tz: string): string => {
  if (raw == null || raw === "") return "";
  const n = typeof raw === "number" ? raw : Number(raw);
  switch (type) {
    case "money":
      return typeof raw === "number" ? (raw / 100).toFixed(2) : csvField(String(raw));
    case "moneyRaw":
      return Number.isFinite(n) ? n.toFixed(2) : csvField(String(raw));
    case "number":
      return Number.isFinite(n) ? plain(n, 4) : csvField(String(raw));
    case "integer":
      return Number.isFinite(n) ? String(Math.round(n)) : csvField(String(raw));
    case "quantity":
      return Number.isFinite(n) ? plain(n, 3) : csvField(String(raw));
    case "percent":
      return Number.isFinite(n) ? `${plain(n * 100, 2)}%` : csvField(String(raw));
    case "date":
      return onShopClock(raw, tz, false);
    case "dateTime":
      return onShopClock(raw, tz, true);
    case "bool":
      return raw ? "true" : "false";
    default:
      return csvField(String(raw));
  }
};

/** The whole file: the mark, the header, the rows. */
export const toCsv = (sheet: ExcelSheet<Record<string, unknown>>, tz: string): string =>
  CSV_BOM +
  [
    sheet.columns.map((c) => csvField(c.header)).join(","),
    ...sheet.rows.map((row) => sheet.columns.map((c) => csvValue(c.accessor(row), c.type, tz)).join(",")),
  ].join("\r\n") +
  "\r\n";
