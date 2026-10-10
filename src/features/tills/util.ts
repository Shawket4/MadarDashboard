import { z } from "zod";

import { rules, type TillRefusal } from "@/lib/rules";

import type { CloseTillPreview, ReconciliationInput } from "./api";

/** One editable row of the close form (non-cash methods only; cash is the count). */
export const reconciliationRowSchema = z
  .object({
    method: z.string(),
    status: z.enum(["checked", "disagreed"]),
    declared: z.string(),
    note: z.string(),
  })
  .superRefine((row, ctx) => {
    // Typed, but not an amount.
    const n = Number(row.declared);
    if (row.status === "disagreed" && row.declared.trim() !== "" && !(Number.isFinite(n) && n >= 0)) {
      ctx.addIssue({ code: "custom", path: ["declared"], message: "amount" });
    }
    // Whether the row may be sent is the server's rule; a refused row marks every blank (the server names only the amount).
    if (!reconcileRefusal([{ method: row.method, is_cash: false }], toReconciliationInputs([row], Number))) return;
    if (row.declared.trim() === "") ctx.addIssue({ code: "custom", path: ["declared"], message: "amount" });
    if (row.note.trim() === "") ctx.addIssue({ code: "custom", path: ["note"], message: "note" });
  });

export const closeTillSchema = z.object({
  cash: z.string().refine((v) => v.trim() !== "" && Number.isFinite(Number(v)) && Number(v) >= 0, "cash"),
  cashNote: z.string(),
  rows: z.array(reconciliationRowSchema),
});

export type CloseTillForm = z.infer<typeof closeTillSchema>;

export function defaultCloseForm(preview: CloseTillPreview | undefined): CloseTillForm {
  return {
    cash: "",
    cashNote: "",
    rows: (preview?.methods ?? [])
      .filter((m) => !m.is_cash)
      .map((m) => ({ method: m.method, status: "checked" as const, declared: "", note: "" })),
  };
}

/** Form → wire. Amounts are EGP strings in the form, piastres on the wire. */
export function toReconciliationInputs(rows: CloseTillForm["rows"], toMinor: (egp: number) => number): ReconciliationInput[] {
  return rows.map((r) =>
    r.status === "checked"
      ? { method: r.method, status: "checked" }
      : {
          method: r.method,
          status: "disagreed",
          // Blank is no amount, not 0 (the server takes 0 as an amount).
          declared_amount: r.declared.trim() === "" ? null : toMinor(Number(r.declared)),
          note: r.note.trim(),
        },
  );
}

/** `code` is the API's (`RECONCILIATION_AMOUNT_REQUIRED`, …); null for a status that is neither `checked` nor `disagreed`. */
export type ReconcileRefusal = TillRefusal;

/**
 * Why the server would refuse a live close's reconciliation, or null: madar-till `reconcile::plan_lines`
 * (WebAssembly), pinned by src/lib/reconcile_vectors.json. A refusal reads only the methods, the statuses,
 * the notes and WHETHER an amount was declared, so every figure goes in as zero: a form's half-typed amount
 * (`12.5`, `NaN`) is not a whole i32 and would throw.
 */
export function reconcileRefusal(
  totals: { method: string; is_cash: boolean }[],
  inputs: { method: string; status: string; declared_amount?: number | null; note?: string | null }[],
): ReconcileRefusal | null {
  const lines = rules.till_plan_lines(
    totals.map((t) => ({ method: t.method, is_cash: t.is_cash, payment_method_id: null, system_total: 0, order_count: 0 })),
    0,
    0,
    null,
    inputs.map((i) => ({ method: i.method, status: i.status, declared_amount: i.declared_amount == null ? null : 0, note: i.note ?? null })),
    false,
  );
  return Array.isArray(lines) ? null : lines;
}

/** Row is flagged on the list when either flag applies. */
export const isFlagged = (t: { opened_while_another_open: boolean; reconciliation_status?: string | null }) =>
  t.opened_while_another_open || t.reconciliation_status === "disagreed";
