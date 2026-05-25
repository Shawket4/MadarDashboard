import { z } from "zod";
import { CreateUserBody, UpdateUserBody } from "@/shared/api/generated/zod/api.zod";
import { ROLES } from "@/shared/config/constants";

// The generated CreateUserBody and UpdateUserBody have all fields. 
// We augment them with frontend-specific refinements (e.g. trimming strings, empty strings to nullish).

export const createUserSchema = CreateUserBody.extend({
  name: z.string().trim().min(1, "Required"),
  email: z.string().trim().email("Invalid email").nullish().or(z.literal("")),
  phone: z.string().trim().nullish().or(z.literal("")),
  pin: z.string().regex(/^\d{4,6}$/, "4–6 digit PIN").optional().or(z.literal("")),
  password: z.string().min(6, "Must be at least 6 characters").optional().or(z.literal("")),
  org_id: z.string().min(1, "Required"),
  role: z.enum(ROLES as any),
  is_active: z.boolean().default(true),
});

export const updateUserSchema = UpdateUserBody.extend({
  name: z.string().trim().min(1, "Required"),
  email: z.string().trim().email("Invalid email").nullish().or(z.literal("")),
  phone: z.string().trim().nullish().or(z.literal("")),
  pin: z.string().regex(/^\d{4,6}$/, "4–6 digit PIN").optional().or(z.literal("")),
  password: z.string().min(6, "Must be at least 6 characters").optional().or(z.literal("")),
  role: z.enum(ROLES as any),
  is_active: z.boolean().default(true),
});

export type CreateUserValues = z.infer<typeof createUserSchema>;
export type UpdateUserValues = z.infer<typeof updateUserSchema>;
