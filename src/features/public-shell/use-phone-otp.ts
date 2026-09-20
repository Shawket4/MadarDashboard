/**
 * Proving a phone on a public surface: the one state machine behind ordering,
 * bookings and the loyalty sign-up.
 *
 *   phone ──start──▶ (device token on this device, or OTP off) ──▶ verified
 *     ▲                └─ otherwise: request a code ──▶ otp ──verify──▶ verified
 *     └──────────── changeNumber ────────────────────────┘
 *
 * All three surfaces speak the same protocol today (`/otp/request`,
 * `/otp/verify` → a device token, remembered by `guest.ts`). The calls still
 * come in through `PhoneOtpTransport` so a flow with its own endpoints — the
 * wallet pass's "this is my new number" — can reuse the machine and the UI
 * without touching either.
 */
import { AxiosError } from "axios";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { getErrorMessage } from "@/data/api/errors";
import { useOtpRequest, useOtpVerify } from "@/data/api/generated/api";
import { canonicalPhone } from "@/lib/phone";

import { getDeviceToken, setDeviceToken } from "./guest";

export interface PhoneOtpTransport {
  /** Send a code to a canonical phone. Rejects when it could not be sent. */
  requestCode: (phone: string) => Promise<void>;
  /** Check a code; resolves to the device token. Rejects on a wrong code. */
  verifyCode: (phone: string, code: string) => Promise<string>;
  sending: boolean;
  verifying: boolean;
}

/** The shared WhatsApp OTP endpoints. */
export function useOtpTransport(): PhoneOtpTransport {
  const request = useOtpRequest();
  const verify = useOtpVerify();
  const { mutateAsync: requestAsync } = request;
  const { mutateAsync: verifyAsync } = verify;
  const requestCode = useCallback(
    async (phone: string) => {
      await requestAsync({ data: { phone } });
    },
    [requestAsync],
  );
  const verifyCode = useCallback(
    async (phone: string, code: string) => (await verifyAsync({ data: { phone, code } })).device_token,
    [verifyAsync],
  );
  return useMemo(
    () => ({ requestCode, verifyCode, sending: request.isPending, verifying: verify.isPending }),
    [requestCode, verifyCode, request.isPending, verify.isPending],
  );
}

/**
 * What the server said when it refused to send a code — a number WhatsApp
 * cannot reach, or "a code was just sent" — belongs under the field in its own
 * words. Anything else (offline, a 5xx) gets the flow's generic line.
 */
export const otpRefusal = (err: unknown): string | null => {
  const status = err instanceof AxiosError ? err.response?.status : undefined;
  return status !== undefined && status >= 400 && status < 500 ? getErrorMessage(err) : null;
};

export type PhoneOtpStage = "phone" | "otp";

export interface PhoneOtpOptions {
  /** When false the number is taken as-is (the branch does not require OTP). */
  otpRequired: boolean;
  initialPhone?: string;
  /** The phone in canonical form, and the device token when there is one. */
  onVerified: (phone: string, deviceToken: string | null) => void;
  /** Defaults to the shared OTP endpoints. */
  transport?: PhoneOtpTransport;
}

export interface PhoneOtp {
  phone: string;
  setPhone: (phone: string) => void;
  /** The canonical form of what is typed, `""` until it is a phone. */
  canonical: string;
  stage: PhoneOtpStage;
  /** A translated message for the current stage, or null. */
  error: string | null;
  sending: boolean;
  verifying: boolean;
  /** Bumped whenever the code boxes should empty and refocus. */
  resetSignal: number;
  start: () => Promise<void>;
  verify: (code: string) => Promise<void>;
  resend: () => Promise<void>;
  changeNumber: () => void;
}

export function usePhoneOtp({ otpRequired, initialPhone = "", onVerified, transport }: PhoneOtpOptions): PhoneOtp {
  const { t } = useTranslation();
  const shared = useOtpTransport();
  const { requestCode, verifyCode, sending, verifying } = transport ?? shared;

  const [phone, setPhoneRaw] = useState(initialPhone);
  const [stage, setStage] = useState<PhoneOtpStage>("phone");
  const [error, setError] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const canonical = canonicalPhone(phone) ?? "";

  const setPhone = useCallback((next: string) => {
    setPhoneRaw(next);
    setError(null);
  }, []);

  const start = useCallback(async () => {
    if (!canonical) {
      setError(t("order.checkout.errPhone", "Please enter a valid phone number."));
      return;
    }
    setError(null);
    const existing = getDeviceToken(canonical);
    if (existing || !otpRequired) {
      onVerified(canonical, existing ?? null);
      return;
    }
    try {
      await requestCode(canonical);
      setStage("otp");
      setResetSignal((n) => n + 1);
    } catch (err) {
      setError(otpRefusal(err) ?? t("order.otp.errSend", "Couldn’t send the code. Try again."));
    }
  }, [canonical, otpRequired, onVerified, requestCode, t]);

  const verify = useCallback(
    async (code: string) => {
      setError(null);
      try {
        const token = await verifyCode(canonical, code);
        setDeviceToken(canonical, token);
        onVerified(canonical, token);
      } catch {
        setError(t("order.otp.errInvalid", "That code didn’t work. Try again."));
        setResetSignal((n) => n + 1);
      }
    },
    [canonical, verifyCode, onVerified, t],
  );

  const resend = useCallback(async () => {
    setError(null);
    try {
      await requestCode(canonical);
      setResetSignal((n) => n + 1);
    } catch (err) {
      setError(otpRefusal(err) ?? t("order.otp.errSend", "Couldn’t send the code. Try again."));
    }
  }, [canonical, requestCode, t]);

  const changeNumber = useCallback(() => {
    setStage("phone");
    setError(null);
  }, []);

  return { phone, setPhone, canonical, stage, error, sending, verifying, resetSignal, start, verify, resend, changeNumber };
}
