/**
 * Sign-up's vocabulary: how a refusal from `POST /public/signup[/otp]` is told
 * apart, and the countdown on "Send the code again".
 */
import { AxiosError } from "axios";
import { useEffect, useState } from "react";

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
  /** The code is wrong, spent or expired (400 whose sentence is about the code). */
  | "bad_code"
  | "other";

/**
 * The sign-up form validates every field itself, so a 400 from the final
 * request that talks about the code IS the code; any other 400 is a field the
 * server judged differently, and is shown as the server's refusal.
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
  if (status === 429) return "rate";
  if (status === 400 && typeof data?.error === "string" && /\bcode\b/i.test(data.error)) return "bad_code";
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
