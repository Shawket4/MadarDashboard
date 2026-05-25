import { z } from "zod";
import { LoginBody } from "@/shared/api/generated/zod/api.zod";

// Hybrid approach: we pick the fields we need from the generated schema,
// then override their specific frontend validation rules (e.g. required, trim).
export const loginSchema = LoginBody.pick({ email: true, password: true }).extend({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export type LoginValues = z.infer<typeof loginSchema>;
