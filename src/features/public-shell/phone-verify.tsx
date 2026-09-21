/**
 * Phone entry + WhatsApp code, for every public surface: a number, a code,
 * done. A phone already verified on this device (token in localStorage) skips
 * the code. The state machine is `usePhoneOtp`; this file is what it looks like.
 *
 * `PhoneVerify` owns its machine — drop it in. `PhoneVerifyView` takes one from
 * outside, for a page (ordering's phone step) that also drives the machine
 * itself. The copy is the caller's: a stamp-card sign-up must not talk about
 * bookings, and neither should an order.
 */
import type { ComponentProps, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Loader2, Phone, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPhoneDisplay, ltrIsolate } from "@/lib/phone";
import { cn } from "@/lib/utils";

import { OtpCodeInput } from "./otp-code-input";
import { usePhoneOtp, type PhoneOtp, type PhoneOtpOptions } from "./use-phone-otp";

export interface PhoneVerifyCopy {
  /** Heading of the phone card. */
  title: string;
  /** The line under it. */
  hint: string;
  /** "We sent a code to …" — given the phone formatted for reading, already LTR-isolated. */
  sent: (phone: string) => string;
  submitLabel: ReactNode;
}

interface ViewProps {
  otp: PhoneOtp;
  copy: PhoneVerifyCopy;
  /** A request is IN FLIGHT. Spins the button. */
  busy?: boolean;
  /**
   * The form behind this one is not ready — a missing name, say. Greys the
   * button WITHOUT spinning it.
   *
   * Separate from `busy` because folding the two together is a lie to the
   * customer: the sign-up page passed `busy={join.isPending || !name.trim()}`
   * and an untouched form sat there spinning, as though something were being
   * worked on, before anyone had typed anything.
   */
  disabled?: boolean;
  submitVariant?: ComponentProps<typeof Button>["variant"];
  /** Roomier card, as the ordering step draws it. */
  roomy?: boolean;
  /** Sits above the hint — ordering's "Ordering as … · Switch". */
  banner?: ReactNode;
}

export function PhoneVerifyView({ otp, copy, busy = false, disabled = false, submitVariant, roomy = false, banner }: ViewProps) {
  const { t } = useTranslation();
  const loading = otp.sending || otp.verifying || busy;

  if (otp.stage === "otp") {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-border/70 bg-card p-6 text-center shadow-sm">
          <span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <ShieldCheck className="size-7" />
          </span>
          <h2 className="font-serif text-lg font-semibold">{t("order.otp.title", "Verify your phone")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{copy.sent(ltrIsolate(formatPhoneDisplay(otp.canonical)))}</p>
        </div>
        <OtpCodeInput
          onComplete={(code) => void otp.verify(code)}
          resetSignal={otp.resetSignal}
          disabled={loading}
          invalid={!!otp.error}
        />
        {otp.error ? (
          <p role="alert" className="flex items-center justify-center gap-1.5 text-center text-sm text-destructive">
            <AlertCircle className="size-3.5 shrink-0" />
            {otp.error}
          </p>
        ) : null}
        {loading ? (
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t("common.loading", "Loading…")}
          </p>
        ) : null}
        <div className="flex items-center justify-center gap-4 text-sm">
          <Button variant="link" size="sm" className="h-auto p-0 text-brand" disabled={otp.sending} onClick={() => void otp.resend()}>
            {otp.sending ? <Loader2 className="size-3 animate-spin" /> : null}
            {t("order.otp.resend", "Resend code")}
          </Button>
          <span className="text-muted-foreground/60">·</span>
          <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground" onClick={otp.changeNumber}>
            {t("order.otp.change", "Change number")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={roomy ? "space-y-5" : "space-y-4"}>
      <div className={cn("rounded-2xl border border-border/70 bg-card shadow-sm", roomy ? "p-6" : "p-5")}>
        <div className={cn("flex items-center gap-2", roomy ? "mb-4" : "mb-3")}>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Phone className="size-4" />
          </span>
          <p className="font-serif text-sm font-semibold">{copy.title}</p>
        </div>
        {banner}
        <p className={cn("text-sm text-muted-foreground", roomy ? "mb-4" : "mb-3")}>{copy.hint}</p>
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 start-0 flex select-none items-center ps-3 text-sm font-medium text-muted-foreground"
            dir="ltr"
          >
            +20
          </span>
          <Input
            value={otp.phone}
            onChange={(e) => otp.setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void otp.start()}
            placeholder={t("order.checkout.phonePlaceholder", "01x xxxx xxxx")}
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            className="ps-12"
            aria-label={copy.title}
            aria-invalid={!!otp.error}
          />
        </div>
        {otp.error ? (
          <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="size-3.5 shrink-0" />
            {otp.error}
          </p>
        ) : null}
      </div>
      <Button className="w-full" size="lg" variant={submitVariant} onClick={() => void otp.start()} loading={loading} disabled={disabled}>
        {copy.submitLabel}
      </Button>
    </div>
  );
}

type Props = PhoneOtpOptions & Omit<ViewProps, "otp">;

export function PhoneVerify({ otpRequired, initialPhone, onVerified, transport, ...view }: Props) {
  const otp = usePhoneOtp({ otpRequired, initialPhone, onVerified, transport });
  return <PhoneVerifyView otp={otp} {...view} />;
}
