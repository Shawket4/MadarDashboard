import { afterEach, describe, expect, it, vi } from "vitest";
import { APP_TZ } from "@/data/config/constants";
import { useAppStore } from "@/data/stores/app.store";
import { exportToCsv, exportToExcel, toExcelDateSerial } from "@/lib/excel";

const downloadBlob = vi.fn();
vi.mock("@/lib/download", () => ({ downloadBlob: (...a: unknown[]) => downloadBlob(...a) }));

/** Decode an Excel serial the way ExcelJS/Excel does, then read it with getUTC*
 *  to recover the wall-clock digits the cell will display. */
const decodeWallClock = (serial: number): Date =>
  new Date(Math.round((serial - 25569) * 86_400_000));

/** Expected wall-clock parts for `instant` in `tz`, via Intl (same IANA data). */
const wallParts = (instant: Date, tz: string) => {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  })
    .formatToParts(instant)
    .reduce<Record<string, string>>((a, x) => { a[x.type] = x.value; return a; }, {});
  return { y: +p.year, m: +p.month, d: +p.day, h: +(p.hour === "24" ? "0" : p.hour), min: +p.minute };
};

describe("toExcelDateSerial", () => {
  it("encodes the branch-local wall clock, not UTC (positive offset)", () => {
    const utc = new Date("2026-06-15T22:30:00Z"); // Cairo (+2/+3) → next day locally
    const decoded = decodeWallClock(toExcelDateSerial(utc, "Africa/Cairo"));
    const w = wallParts(utc, "Africa/Cairo");
    expect(decoded.getUTCFullYear()).toBe(w.y);
    expect(decoded.getUTCMonth() + 1).toBe(w.m);
    expect(decoded.getUTCDate()).toBe(w.d);
    expect(decoded.getUTCHours()).toBe(w.h);
    expect(decoded.getUTCMinutes()).toBe(w.min);
  });

  it("encodes the branch-local wall clock for a negative-offset zone", () => {
    const utc = new Date("2026-01-01T03:00:00Z"); // New York (−5) → previous day locally
    const decoded = decodeWallClock(toExcelDateSerial(utc, "America/New_York"));
    const w = wallParts(utc, "America/New_York");
    expect(decoded.getUTCFullYear()).toBe(w.y);
    expect(decoded.getUTCMonth() + 1).toBe(w.m);
    expect(decoded.getUTCDate()).toBe(w.d);
    expect(decoded.getUTCHours()).toBe(w.h);
  });

  it("differs from the naive UTC serial by exactly the zone offset", () => {
    const utc = new Date("2026-06-15T22:30:00Z");
    const naiveUtcSerial = 25569 + utc.getTime() / 86_400_000; // ExcelJS's old (buggy) result
    const cairo = toExcelDateSerial(utc, "Africa/Cairo");
    const offsetHours = (cairo - naiveUtcSerial) * 24;
    // Cairo is +2 (standard) or +3 (DST); the fix shifts the serial forward by that.
    expect([2, 3]).toContain(Math.round(offsetHours));
  });
});

describe("an export's file name", () => {
  // 00:30 on 1 November in Dubai (the shop), still 31 October in UTC.
  const shopsToday = () => {
    useAppStore.getState().setActiveTimezone("Asia/Dubai");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-31T20:30:00Z"));
  };
  afterEach(() => {
    vi.useRealTimers();
    useAppStore.getState().setActiveTimezone(APP_TZ);
    downloadBlob.mockClear();
  });
  const sheets = [{ name: "Orders", title: "Orders", columns: [{ header: "No", accessor: (r: Record<string, unknown>) => r.n as number, type: "integer" as const }], rows: [{ n: 1 }] }];

  it("carries the shop's today, not UTC's (CSV)", async () => {
    shopsToday();
    await exportToCsv({ filename: "orders", sheets });
    expect(downloadBlob.mock.calls[0][1]).toBe("orders-2026-11-01.csv");
  });

  it("carries the shop's today, not UTC's (Excel)", async () => {
    shopsToday();
    await exportToExcel({ filename: "orders", sheets });
    expect(downloadBlob.mock.calls[0][1]).toBe("orders-2026-11-01.xlsx");
  });
});

describe("a sheet of tables", () => {
  afterEach(() => downloadBlob.mockClear());

  /** The workbook the last export downloaded, read back with ExcelJS. */
  const lastWorkbook = async () => {
    const blob = downloadBlob.mock.calls.at(-1)?.[0] as Blob;
    const mod = await import("exceljs");
    const ExcelJS = (mod as unknown as { default?: typeof mod }).default ?? mod;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await blob.arrayBuffer());
    return wb;
  };

  const sheet = {
    kind: "blocks" as const,
    name: "Recipes",
    title: "Recipes",
    stats: [{ label: "Items", value: 1, type: "number" as const }],
    widths: [30, 8, 14, 14],
    groups: [
      {
        group: "Coffee",
        blocks: [
          {
            title: "Latte",
            note: "Follows Flat white",
            header: ["Ingredient", "Unit", "Small", "Large"],
            rows: [
              ["Espresso beans", "g", { value: 18, type: "quantity" as const }, { value: 18.5, type: "quantity" as const }],
              ["Vanilla syrup", "ml", null, { value: 20, type: "quantity" as const }],
            ],
            footer: [["Cost", null, { value: 205, type: "money" as const }, { value: 285, type: "money" as const }]],
            caption: "How it's made: 1. Pull a double shot",
          },
        ],
      },
    ],
  };

  it("draws every sheet's head, then the group band and each table in order", async () => {
    await exportToExcel({ filename: "recipes", sheets: [sheet], doneMessage: "Exported 1 recipe" });
    const ws = (await lastWorkbook()).getWorksheet("Recipes")!;

    expect(ws.getCell("A1").value).toBe("Recipes"); // the banner, as on every sheet
    expect(String(ws.getCell("A2").value)).toMatch(/Generated/);
    expect(ws.getCell("A4").value).toBe("Items");
    expect(ws.getCell("A7").value).toBe("Coffee"); // the group band
    expect(ws.getCell("A7").fill).toMatchObject({ fgColor: { argb: "FF2E94A6" } });
    expect(ws.getCell("A9").value).toMatchObject({
      richText: [{ text: "Latte" }, { text: "   Follows Flat white" }],
    });
    expect([1, 2, 3, 4].map((c) => ws.getCell(10, c).value)).toEqual(["Ingredient", "Unit", "Small", "Large"]);
    expect(ws.getCell(10, 1).fill).toMatchObject({ fgColor: { argb: "FF0D6273" } });
    expect([1, 2, 3, 4].map((c) => ws.getCell(11, c).value)).toEqual(["Espresso beans", "g", 18, 18.5]);
    expect(ws.getCell(11, 3).numFmt ?? "General").toBe("General"); // no fixed decimals
    expect(ws.getCell(12, 3).value).toBeNull(); // a size without the line is a blank, still striped
    expect(ws.getCell(12, 3).fill).toMatchObject({ fgColor: { argb: "FFFFFFFF" } });
    expect(ws.getCell(11, 3).fill).toMatchObject({ fgColor: { argb: "FFEDF2F3" } });
    expect(ws.getCell(13, 1).value).toBe("Cost");
    expect(ws.getCell(13, 3).value).toBe(2.05); // money is piastres ÷ 100
    expect(ws.getCell(13, 3).numFmt).toBe('#,##0.00 "EGP"');
    expect(ws.getCell(13, 3).border?.top).toMatchObject({ style: "thin" });
    expect(ws.getCell(13, 1).font?.bold).toBe(true);
    expect(ws.getCell("A14").value).toBe("How it's made: 1. Pull a double shot");
    expect(ws.getCell("A14").alignment?.wrapText).toBe(true);
    expect(ws.getCell(11, 1).alignment?.horizontal).toBe("left"); // the label column reads from the start
    expect(ws.getCell(11, 3).alignment?.horizontal).toBe("center");
  });

  it("counts tables, not rows, and says what it was told to", async () => {
    const { toast } = await import("@/components/ui/toast");
    await exportToExcel({ filename: "recipes", sheets: [sheet], doneMessage: "Exported 1 recipe" });
    expect(vi.mocked(toast.success).mock.calls.at(-1)?.[0]).toBe("Exported 1 recipe");
    vi.mocked(toast.error).mockClear();
    await exportToExcel({ filename: "recipes", sheets: [{ ...sheet, groups: [] }] });
    expect(toast.error).toHaveBeenCalledWith("Nothing to export");
  });

  it("leaves an ordinary sheet exactly where it was: header on row 7, data from row 8", async () => {
    await exportToExcel({
      filename: "orders",
      sheets: [{ name: "Orders", title: "Orders", columns: [{ header: "No", accessor: (r: Record<string, unknown>) => r.n as number, type: "integer" }], rows: [{ n: 4 }] }],
    });
    const ws = (await lastWorkbook()).getWorksheet("Orders")!;
    expect(ws.getCell("A7").value).toBe("No");
    expect(ws.getCell("A8").value).toBe(4);
    expect(ws.views[0]).toMatchObject({ state: "frozen", ySplit: 7 });
  });
});
