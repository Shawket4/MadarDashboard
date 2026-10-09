import { z } from "zod";

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

export const CODE_AMOUNT_REQUIRED = "RECONCILIATION_AMOUNT_REQUIRED";
export const CODE_NOTE_REQUIRED = "RECONCILIATION_NOTE_REQUIRED";

/** `code` is null for a status that is neither `checked` nor `disagreed`. */
export interface ReconcileRefusal {
  code: string | null;
  method: string;
}

/**
 * Why the server would refuse a live close's reconciliation, or null: madar-till `reconcile::plan_lines`,
 * pinned by src/lib/reconcile_vectors.json. The cash line is never refused. A disagreement needs an amount
 * (checked first), then a note that is not blank. The first bad method is named, in line order: the till's
 * non-cash methods, then methods not used on it. An input is matched by its trimmed method; only the first counts.
 */
export function reconcileRefusal(
  totals: { method: string; is_cash: boolean }[],
  inputs: { method: string; status: string; declared_amount?: number | null; note?: string | null }[],
): ReconcileRefusal | null {
  const cash = totals.find((t) => t.is_cash)?.method ?? "cash";
  const order = totals.filter((t) => !t.is_cash).map((t) => t.method);
  for (const i of inputs) {
    const m = i.method.trim();
    if (m !== "" && m !== cash && !order.includes(m)) order.push(m);
  }
  for (const method of order) {
    const input = inputs.find((i) => i.method.trim() === method);
    if (!input) continue;
    const status = input.status.trim();
    if (status === "checked") continue;
    if (status !== "disagreed") return { code: null, method };
    if (input.declared_amount == null) return { code: CODE_AMOUNT_REQUIRED, method };
    if (!input.note?.trim()) return { code: CODE_NOTE_REQUIRED, method };
  }
  return null;
}

/** Row is flagged on the list when either flag applies. */
export const isFlagged = (t: { opened_while_another_open: boolean; reconciliation_status?: string | null }) =>
  t.opened_while_another_open || t.reconciliation_status === "disagreed";
