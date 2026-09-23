/**
 * A payslip's lines, read from the server's `breakdown`. The server decides
 * every figure (Dawam AT-3); this only lays its numbers out as rows, the same
 * way the staff app's core does (`madar-core/src/dawam.rs::slip_of`).
 */
import type { ComputedPayslip, Payslip } from "@/data/api/generated/models";

export interface PayLine {
  key: string;
  /** i18n key + fallback for rule-made lines; `reason` for manual ones. */
  labelKey?: string;
  label: string;
  vars?: Record<string, string | number>;
  /** Signed piastres: + earning, − deduction. */
  amount: number;
  /** Rule-made (lateness, absence, leaving mid-shift): waivable, never deletable (AD-7). */
  rule: boolean;
  /** A manual bonus or deduction: deletable until the month is approved. */
  manual?: { kind: "bonus" | "deduction"; id: string };
  /** The deduction row behind a rule line, for a waiver or an override. */
  deductionId?: string;
  /** The row behind a WAIVED rule line, for undoing the waiver (AT-7). */
  waivedId?: string;
  /** Waived (AD-8): shown struck through, and not in the net. */
  waived?: boolean;
}

type Breakdown = {
  paid_days?: number;
  window_days?: number;
  /** Deductions past what was earned: carried to the next payslip (PAY-12). */
  capped_piastres?: number;
  bonuses?: { id?: string | null; kind?: string; reason?: string; piastres?: number; source?: string }[];
  deductions?: { id?: string | null; kind?: string; reason?: string; piastres?: number; source?: string; waived?: boolean }[];
  advances?: { id?: string; applied_piastres?: number }[];
};

/** Base pay before overtime, bonuses, deductions and the advance installment. */
export const basePiastres = (p: ComputedPayslip | Payslip): number =>
  "base_piastres" in p && typeof p.base_piastres === "number"
    ? p.base_piastres
    : p.net_piastres - p.overtime_piastres - p.bonuses_piastres + p.deductions_piastres + p.advance_installment_piastres;

/** What the lines add up to: the net, with waived lines left out (AD-8). */
export const linesTotal = (lines: PayLine[]): number => lines.reduce((s, l) => s + (l.waived ? 0 : l.amount), 0);

export function payslipLines(p: ComputedPayslip | Payslip): PayLine[] {
  const b = (p.breakdown ?? {}) as Breakdown;
  const out: PayLine[] = [];
  const paid = b.paid_days ?? 0;
  const window = b.window_days ?? 0;
  const partial = paid > 0 && paid < window;
  out.push({
    key: "salary",
    labelKey: partial ? "dawam.lineSalaryPartial" : "dawam.lineSalary",
    label: partial ? `Salary (${paid} of ${window} days)` : "Salary",
    vars: { paid, window },
    amount: basePiastres(p),
    rule: false,
  });
  if (p.overtime_piastres > 0) {
    out.push({
      key: "ot",
      labelKey: "dawam.lineOvertime",
      label: `Overtime (${p.overtime_minutes} min)`,
      vars: { minutes: p.overtime_minutes },
      amount: p.overtime_piastres,
      rule: false,
    });
  }
  for (const l of b.bonuses ?? []) {
    const kind = l.kind ?? "";
    out.push({
      key: `b|${l.id ?? kind}`,
      labelKey: kind === "cover" ? "dawam.lineCover" : kind === "holiday" ? "dawam.lineHoliday" : undefined,
      label: kind === "cover" ? "Cover shifts" : kind === "holiday" ? "Public holiday worked" : (l.reason ?? ""),
      amount: l.piastres ?? 0,
      rule: false,
      manual: l.id ? { kind: "bonus", id: l.id } : undefined,
    });
  }
  for (const l of b.deductions ?? []) {
    const carry = l.kind === "carry";
    const manual = l.source === "manual";
    out.push({
      key: carry ? "carry" : `d|${l.id}`,
      labelKey: carry ? "dawam.lineCarry" : undefined,
      label: carry ? "Carried from the last payslip" : (l.reason ?? ""),
      amount: -(l.piastres ?? 0),
      rule: !carry && !manual,
      manual: manual && l.id ? { kind: "deduction", id: l.id } : undefined,
      deductionId: !carry && !manual && !l.waived && l.id ? l.id : undefined,
      waivedId: !carry && !manual && l.waived && l.id ? l.id : undefined,
      waived: l.waived || undefined,
    });
  }
  // The deductions above are listed in full; what a payslip could not
  // afford stops here and carries to the next one (PAY-12), so the lines
  // still add up to the net.
  const capped = b.capped_piastres ?? p.carry_out_piastres ?? 0;
  if (capped > 0) {
    out.push({
      key: "capped",
      labelKey: "dawam.lineCapped",
      label: `Capped at what was earned (${capped / 100} carries)`,
      vars: { amount: capped },
      amount: capped,
      rule: false,
    });
  }
  for (const a of b.advances ?? []) {
    const take = a.applied_piastres ?? 0;
    if (!take) continue;
    out.push({
      key: `adv|${a.id}`,
      labelKey: "dawam.lineAdvance",
      label: "Advance installment",
      amount: -take,
      rule: false,
    });
  }
  return out;
}
