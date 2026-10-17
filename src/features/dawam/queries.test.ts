import { describe, expect, it } from "vitest";
import { staffReportsParams, staffReportsTabs } from "./queries";

describe("staffReportsTabs", () => {
  const all = { attendance: true, pay: true, pos: true };

  it("opens on the picked tab, else the first one the person may see", () => {
    expect(staffReportsTabs("payroll", all).tab).toBe("payroll");
    expect(staffReportsTabs("", all).tab).toBe("attendance");
    expect(staffReportsTabs("", { ...all, attendance: false }).tab).toBe("labour");
  });

  it("never opens a tab the person can't see", () => {
    expect(staffReportsTabs("labour", { ...all, pos: false })).toEqual({ tabs: ["attendance", "payroll", "advances"], tab: "attendance" });
    expect(staffReportsTabs("payroll", { attendance: true, pay: false, pos: true }).tab).toBe("attendance");
  });
});

describe("staffReportsParams", () => {
  it("reads a picked range as it is, with the scope's branch", () => {
    expect(staffReportsParams("b1", { from: "2026-09-01", to: "2026-09-30", tab: "" }, 26)).toEqual({
      from: "2026-09-01", to: "2026-09-30", branch_id: "b1",
    });
  });
});
