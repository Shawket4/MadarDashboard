import { z } from "zod";

/** EGP amount entered as a decimal string ("12.50") → piastres (1250) */
export const egpToPiastres = z
  .union([z.string(), z.number()])
  .transform((v, ctx) => {
    const n = typeof v === "number" ? v : parseFloat(v);
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid amount" });
      return z.NEVER;
    }
    return Math.round(n * 100);
  });

/** Non-empty trimmed string */
export const trimmedString = (min = 1, max = 255) =>
  z.string().trim().min(min).max(max);

/** UUID-ish — backend uses UUIDs but we stay loose */
export const idString = z.string().min(1);
