import { z } from "zod";
export const orgSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes only"),
  currency_code: z.string().trim().min(3).max(5).default("EGP"),
  tax_rate: z.coerce.number().min(0).max(100).default(0),
  receipt_footer: z.string().trim().nullish(),
});
export type OrgValues = z.infer<typeof orgSchema>;
