/**
 * Customers: the form's rules, the bodies they become, and the refusals the
 * form can point at. Mirrors `MadarRust src/customers`.
 */
import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { z } from "zod";

import type { CreateCustomerRequest, Customer, UpdateCustomerRequest } from "@/data/api/generated/models";

export const NAME_MAX = 120;
export const NOTES_MAX = 2000;
export const PHONE_MAX = 32;
export const PAGE_SIZE = 50;
/** The server clamps `limit` to 500. */
export const LIMIT_MAX = 500;

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "customers.errors.nameRequired" })
    .max(NAME_MAX, { message: "customers.errors.nameLong" }),
  phone: z
    .string()
    .trim()
    .max(PHONE_MAX, { message: "customers.errors.phoneInvalid" })
    .refine((v) => v === "" || /^\+?[\d\s-]{5,}$/.test(v), { message: "customers.errors.phoneInvalid" }),
  notes: z.string().trim().max(NOTES_MAX, { message: "customers.errors.notesLong" }),
});

export type CustomerValues = z.infer<typeof customerSchema>;

export const valuesOf = (c?: Pick<Customer, "name" | "phone" | "notes"> | null): CustomerValues => ({
  name: c?.name ?? "",
  phone: c?.phone ?? "",
  notes: c?.notes ?? "",
});

export const createToWire = (v: CustomerValues): CreateCustomerRequest => ({
  name: v.name.trim(),
  phone: v.phone.trim() || null,
  notes: v.notes.trim() || null,
});

/** PATCH semantics: `""` clears phone and notes. */
export const updateToWire = (v: CustomerValues): UpdateCustomerRequest => ({
  name: v.name.trim(),
  phone: v.phone.trim(),
  notes: v.notes.trim(),
});

/** Whether a failed save was the "another customer has this phone" refusal. */
export const isPhoneTaken = (e: unknown): boolean => {
  if (!(e instanceof AxiosError)) return false;
  const data = e.response?.data as Record<string, unknown> | undefined;
  return e.response?.status === 409 && data?.code === "CUSTOMER_PHONE_EXISTS";
};

/** Every query under `/customers` — the list and each detail. */
export const isCustomersQuery = (q: { queryKey: readonly unknown[] }): boolean =>
  String(q.queryKey[0] ?? "").startsWith("/customers");

export function useDebouncedValue<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}
