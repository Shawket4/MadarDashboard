import { z } from "zod";

/**
 * The query string every ordering route accepts.
 *
 * The router parses each value as JSON before this sees it, so `?preview=1`
 * arrives as the NUMBER 1 and `?preview=true` as a boolean — a schema that only
 * allowed strings threw on a link people actually share, and the page rendered
 * the router's error screen instead of the menu.
 */
export const orderSearchSchema = z.object({
  branch: z.string().optional(),
  channel: z.string().optional(),
  table: z.string().optional(),
  preview: z
    .union([z.boolean(), z.string(), z.number()])
    .optional()
    .transform((v) => (v === true || v === 1 || v === "1" || v === "true" ? true : undefined)),
  place_name: z.string().optional(),
  floor: z.coerce.string().optional(),
  unit_number: z.coerce.string().optional(),
});
