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
    if (row.status !== "disagreed") return;
    const n = Number(row.declared);
    if (row.declared.trim() === "" || !Number.isFinite(n) || n < 0) {
      ctx.addIssue({ code: "custom", path: ["declared"], message: "amount" });
    }
    if (row.note.trim() === "") {
      ctx.addIssue({ code: "custom", path: ["note"], message: "note" });
    }
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
      : { method: r.method, status: "disagreed", declared_amount: toMinor(Number(r.declared)), note: r.note.trim() },
  );
}

/** Row is flagged on the list when either flag applies. */
export const isFlagged = (t: { opened_while_another_open: boolean; reconciliation_status?: string | null }) =>
  t.opened_while_another_open || t.reconciliation_status === "disagreed";
