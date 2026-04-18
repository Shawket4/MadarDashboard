import { z } from "zod";
export const voidOrderSchema = z.object({
  reason: z.enum(["customer_request", "wrong_order", "quality_issue", "other"]),
  restore_inventory: z.boolean().default(true),
});
export type VoidOrderValues = z.infer<typeof voidOrderSchema>;
