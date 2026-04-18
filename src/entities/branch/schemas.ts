import { z } from "zod";
import { PRINTER_BRANDS } from "@/shared/config/constants";

export const branchSchema = z
  .object({
    name: z.string().trim().min(1),
    address: z.string().trim().nullish(),
    phone: z.string().trim().nullish(),
    timezone: z.string().trim().default("Africa/Cairo"),
    is_active: z.boolean().default(true),
    printer_brand: z.enum(["none", ...PRINTER_BRANDS]).default("none"),
    printer_ip: z.string().trim().nullish(),
    printer_port: z.coerce.number().int().min(1).max(65535).nullish(),
  })
  .refine(
    (v) => v.printer_brand === "none" || (v.printer_ip && v.printer_port),
    { message: "Printer IP and port are required", path: ["printer_ip"] },
  );
export type BranchValues = z.infer<typeof branchSchema>;
