import { describe, expect, it } from "vitest";
import type { ComputedPayslip } from "@/data/api/generated/models";
import { linesTotal, payslipLines } from "./lines";

const slip = (over: Partial<ComputedPayslip> = {}): ComputedPayslip =>
  ({
    employee_id: "u", name: "Sara", base_piastres: 900_000, base_salary_piastres: 900_000,
    net_piastres: 842_000, overtime_piastres: 0, overtime_minutes: 0, bonuses_piastres: 12_000,
    deductions_piastres: 20_000, advance_installment_piastres: 50_000, carry_out_piastres: 0,
    absent_days: 0, leave_days: 0, late_minutes: 0, worked_days: 20,
    breakdown: {
      paid_days: 31, window_days: 31,
      bonuses: [{ id: null, kind: "cover", reason: "cover", piastres: 12_000 }],
      deductions: [
        { id: "d1", reason: "Late", piastres: 5_000, source: "late_penalty" },
        { id: "d2", reason: "Broke a glass", piastres: 15_000, source: "manual" },
      ],
      advances: [{ id: "v1", applied_piastres: 50_000 }],
    },
    ...over,
  }) as ComputedPayslip;

describe("payslipLines", () => {
  it("adds up to the server's net", () => {
    const lines = payslipLines(slip());
    expect(lines.reduce((s, l) => s + l.amount, 0)).toBe(842_000);
  });

  it("keeps rule lines waivable and manual lines deletable (AD-7)", () => {
    const lines = payslipLines(slip());
    const late = lines.find((l) => l.key === "d|d1")!;
    expect(late).toMatchObject({ rule: true, deductionId: "d1" });
    expect(late.manual).toBeUndefined();
    const glass = lines.find((l) => l.key === "d|d2")!;
    expect(glass).toMatchObject({ rule: false, manual: { kind: "deduction", id: "d2" } });
    const cover = lines.find((l) => l.labelKey === "dawam.lineCover")!;
    expect(cover.manual).toBeUndefined();
  });

  it("names a partial month and the carried shortfall (PAY-12, PAY-13)", () => {
    const lines = payslipLines(
      slip({
        breakdown: {
          paid_days: 10, window_days: 31, bonuses: [], advances: [],
          deductions: [{ id: null, kind: "carry", reason: "carry", piastres: 3_000 }],
        },
      }),
    );
    expect(lines[0]).toMatchObject({ labelKey: "dawam.lineSalaryPartial", vars: { paid: 10, window: 31 } });
    expect(lines.find((l) => l.key === "carry")).toMatchObject({ amount: -3_000, rule: false });
  });

  it("strikes a waived deduction and leaves it out of the net (AD-8)", () => {
    const lines = payslipLines(
      slip({
        net_piastres: 847_000, deductions_piastres: 15_000,
        breakdown: {
          paid_days: 31, window_days: 31, advances: [{ id: "v1", applied_piastres: 50_000 }],
          bonuses: [{ id: null, kind: "cover", reason: "cover", piastres: 12_000 }],
          deductions: [
            { id: "d1", reason: "Late", piastres: 5_000, source: "late_penalty", waived: true },
            { id: "d2", reason: "Broke a glass", piastres: 15_000, source: "manual" },
          ],
        },
      }),
    );
    const late = lines.find((l) => l.key === "d|d1")!;
    expect(late).toMatchObject({ waived: true, amount: -5_000 });
    // Already waived: nothing left to waive.
    expect(late.deductionId).toBeUndefined();
    expect(linesTotal(lines)).toBe(847_000);
  });
});
