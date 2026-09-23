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

  it("keeps the waived row's id for undoing the waiver (AT-7)", () => {
    const lines = payslipLines(
      slip({
        breakdown: {
          paid_days: 31, window_days: 31, bonuses: [], advances: [],
          deductions: [{ id: "d1", reason: "Late", piastres: 5_000, source: "late_penalty", waived: true }],
        },
      }),
    );
    expect(lines.find((l) => l.key === "d|d1")).toMatchObject({ waivedId: "d1", deductionId: undefined });
  });

  it("names the capped part so the lines add up to a net of zero (PAY-12)", () => {
    const lines = payslipLines(
      slip({
        net_piastres: 0, deductions_piastres: 900_000, carry_out_piastres: 100_000, bonuses_piastres: 0,
        advance_installment_piastres: 0,
        breakdown: {
          paid_days: 31, window_days: 31, bonuses: [], advances: [], capped_piastres: 100_000,
          deductions: [{ id: "d9", reason: "Damages", piastres: 1_000_000, source: "manual" }],
        },
      }),
    );
    const capped = lines.find((l) => l.key === "capped")!;
    expect(capped).toMatchObject({ amount: 100_000, labelKey: "dawam.lineCapped" });
    // E2E: "Capped at what was earned (152139 carries)" — raw piastres in the words.
    expect(String(capped.vars?.amount)).toMatch(/1,000\.00/);
    expect(capped.label).toMatch(/1,000\.00/);
    expect(linesTotal(lines)).toBe(0);
  });
});

describe("the server's own wording in the reader's language (D-B2)", () => {
  const withLines = (deductions: Record<string, unknown>[]) =>
    payslipLines(slip({ breakdown: { paid_days: 30, window_days: 30, bonuses: [], advances: [], deductions } as never }));

  it("maps each reason code to a key with its figures, and keeps a person's words", async () => {
    const i18n = (await import("@/i18n")).default;
    const lines = withLines([
      { id: "a", piastres: 100, reason: "Late by 24 minutes", reason_code: "late", reason_vars: { minutes: 24 }, source: "late_penalty" },
      { id: "b", piastres: 100, reason: "Absent — no check-in recorded", reason_code: "absent_no_punch", reason_vars: null, source: "absence" },
      { id: "c", piastres: 100, reason: "Unpaid excused time: 40 minutes", reason_code: "unpaid_excused_minutes", reason_vars: { minutes: 40 }, source: "excused_unpaid" },
      { id: "d", piastres: 100, reason: "غادرت الفرع بدون إذن", reason_code: null, source: "left_mid_shift" },
      { id: "e", piastres: 100, reason: "Something new", reason_code: "not_known_yet", source: "absence" },
      // A payslip frozen before the codes existed: no code at all.
      { id: "f", piastres: 100, reason: "Unpaid leave", source: "absence" },
    ]);
    const ar = i18n.getFixedT("ar");
    const label = (id: string) => {
      const l = lines.find((x) => x.key === `d|${id}`)!;
      return l.labelKey ? ar(l.labelKey, { ...l.vars, defaultValue: l.label }) : l.label;
    };
    expect(label("a")).toBe("تأخير 24 دقيقة");
    expect(label("b")).toBe("غياب — لم يُسجَّل حضور");
    expect(label("c")).toBe("وقت إذن غير مدفوع: 40 دقيقة");
    expect(label("d")).toBe("غادرت الفرع بدون إذن");
    expect(label("e")).toBe("Something new");
    expect(label("f")).toBe("Unpaid leave");
  });
});
