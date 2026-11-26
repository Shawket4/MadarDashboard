import { describe, expect, it } from "vitest";

import { csvField, csvValue, toCsv } from "@/lib/csv";

const CAIRO = "Africa/Cairo";

describe("a CSV field", () => {
  it("quotes what RFC 4180 asks: commas, quotes, line breaks", () => {
    expect(csvField("Latte")).toBe("Latte");
    expect(csvField("Cup, 12oz")).toBe('"Cup, 12oz"');
    expect(csvField('The "big" one')).toBe('"The ""big"" one"');
    expect(csvField("two\nlines")).toBe('"two\nlines"');
    expect(csvField("cr\rhere")).toBe('"cr\rhere"');
  });

  it("never lets a spreadsheet run a cell as a formula", () => {
    expect(csvField("=HYPERLINK(\"x\")")).toBe('"\'=HYPERLINK(""x"")"');
    expect(csvField("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvField("+cmd|' /C calc'!A0")).toBe("'+cmd|' /C calc'!A0");
    expect(csvField("-2+3")).toBe("'-2+3");
    // A phone number or a signed amount is data, kept as it is.
    expect(csvField("+20 2 0000 0000")).toBe("+20 2 0000 0000");
    expect(csvField("-12.50")).toBe("-12.50");
  });
});

describe("a CSV value", () => {
  it("writes numbers a program can read: no currency, no grouping, no float noise", () => {
    expect(csvValue(162050, "money", CAIRO)).toBe("1620.50");
    expect(csvValue(-850, "money", CAIRO)).toBe("-8.50");
    expect(csvValue(12.5, "moneyRaw", CAIRO)).toBe("12.50");
    expect(csvValue(1234567.891, "number", CAIRO)).toBe("1234567.891");
    expect(csvValue(0.1 + 0.2, "number", CAIRO)).toBe("0.3");
    expect(csvValue(7.6, "integer", CAIRO)).toBe("8");
    expect(csvValue(18.5, "quantity", CAIRO)).toBe("18.5");
    expect(csvValue(0.412, "percent", CAIRO)).toBe("41.2%");
    expect(csvValue(true, "bool", CAIRO)).toBe("true");
    expect(csvValue(null, "money", CAIRO)).toBe("");
  });

  it("dates on the shop's clock, never UTC's or the device's", () => {
    // 23:30 UTC on 31 Oct is 01:30 on 1 Nov in Cairo (UTC+2).
    expect(csvValue("2026-10-31T23:30:00Z", "dateTime", CAIRO)).toBe("2026-11-01 01:30");
    expect(csvValue("2026-10-31T23:30:00Z", "date", CAIRO)).toBe("2026-11-01");
    expect(csvValue("2026-10-31T23:30:00Z", "dateTime", "Asia/Dubai")).toBe("2026-11-01 03:30");
    // A calendar date is the shop's already: it never moves through a zone.
    expect(csvValue("2026-11-26", "date", "America/New_York")).toBe("2026-11-26");
    expect(csvValue("not a date", "date", CAIRO)).toBe("");
  });

  it("Arabic text goes out as it is", () => {
    expect(csvValue("لاتيه", "text", CAIRO)).toBe("لاتيه");
  });
});

describe("a CSV file", () => {
  it("is the mark, the header and the rows: no banner, no totals", () => {
    const sheet = {
      name: "Orders",
      title: "Orders",
      totals: true,
      columns: [
        { header: "Order, no.", accessor: (r: Record<string, unknown>) => r.no as string, type: "text" as const },
        { header: "Total", accessor: (r: Record<string, unknown>) => r.total as number, type: "money" as const, total: true },
      ],
      rows: [{ no: "ZM-1", total: 4500 }, { no: "ZM-2", total: 1250 }],
    };
    expect(toCsv(sheet, CAIRO)).toBe('﻿"Order, no.",Total\r\nZM-1,45.00\r\nZM-2,12.50\r\n');
  });
});
