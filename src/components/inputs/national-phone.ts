/**
 * A mobile number typed after its country's code: the digits after the code,
 * Egypt first (Madar's home market). What `PhoneInput` holds, and how it turns
 * into the canonical number the server takes (`phoneFromNational`).
 */
import { canonicalPhone } from "@/lib/phone";

import { DIAL_CODES } from "./dial-codes";
import { latinDigits } from "./time";

/** The country the field starts on: Madar's home market. */
export const DEFAULT_REGION = "EG";

/** An Egyptian mobile without its +20: ten digits, the first being 1 (10, 11, 12 or 15 follow). */
export const NATIONAL_LENGTH = 10;

/** A region's dialling code (`EG` → `20`); an unknown region reads as Egypt. */
export const dialCode = (region: string): string => DIAL_CODES[region] ?? DIAL_CODES[DEFAULT_REGION];

/** The longest number after the code: Egypt's ten digits, else what E.164's fifteen leave. */
export const nationalMax = (region: string): number =>
  region === DEFAULT_REGION ? NATIONAL_LENGTH : 15 - dialCode(region).length;

/** The fewest digits code and number together may have (madar-ids: 10 to 15). */
const E164_MIN = 10;

/** One region per shared code when a number is pasted with its `+`: the code's home country. */
const CODE_HOME: Record<string, string> = { "1": "US", "7": "RU", "44": "GB", "47": "NO", "61": "AU", "39": "IT", "212": "MA", "262": "RE", "290": "SH", "358": "FI", "590": "GP", "599": "CW" };

/**
 * The region a typed or pasted `+<code>…` / `00<code>…` number belongs to, by the
 * longest dialling code it starts with; `null` when it carries no code. The
 * current region wins when it shares the code (a Canadian stays Canadian).
 */
export function regionOf(raw: string, current: string): string | null {
  const t = latinDigits(raw).trim();
  if (!/^(\+|00)/.test(t)) return null;
  const d = t.replace(/\D/g, "").replace(/^00/, "");
  for (let len = 3; len >= 1; len--) {
    const code = d.slice(0, len);
    if (d.length <= len) continue;
    if (dialCode(current) === code) return current;
    const regions = Object.keys(DIAL_CODES).filter((r) => DIAL_CODES[r] === code);
    if (regions.length) return CODE_HOME[code] ?? regions[0];
  }
  return null;
}

/**
 * The part of a phone typed or pasted after the dialling code, as digits only.
 * For Egypt `010 0123 4567`, `+20 100 123 4567`, `0020100…` and Arabic-Indic
 * digits all give `1001234567`. Elsewhere the code goes when the number came
 * with its `+` or `00`, and so does the trunk `0` (`07700 900123` → `7700900123`),
 * except in Italy, where the `0` is part of the number.
 */
export function nationalDigits(raw: string, region: string = DEFAULT_REGION): string {
  const typed = latinDigits(raw).trim();
  const code = dialCode(region);
  let d = typed.replace(/\D/g, "");
  const international = /^(\+|00)/.test(typed);
  if (d.startsWith("00")) d = d.slice(2);
  if ((region === DEFAULT_REGION || international) && d.startsWith(code)) d = d.slice(code.length);
  if (region !== "IT") d = d.replace(/^0+/, "");
  return d.slice(0, nationalMax(region));
}

/** `1001234567` as it reads in the field: `100 123 4567`. */
export function groupNational(digits: string): string {
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)].filter(Boolean).join(" ");
}

/** What is wrong with a national number so far; `null` while it can still be right. */
export function nationalIssue(digits: string, final: boolean, region: string = DEFAULT_REGION): "prefix" | "short" | null {
  if (region !== DEFAULT_REGION) {
    return final && digits.length > 0 && dialCode(region).length + digits.length < E164_MIN ? "short" : null;
  }
  if (digits.length >= 2 && !/^1[0125]/.test(digits)) return "prefix";
  if (digits.length >= 1 && !/^1/.test(digits)) return "prefix";
  if (final && digits.length > 0 && digits.length < NATIONAL_LENGTH) return "short";
  return null;
}

/** Whether the number is whole: Egypt's ten digits, elsewhere enough for E.164. */
export const nationalComplete = (digits: string, region: string = DEFAULT_REGION): boolean =>
  region === DEFAULT_REGION
    ? digits.length === NATIONAL_LENGTH && nationalIssue(digits, true) === null
    : dialCode(region).length + digits.length >= E164_MIN;

/** The number sent to the server: canonical (`201001234567`), or null until it is a whole number. */
export const phoneFromNational = (digits: string, region: string = DEFAULT_REGION): string | null =>
  region === DEFAULT_REGION
    ? digits.length === NATIONAL_LENGTH
      ? canonicalPhone(`0${digits}`)
      : null
    : nationalComplete(digits, region)
      ? canonicalPhone(`00${dialCode(region)}${digits}`)
      : null;
