/**
 * Customers: the form's rules, the bodies they become, and the refusals the
 * form can point at. Mirrors `MadarRust src/customers`.
 */
import { AxiosError } from "axios";
import { z } from "zod";

import { PHONE_RAW_MAX, phoneSchema } from "@/lib/phone";
import type { CreateCustomerRequest, Customer, MemberView, UpdateCustomerRequest } from "@/data/api/generated/models";

export const NAME_MAX = 120;
export const NOTES_MAX = 2000;
export const PHONE_MAX = PHONE_RAW_MAX;
export const PAGE_SIZE = 50;
/** The server clamps `limit` to 500. */
export const LIMIT_MAX = 500;
/** …and the loyalty members endpoint clamps it to 200. */
export const MEMBERS_LIMIT_MAX = 200;

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "customers.errors.nameRequired" })
    .max(NAME_MAX, { message: "customers.errors.nameLong" }),
  phone: phoneSchema({ required: false, messages: { invalid: "customers.errors.phoneInvalid" } }),
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

const refusedWith = (e: unknown, code: string): boolean => {
  if (!(e instanceof AxiosError)) return false;
  const data = e.response?.data as Record<string, unknown> | undefined;
  return e.response?.status === 409 && data?.code === code;
};

/** Whether a failed save was the "another customer has this phone" refusal. */
export const isPhoneTaken = (e: unknown): boolean => refusedWith(e, "CUSTOMER_PHONE_EXISTS");

/**
 * Whether a merge was refused because only the duplicate holds a loyalty card:
 * the member's id is printed in wallet passes, so that record must stay.
 */
export const isMemberMustSurvive = (e: unknown): boolean => refusedWith(e, "CUSTOMER_MERGE_MEMBER_SURVIVES");

/**
 * Every query that shows a person: `/customers…` and `/loyalty/…`. A customer
 * and their card share an id, so a write to either side stales both.
 */
export const isPersonQuery = (q: { queryKey: readonly unknown[] }): boolean => {
  const key = String(q.queryKey[0] ?? "");
  return key.startsWith("/customers") || key.startsWith("/loyalty/");
};

/** Where a customer first came from — the server's vocabulary, in filter order. */
export const SOURCES = ["pos", "online", "loyalty", "booking", "table_qr", "aggregator", "dashboard"] as const;
export type CustomerSource = (typeof SOURCES)[number];
export const isSource = (v: string | null | undefined): v is CustomerSource =>
  (SOURCES as readonly string[]).includes(v ?? "");

/**
 * One row of a people list, whichever endpoint it came from. The customer
 * fields are absent on a row read from the loyalty endpoint (and the other way
 * round), which is what keeps a loyalty-only viewer at what they saw before.
 */
export interface PersonRow {
  id: string;
  name: string;
  phone: string | null;
  isMember: boolean;
  /** In the program's currency; null for a non-member. */
  balance: number | null;
  /** The currency `balance` is in; null when it could not be known. */
  mode: string | null;
  customer?: Pick<Customer, "source" | "orders_count" | "total_spent" | "last_order_at">;
  member?: Pick<MemberView, "can_redeem" | "points_to_next_reward" | "enrolled_at">;
}

/** `mode`: the program in force, or null when the viewer may not read it. */
export const rowOfCustomer = (c: Customer, mode: string | null): PersonRow => ({
  id: c.id,
  name: c.name,
  phone: c.phone ?? null,
  isMember: c.is_member ?? false,
  balance: !c.is_member || !mode ? null : ((mode === "visits" ? c.visits_balance : c.points_balance) ?? 0),
  mode,
  customer: c,
});

export const rowOfMember = (m: MemberView): PersonRow => ({
  id: m.id,
  name: m.name,
  phone: m.phone,
  isMember: true,
  balance: m.balance,
  mode: m.mode,
  member: m,
});

/** "14 March" / "١٤ مارس" — a birthday has no year. Null when not given. */
export const formatBirthday = (month: number | null | undefined, day: number | null | undefined, lang: string): string | null => {
  if (!month || !day) return null;
  // 2024: a leap year, so 29 February survives.
  return new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2024, month - 1, day)),
  );
};
