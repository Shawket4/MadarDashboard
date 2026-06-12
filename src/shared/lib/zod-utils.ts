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

/**
 * Like egpToPiastres but empty/absent input becomes null ("cost unknown"),
 * never 0 ("free"). Unlike prices (integer piastres), ingredient costs are
 * stored as DECIMAL piastres server-side — keep the full precision the user
 * typed (only float noise is trimmed).
 */
export const egpToPiastresNullable = z
  .union([z.string(), z.number()])
  .nullish()
  .transform((v, ctx) => {
    if (v === null || v === undefined || v === "") return null;
    const n = typeof v === "number" ? v : parseFloat(v);
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid amount" });
      return z.NEVER;
    }
    return Math.round(n * 100 * 1e6) / 1e6;
  });

/**
 * Translation maps ({en, ar, …}) for form fields.
 *
 * AR inputs are OPTIONAL — react-hook-form registers untouched Controller
 * paths as `undefined`, which a plain z.record(z.string()) rejects with
 * "Required" under the AR field. This type tolerates undefined/empty values
 * and strips them from the payload, so the backend's auto-translate fills
 * the missing languages.
 */
export const translationMap = z
  .record(z.string().optional())
  .optional()
  .transform((m) => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(m ?? {})) {
      if (typeof v === "string" && v.trim() !== "") out[k] = v;
    }
    return out;
  });

/** Non-empty trimmed string */
export const trimmedString = (min = 1, max = 255) =>
  z.string().trim().min(min).max(max);

/** UUID-ish — backend uses UUIDs but we stay loose */
export const idString = z.string().min(1);
