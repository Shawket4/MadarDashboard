/**
 * Sign-up's vocabulary: how a refusal from `POST /public/signup[/otp]` is told
 * apart, and the countdown on "Send the code again".
 */
import { AxiosError } from "axios";
import { useEffect, useState } from "react";

import { latinDigits } from "@/components/inputs/time";
import { canonicalPhone } from "@/lib/phone";

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

/** An Egyptian mobile without its +20: ten digits, the first being 1 (10, 11, 12 or 15 follow). */
export const NATIONAL_LENGTH = 10;

/**
 * The part of a phone typed or pasted after +20, as digits only: `010 0123 4567`,
 * `+20 100 123 4567`, `0020100…` and Arabic-Indic digits all give `1001234567`.
 */
export function nationalDigits(raw: string): string {
  let d = latinDigits(raw).replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("20")) d = d.slice(2);
  return d.replace(/^0+/, "").slice(0, NATIONAL_LENGTH);
}

/** `1001234567` as it reads in the field: `100 123 4567`. */
export function groupNational(digits: string): string {
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)].filter(Boolean).join(" ");
}

/** What is wrong with a national number so far; `null` while it can still be right. */
export function nationalIssue(digits: string, final: boolean): "prefix" | "short" | null {
  if (digits.length >= 2 && !/^1[0125]/.test(digits)) return "prefix";
  if (digits.length >= 1 && !/^1/.test(digits)) return "prefix";
  if (final && digits.length > 0 && digits.length < NATIONAL_LENGTH) return "short";
  return null;
}

/** The number sent to the server: canonical (`201001234567`), or null until it is a real mobile. */
export const signupPhone = (digits: string): string | null =>
  digits.length === NATIONAL_LENGTH ? canonicalPhone(`0${digits}`) : null;

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
