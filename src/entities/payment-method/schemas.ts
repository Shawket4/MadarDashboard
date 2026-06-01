import * as z from "zod";

export const paymentMethodSchema = z.object({
  name: z
    .string()
    .min(2, "ID must be at least 2 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Only lowercase letters, numbers, and underscores allowed",
    ),
  labelEn: z.string().min(1, "English label is required"),
  labelAr: z.string().optional(),
  color: z.string().min(1, "Color is required"),
  icon: z.string().min(1, "Icon is required"),
  isCash: z.boolean(),
  is_active: z.boolean().default(true),
});

export type PaymentMethodValues = z.infer<typeof paymentMethodSchema>;
