import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, ArrowRight, Loader2, Phone, RefreshCw, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

import { useOtpRequest, useOtpVerify } from "@/data/api/generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/motion";

import {
  getDeviceToken,
  getGuestPhone,
  isValidPhone,
  normalizePhone,
  setDeviceToken,
  setGuestPhone,
} from "../utils";

const CODE_LEN = 4;

interface PhoneStepProps {
  orgId: string;
  /** Whether this branch requires OTP (when true, OTP is collected inline here
   * if no trusted device token is already stored for the phone). */
  otpRequired: boolean;
  /** Called as soon as the token is resolved — does NOT wait for profile queries.
   * Profile history/locations load in the background at the page level. */
  onContinue: (phone: string, deviceToken: string) => void;
}

export function PhoneStep({ orgId, otpRequired, onContinue }: PhoneStepProps) {
  const { t } = useTranslation();

  const [phone, setPhone] = useState(() => getGuestPhone(orgId) ?? "");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  // True while auto-skipping (localStorage hit on mount)
  const [autoSkipping, setAutoSkipping] = useState(false);

  // OTP digit state
  const [digits, setDigits] = useState<string[]>(Array(CODE_LEN).fill(""));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpError, setOtpError] = useState<string | null>(null);

  const otpRequest = useOtpRequest();
  const otpVerify = useOtpVerify();

  // null  = not yet resolved
  // ""    = resolved without a token (otp_required=false)
  // str   = resolved with a device token
  const [resolvedToken, setResolvedToken] = useState<string | null>(null);
  const normalizedPhone = normalizePhone(phone);

  // Auto-skip: if localStorage already has a valid phone + token (or OTP not required),
  // advance immediately without the user having to interact.
  useEffect(() => {
    const saved = getGuestPhone(orgId);
    if (!saved || !isValidPhone(saved)) return;
    const existing = getDeviceToken(saved);
    if (existing) {
      setPhone(saved);
      setAutoSkipping(true);
      setResolvedToken(existing);
      return;
    }
    if (!otpRequired) {
      setPhone(saved);
      setAutoSkipping(true);
      setResolvedToken("");
    }
    // OTP required + no cached token → show pre-filled phone, user must tap Continue
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Advance the flow as soon as the token is resolved — no query waiting.
  useEffect(() => {
    if (resolvedToken === null) return;
    setGuestPhone(orgId, phone);
    onContinue(normalizedPhone, resolvedToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedToken]);

  // ── Phase 1: phone entry ──────────────────────────────────────────────────
  const handlePhoneSubmit = useCallback(async () => {
    if (!isValidPhone(phone)) {
      setPhoneError(t("order.checkout.errPhone"));
      return;
    }
    setPhoneError(null);

    const existing = getDeviceToken(phone);
    if (existing) {
      setResolvedToken(existing);
      return;
    }

    if (!otpRequired) {
      setResolvedToken("");
      return;
    }

    // Need OTP — request a code and show the inline OTP form.
    try {
      await otpRequest.mutateAsync({ data: { phone: normalizedPhone } });
      setDigits(Array(CODE_LEN).fill(""));
      setStage("otp");
      requestAnimationFrame(() => inputs.current[0]?.focus());
    } catch {
      setPhoneError(t("order.otp.errSend"));
    }
  }, [phone, otpRequired, normalizedPhone, otpRequest, t]);

  // ── Phase 2: OTP entry ────────────────────────────────────────────────────
  const commitCode = useCallback(
    async (code: string) => {
      if (code.length < CODE_LEN) return;
      setOtpError(null);
      try {
        const res = await otpVerify.mutateAsync({ data: { phone: normalizedPhone, code } });
        setDeviceToken(phone, res.device_token);
        setResolvedToken(res.device_token);
      } catch {
        setOtpError(t("order.otp.errInvalid"));
        setDigits(Array(CODE_LEN).fill(""));
        requestAnimationFrame(() => inputs.current[0]?.focus());
      }
    },
    [normalizedPhone, phone, otpVerify, t],
  );

  const handleDigitChange = (idx: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      const next = [...digits];
      next[idx] = "";
      setDigits(next);
      return;
    }
    if (cleaned.length > 1) {
      const next = Array(CODE_LEN).fill("");
      cleaned
        .slice(0, CODE_LEN)
        .split("")
        .forEach((c, i) => (next[i] = c));
      setDigits(next);
      inputs.current[Math.min(cleaned.length, CODE_LEN) - 1]?.focus();
      void commitCode(next.join(""));
      return;
    }
    const next = [...digits];
    next[idx] = cleaned;
    if (idx < CODE_LEN - 1) inputs.current[idx + 1]?.focus();
    setDigits(next);
    if (next.every((d) => d !== "")) void commitCode(next.join(""));
  };

  const handleDigitKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const handleResend = async () => {
    setOtpError(null);
    try {
      await otpRequest.mutateAsync({ data: { phone: normalizedPhone } });
      setDigits(Array(CODE_LEN).fill(""));
      requestAnimationFrame(() => inputs.current[0]?.focus());
    } catch {
      setOtpError(t("order.otp.errSend"));
    }
  };

  // Loading: while OTP is in-flight, or immediately after token resolved (until step transitions).
  const isLoading =
    otpRequest.isPending || otpVerify.isPending || resolvedToken !== null || autoSkipping;

  // While auto-skipping: show a clean loading splash (no form flicker)
  if (autoSkipping) {
    return (
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center gap-4 py-16 text-center text-muted-foreground"
      >
        <Loader2 className="size-8 animate-spin text-brand" />
        <p className="text-sm">{t("common.loading", "Loading…")}</p>
      </motion.div>
    );
  }

  if (stage === "otp") {
    return (
      <motion.div variants={fadeInUp} initial="hidden" animate="show" className="space-y-5">
        <div className="rounded-2xl border border-border/70 bg-card p-6 text-center shadow-sm">
          <span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <ShieldCheck className="size-7" />
          </span>
          <h2 className="font-serif text-lg font-semibold">
            {t("order.otp.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("order.otp.sent", { phone: `+20 ${phone}` })}
          </p>
        </div>

        <div dir="ltr" className="flex justify-center gap-2.5">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              value={d}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleDigitKeyDown(i, e)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={CODE_LEN}
              aria-label={t("order.otp.code")}
              disabled={isLoading}
              className={cn(
                "size-14 rounded-xl border bg-card text-center text-2xl font-bold tabular-nums outline-none transition-colors",
                "focus:border-brand focus:ring-2 focus:ring-brand/30",
                otpError ? "border-destructive" : "border-border/70",
                isLoading && "opacity-50",
              )}
            />
          ))}
        </div>

        {otpError && (
          <p className="flex items-center justify-center gap-1.5 text-center text-sm text-destructive">
            <AlertCircle className="size-3.5 shrink-0" />
            {otpError}
          </p>
        )}

        {isLoading && (
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t("common.loading", "Loading…")}
          </p>
        )}

        <div className="flex items-center justify-center gap-4 text-sm">
          <Button
            variant="link"
            size="sm"
            disabled={otpRequest.isPending}
            onClick={handleResend}
            className="h-auto p-0 text-brand"
          >
            {otpRequest.isPending && <Loader2 className="size-3 animate-spin" />}
            {t("order.otp.resend")}
          </Button>
          <span className="text-muted-foreground/60">·</span>
          <Button
            variant="link"
            size="sm"
            onClick={() => { setStage("phone"); setOtpError(null); }}
            className="h-auto p-0 text-muted-foreground"
          >
            {t("order.otp.change")}
          </Button>
        </div>
      </motion.div>
    );
  }

  // A saved phone was pre-loaded but OTP is required — show the number and offer switching
  const savedPhone = getGuestPhone(orgId);
  const hasSavedPhone = !!savedPhone && isValidPhone(savedPhone);

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="show" className="space-y-5">
      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Phone className="size-4" />
          </span>
          <p className="font-serif text-sm font-semibold">
            {t("order.phone.title", "Your phone number")}
          </p>
        </div>
        {hasSavedPhone && (
          <div className="mb-4 flex items-center justify-between rounded-xl bg-brand/5 px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              {t("order.phone.savedAs", "Ordering as {{phone}}", { phone })}
            </span>
            <button
              type="button"
              onClick={() => { setPhone(""); setPhoneError(null); }}
              className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
            >
              <RefreshCw className="size-3" />
              {t("order.phone.switchNumber", "Switch")}
            </button>
          </div>
        )}
        <p className="mb-4 text-sm text-muted-foreground">
          {t("order.phone.subtitle", "We'll use this to confirm your order and show your past orders.")}
        </p>
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 start-0 flex select-none items-center ps-3 text-sm font-medium text-muted-foreground"
            dir="ltr"
          >
            +20
          </span>
          <Input
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setPhoneError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && void handlePhoneSubmit()}
            placeholder={t("order.checkout.phonePlaceholder")}
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            className="ps-12"
            aria-invalid={!!phoneError}
          />
        </div>
        {phoneError && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="size-3.5 shrink-0" />
            {phoneError}
          </p>
        )}
      </div>

      <Button
        variant="brand"
        size="lg"
        className="w-full"
        loading={isLoading}
        disabled={isLoading}
        onClick={() => void handlePhoneSubmit()}
      >
        {t("order.phone.continue", "Continue")}
        <ArrowRight className="size-4 rtl:rotate-180" />
      </Button>
    </motion.div>
  );
}
