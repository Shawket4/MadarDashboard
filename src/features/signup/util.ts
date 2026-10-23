/**
 * Sign-up's vocabulary: how a refusal from `POST /public/signup[/otp]` is told
 * apart. The phone helpers and the resend countdown are the input kit's
 * (`components/inputs/national-phone`, `countdown`).
 */
import { AxiosError } from "axios";

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
