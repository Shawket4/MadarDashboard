/**
 * The one phone rule. Canonical = E.164 digits without the `+`
 * (`201001234567`) — the form the backend (`phone_canonical`), the POS core and
 * this app all agree on. The rule and its vectors live in `phone_vectors.json`,
 * shared verbatim with the other two repos; never change one copy alone.
 */
import { z } from "zod";

/** Longer than this is refused outright, before any digit is read. */
export const PHONE_RAW_MAX = 32;
const CANONICAL_MIN = 10;
const CANONICAL_MAX = 15;

/** Arabic-Indic (U+0660–0669) and Extended Arabic-Indic (U+06F0–06F9) → ASCII. */
const asciiDigits = (s: string): string =>
  s.replace(/[٠-٩۰-۹]/g, (ch) => {
    const code = ch.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });

/** The canonical form of whatever was typed, or `null` when it is not a phone. */
export const canonicalPhone = (raw: string | null | undefined): string | null => {
  if (raw == null || [...raw].length > PHONE_RAW_MAX) return null;
  let digits = asciiDigits(raw).replace(/[^0-9]/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("20")) {
    /* already country-coded */
  } else if (digits.startsWith("0")) digits = `20${digits.slice(1)}`;
  else if (digits.length === 10 && digits.startsWith("1")) digits = `20${digits}`;
  return digits.length >= CANONICAL_MIN && digits.length <= CANONICAL_MAX ? digits : null;
};

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
