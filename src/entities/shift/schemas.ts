import { z } from "zod";
import { egpToPiastres } from "@/shared/lib/zod-utils";

export const openShiftSchema = z.object({ opening_cash: egpToPiastres });
export type OpenShiftValues = z.infer<typeof openShiftSchema>;

export const closeShiftSchema = z.object({
  closing_cash_declared: egpToPiastres,
});
export type CloseShiftValues = z.infer<typeof closeShiftSchema>;

export const forceCloseSchema = z.object({ reason: z.string().trim().min(1) });
export type ForceCloseValues = z.infer<typeof forceCloseSchema>;

export const cashMovementSchema = z.object({
  direction: z.enum(["in", "out"]),
  amount: egpToPiastres,
  note: z.string().trim().min(1),
});
export type CashMovementValues = z.infer<typeof cashMovementSchema>;
