/**
 * A manual points adjustment: the rules, and the body it becomes.
 *
 * Mirrors `handlers::adjust` / `model::adjust`:
 *  - a whole, non-zero number ("An adjustment of zero points changes nothing");
 *  - a deduction may not take the balance below zero ("that adjustment would go
 *    negative") — checked against the balance in the branch's live currency;
 *  - a branch, because the ledger row is filed under one.
 *
 * Stricter than the server in one place, on purpose: a reason is REQUIRED.
 * The server takes `note` as optional, but a hand-typed movement of value with
 * no reason is an audit trail with a hole in it, and this is the only screen
 * that writes one.
 */
import { z } from "zod";

export const ADJUST_LIMIT = 1_000_000;
export const REASON_MIN = 3;
export const REASON_MAX = 500;

export const adjustSchema = (balance: number) =>
  z.object({
    branch_id: z.string().min(1, { message: "loyalty.errors.adjustBranch" }),
    direction: z.enum(["add", "deduct"]),
    amount: z
      .number({ message: "loyalty.errors.adjustAmount" })
      .int({ message: "loyalty.errors.adjustAmount" })
      .positive({ message: "loyalty.errors.adjustAmount" })
      .max(ADJUST_LIMIT, { message: "loyalty.errors.adjustAmount" }),
    reason: z
      .string()
      .trim()
      .min(REASON_MIN, { message: "loyalty.errors.adjustReason" })
      .max(REASON_MAX, { message: "loyalty.errors.adjustReasonLong" }),
  })
  .superRefine((v, ctx) => {
    if (v.direction === "deduct" && Number.isFinite(v.amount) && v.amount > balance) {
      ctx.addIssue({ code: "custom", path: ["amount"], message: "loyalty.errors.adjustOverdraw" });
    }
  });

export type AdjustValues = z.infer<ReturnType<typeof adjustSchema>>;

/** The signed body `POST /loyalty/adjust` takes. */
export const adjustToWire = (v: AdjustValues, customerId: string) => ({
  branch_id: v.branch_id,
  customer_id: customerId,
  points: v.direction === "deduct" ? -v.amount : v.amount,
  note: v.reason.trim(),
});
