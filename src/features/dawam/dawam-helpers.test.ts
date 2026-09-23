/** The pure pieces: coverage grid ↔ bands, the printable payslip, report CSV. */
import { describe, expect, it } from "vitest";

import { fromGrid, toGrid } from "./coverage-editor";
import { payslipHtml } from "./payslip-print";
import { toCsv } from "./reports-page";

describe("coverage grid", () => {
  it("spreads bands into hours and merges equal hours back into bands", () => {
    const needs = [
      { day_of_week: 5, band_start: "08:00:00", band_end: "11:00:00", staff: 2, department_id: null },
      { day_of_week: 5, band_start: "11:00:00", band_end: "12:00:00", staff: 3, department_id: null },
      { day_of_week: 6, band_start: "22:00:00", band_end: "23:59:59", staff: 1, department_id: null },
      { day_of_week: 6, band_start: "09:00:00", band_end: "10:00:00", staff: 4, department_id: "kitchen" },
    ];
    const g = toGrid(needs);
    expect(g.get("5|8")).toBe(2);
    expect(g.get("5|10")).toBe(2);
    expect(g.get("5|11")).toBe(3);
    expect(g.get("6|23")).toBe(1);
    // A department's need isn't on the grid.
    expect(g.get("6|9")).toBeUndefined();
    expect(fromGrid(g)).toEqual(needs.slice(0, 3));
  });
});

describe("printable payslip", () => {
  it("is right-to-left in Arabic and escapes what people typed", () => {
    const html = payslipHtml({
      company: "قهوة مدار",
      period: { start_date: "2026-08-26", end_date: "2026-09-25" },
      person: "<script>x</script>",
      lines: [{ label: "الراتب", line: { key: "salary", label: "Salary", amount: 900_000, rule: false } }],
      net: 900_000,
      labels: { title: "قسيمة المرتب", period: "الفترة", employee: "الموظف", net: "الصافي", waived: "اتنازلت عنه" },
      lang: "ar",
      dir: "rtl",
    });
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("@page{size:A4");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("report CSV", () => {
  it("quotes what needs quoting and exports money in pounds", () => {
    const csv = toCsv(
      [
        { id: "n", header: "Name", value: (r: { n: string; p: number }) => r.n },
        { id: "p", header: "Net", value: (r: { n: string; p: number }) => r.p, money: true },
      ],
      [{ n: 'Sara "S", Ahmed', p: 880_050 }],
    );
    expect(csv).toBe('Name,Net\r\n"Sara ""S"", Ahmed",8800.5');
  });
});
