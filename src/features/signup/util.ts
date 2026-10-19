/**
 * Sign-up's vocabulary: how a refusal from `POST /public/signup[/otp]` is told
 * apart, and the countdown on "Send the code again".
 */
import { AxiosError } from "axios";
import { useEffect, useState } from "react";

import { latinDigits } from "@/components/inputs/time";
import { canonicalPhone } from "@/lib/phone";

import { DIAL_CODES } from "./dial-codes";

export type SignupProblem =
  /** A shop already owns the phone (409 SIGNUP_PHONE_TAKEN): sign in instead. */
  | "phone_taken"
  /** An account already uses the email (409 SIGNUP_EMAIL_TAKEN): sign in instead. */
  | "email_taken"
  /** A code just went out (429 SIGNUP_OTP_COOLDOWN), or five did this hour (SIGNUP_OTP_LIMIT). */
  | "cooldown"
  | "limit"
  /** The per-IP limiter (429 RATE_LIMITED, or a bare 429). */
  | "rate"
  /** 400 SIGNUP_CODE_WRONG: that code is not the one sent. */
  | "bad_code"
  /** 400 SIGNUP_CODE_EXPIRED: no active code (it ran out, or was spent): ask for a new one. */
  | "code_expired"
  /** 400 SIGNUP_CODE_LOCKED: five wrong tries; ask for a new code. */
  | "code_locked"
  /** 400 SIGNUP_TOKEN_EXPIRED: the verified phone timed out before the shop was made; start again. */
  | "token_expired"
  | "other";

/**
 * The server checks the code at the code step (`/public/signup/verify`) and
 * answers with a stable code for each way it can fail; any other 400 is a field
 * the server judged differently, and is shown as the server's refusal.
 */
const CAMPAIGN_TAGS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"] as const;

/** The campaign tags in the signup URL (the landing copies them there), for the org record; `undefined` when there are none. */
export function signupAttribution(search: string): Partial<Record<(typeof CAMPAIGN_TAGS)[number], string>> | undefined {
  const q = new URLSearchParams(search);
  const found = CAMPAIGN_TAGS.flatMap((k) => {
    const v = q.get(k)?.trim();
    return v ? [[k, v] as const] : [];
  });
  return found.length ? Object.fromEntries(found) : undefined;
}

/** The HTTP status of a failed request, or "network" when none came back (for analytics). */
export const failureStatus = (err: unknown): string => String((err instanceof AxiosError && err.response?.status) || "network");

export function signupProblem(err: unknown): SignupProblem {
  if (!(err instanceof AxiosError)) return "other";
  const status = err.response?.status;
  const data = err.response?.data as { code?: unknown; error?: unknown } | undefined;
  const code = typeof data?.code === "string" ? data.code : undefined;
  if (code === "SIGNUP_PHONE_TAKEN") return "phone_taken";
  if (code === "SIGNUP_EMAIL_TAKEN") return "email_taken";
  if (code === "SIGNUP_OTP_COOLDOWN") return "cooldown";
  if (code === "SIGNUP_OTP_LIMIT") return "limit";
  if (code === "SIGNUP_CODE_WRONG") return "bad_code";
  if (code === "SIGNUP_CODE_EXPIRED") return "code_expired";
  if (code === "SIGNUP_CODE_LOCKED") return "code_locked";
  if (code === "SIGNUP_TOKEN_EXPIRED") return "token_expired";
  if (status === 429) return "rate";
  return "other";
}

/** A six-digit code, however it was typed or pasted (Arabic digits, spaces, dashes). */
export const SIGNUP_CODE_LENGTH = 6;

/** Seconds left until `until` (epoch ms), ticking once a second; 0 when null or past. */
export function useCountdown(until: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (until === null) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [until]);
  return until === null ? 0 : Math.max(0, Math.ceil((until - now) / 1000));
}

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
export const signupPhone = (digits: string, region: string = DEFAULT_REGION): string | null =>
  region === DEFAULT_REGION
    ? digits.length === NATIONAL_LENGTH
      ? canonicalPhone(`0${digits}`)
      : null
    : nationalComplete(digits, region)
      ? canonicalPhone(`00${dialCode(region)}${digits}`)
      : null;

/** 0 (too short) to 4 (strong), from length and the mix of characters. A hint, never a gate. */
export function passwordStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (pw.length < 8) return 0;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  let score = 1;
  if ((pw.length >= 10 && kinds >= 2) || pw.length >= 12) score = 2;
  if ((pw.length >= 12 && kinds >= 3) || pw.length >= 16) score = 3;
  if ((pw.length >= 14 && kinds >= 3) || pw.length >= 20) score = 4;
  if (/^(.)\1+$/.test(pw) || /^(password|12345678|qwertyui)/i.test(pw)) score = 1;
  return score as 1 | 2 | 3 | 4;
}

/** `m:ss`, the resend countdown. */
export const clock = (seconds: number): string => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
