/**
 * Phone entry + WhatsApp code for the reservations site. Same contract as the
 * ordering flow's step (the OTP endpoints and device token are shared), kept
 * small: a number, a code, done. A phone already verified on this device
 * (token in localStorage) skips the code.
 */
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Loader2, Phone, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOtpRequest, useOtpVerify } from "@/data/api/generated/api";
import { cn } from "@/lib/utils";
import { getDeviceToken, isValidPhone, normalizePhone, setDeviceToken } from "@/features/public-shell/guest";

const CODE_LEN = 4;

interface Props {
  /** When false the number is taken as-is (branch does not require OTP). */
  otpRequired: boolean;
  initialPhone?: string;
  onVerified: (phone: string, deviceToken: string | null) => void;
  /** A request is IN FLIGHT. Spins the button. */
  busy?: boolean;
  /**
   * The form behind this one is not ready — a missing name, say. Greys the
   * button WITHOUT spinning it.
   *
   * Separate from `busy` because folding the two together is a lie to the
   * customer: the sign-up page passed `busy={join.isPending || !name.trim()}`
   * and an untouched form sat there spinning, as though something were being
   * worked on, before anyone had typed anything. It stopped the moment a
   * letter was entered, which is a strange enough behaviour that the page
   * looks broken either way round.
   */
  disabled?: boolean;
  submitLabel: string;
}

export function PhoneVerify({
  otpRequired,
  initialPhone = "",
  onVerified,
  busy = false,
  disabled = false,
  submitLabel,
}: Props) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState(initialPhone);
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState<string | null>(null);
  const [digits, setDigits] = useState<string[]>(Array(CODE_LEN).fill(""));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const otpRequest = useOtpRequest();
  const otpVerify = useOtpVerify();
  const normalized = normalizePhone(phone);

  const start = useCallback(async () => {
    if (!isValidPhone(phone)) {
      setError(t("order.checkout.errPhone", "Enter a valid Egyptian mobile number"));
      return;
    }
    setError(null);
    const existing = getDeviceToken(phone);
    if (existing || !otpRequired) {
      onVerified(normalized, existing ?? null);
      return;
    }
    try {
      await otpRequest.mutateAsync({ data: { phone: normalized } });
      setDigits(Array(CODE_LEN).fill(""));
      setStage("otp");
      requestAnimationFrame(() => inputs.current[0]?.focus());
    } catch {
      setError(t("order.otp.errSend", "Couldn’t send the code. Try again."));
    }
  }, [phone, normalized, otpRequired, otpRequest, onVerified, t]);

  const commit = useCallback(
    async (code: string) => {
      if (code.length < CODE_LEN) return;
      setError(null);
      try {
        const res = await otpVerify.mutateAsync({ data: { phone: normalized, code } });
        setDeviceToken(phone, res.device_token);
        onVerified(normalized, res.device_token);
      } catch {
        setError(t("order.otp.errInvalid", "That code didn’t work. Try again."));
        setDigits(Array(CODE_LEN).fill(""));
        requestAnimationFrame(() => inputs.current[0]?.focus());
      }
    },
    [normalized, phone, otpVerify, onVerified, t],
  );

  const onDigit = (idx: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    const next = [...digits];
    if (cleaned.length > 1) {
      cleaned.slice(0, CODE_LEN).split("").forEach((c, i) => (next[i] = c));
      setDigits(next);
      void commit(next.join(""));
      return;
    }
    next[idx] = cleaned;
    setDigits(next);
    if (cleaned && idx < CODE_LEN - 1) inputs.current[idx + 1]?.focus();
    if (next.every((d) => d !== "")) void commit(next.join(""));
  };

  const loading = otpRequest.isPending || otpVerify.isPending || busy;

  if (stage === "otp") {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-border/70 bg-card p-6 text-center shadow-sm">
          <span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <ShieldCheck className="size-7" />
          </span>
          <h2 className="font-serif text-lg font-semibold">{t("order.otp.title", "Verify your phone")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("reservations.otpSent", "We sent a WhatsApp code to {{phone}}.", { phone: `+20 ${phone}` })}
          </p>
        </div>
        <div dir="ltr" className="flex justify-center gap-2.5">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              value={d}
              onChange={(e) => onDigit(i, e.target.value)}
              onKeyDown={(e) => { if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus(); }}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={CODE_LEN}
              aria-label={t("order.otp.code", "Verification code")}
              disabled={loading}
              className={cn(
                "size-14 rounded-xl border bg-card text-center text-2xl font-bold tabular-nums outline-none transition-colors",
                "focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-ring/50",
                error ? "border-destructive" : "border-border/70",
                loading && "opacity-50",
              )}
            />
          ))}
        </div>
        {error ? <p className="flex items-center justify-center gap-1.5 text-sm text-destructive"><AlertCircle className="size-3.5" />{error}</p> : null}
        {loading ? <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />{t("common.loading", "Loading…")}</p> : null}
        <div className="flex items-center justify-center gap-4 text-sm">
          <Button variant="link" size="sm" className="h-auto p-0 text-brand" disabled={otpRequest.isPending} onClick={() => void start()}>
            {t("order.otp.resend", "Resend code")}
          </Button>
          <span className="text-muted-foreground/60">·</span>
          <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground" onClick={() => { setStage("phone"); setError(null); }}>
            {t("order.otp.change", "Change number")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-xl bg-brand/10 text-brand"><Phone className="size-4" /></span>
          <p className="font-serif text-sm font-semibold">{t("reservations.phoneTitle", "Your WhatsApp number")}</p>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          {otpRequired
            ? t("reservations.phoneHintOtp", "We’ll send a code to confirm it, then your booking details.")
            : t("reservations.phoneHint", "We’ll send your booking details there.")}
        </p>
        <div className="relative">
          <span aria-hidden className="pointer-events-none absolute inset-y-0 start-0 flex select-none items-center ps-3 text-sm font-medium text-muted-foreground" dir="ltr">+20</span>
          <Input
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && void start()}
            placeholder={t("order.checkout.phonePlaceholder", "01x xxxx xxxx")}
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            className="ps-12"
            aria-invalid={!!error}
          />
        </div>
        {error ? <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="size-3.5" />{error}</p> : null}
      </div>
      <Button
        className="w-full"
        size="lg"
        onClick={() => void start()}
        loading={loading}
        disabled={disabled}
      >
        {submitLabel}
      </Button>
    </div>
  );
}
