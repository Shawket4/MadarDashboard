/**
 * The one phone rule. Canonical = E.164 digits without the `+`
 * (`201001234567`) — the form the backend, the POS core and this app all agree
 * on. The rule is madar-shared's `madar_ids::phone::canonical`, called through
 * WebAssembly (`@/lib/rules`); phone.test.ts runs it against the shared
 * `phone_vectors.json`.
 */
import { z } from "zod";

import { rules } from "@/lib/rules";

/** Longer than this is refused outright (madar-ids `MAX_PHONE_RAW_LEN`); a form field's max length. */
export const PHONE_RAW_MAX = 32;

/** The canonical form of whatever was typed, or `null` when it is not a phone. */
export const canonicalPhone = (raw: string | null | undefined): string | null =>
  raw == null ? null : rules.phone_canonical(raw);

export const isValidPhone = (raw: string | null | undefined): boolean => canonicalPhone(raw) !== null;

/** Whether two typed phones are the same number. Two non-phones are never equal. */
export const samePhone = (a: string | null | undefined, b: string | null | undefined): boolean => {
  const ca = canonicalPhone(a);
  return ca !== null && ca === canonicalPhone(b);
};

/**
 * A phone for reading: `+20 100 123 4567` for an Egyptian mobile, `+<digits>`
 * otherwise. Takes the canonical form but canonicalises first, so a legacy
 * `01…` value still reads right; something that is not a phone comes back
 * as it was given. Always LTR — wrap it in `dir="ltr"` inside Arabic text.
 */
export const formatPhoneDisplay = (phone: string | null | undefined): string => {
  if (!phone) return "";
  const c = canonicalPhone(phone);
  if (!c) return phone;
  const m = /^20(1\d{2})(\d{3})(\d{4})$/.exec(c);
  return m ? `+20 ${m[1]} ${m[2]} ${m[3]}` : `+${c}`;
};

/**
 * Wrap a formatted phone for interpolation into a sentence: Unicode isolates
 * (LRI … PDI) keep `+20 100 123 4567` reading left-to-right inside Arabic text,
 * where the spaces would otherwise let the groups be reordered. In JSX prefer
 * `<bdi dir="ltr">`; this is for strings handed to `t()`.
 */
export const ltrIsolate = (s: string): string => (s ? `\u2066${s}\u2069` : s);

/**
 * A canonical phone as someone would type it into a field that shows a `+20`
 * adornment: the national `01001234567` for Egypt, `+<digits>` otherwise.
 * Used to pre-fill an input from a stored canonical value.
 */
export const formatPhoneInput = (phone: string | null | undefined): string => {
  const c = canonicalPhone(phone);
  if (!c) return phone ?? "";
  return c.startsWith("20") ? `0${c.slice(2)}` : `+${c}`;
};

export const PHONE_ERRORS = {
  required: "common.errors.phoneRequired",
  invalid: "common.errors.phoneInvalid",
} as const;

/**
 * The phone field of any form. The value stays as typed (trimmed) — callers
 * decide what goes on the wire with `canonicalPhone`. Messages are i18n keys,
 * as in every other schema here.
 */
export const phoneSchema = ({
  required,
  messages,
}: {
  required: boolean;
  messages?: { required?: string; invalid?: string };
}) => {
  const invalid = messages?.invalid ?? PHONE_ERRORS.invalid;
  const base = z.string().trim();
  return (required ? base.min(1, { message: messages?.required ?? PHONE_ERRORS.required }) : base).refine(
    (v) => v === "" || isValidPhone(v),
    { message: invalid },
  );
};
