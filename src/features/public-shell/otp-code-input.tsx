/**
 * The four boxes a WhatsApp code is typed into. One implementation for every
 * public surface (ordering's phone step and checkout dialog, bookings, the
 * loyalty sign-up): digits only, a paste of the whole code lands in any box,
 * Backspace walks back, and the code is handed over the moment it is complete.
 */
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export const OTP_CODE_LEN = 4;

const blank = (): string[] => Array<string>(OTP_CODE_LEN).fill("");

interface Props {
  /** The code is complete — every box holds a digit. */
  onComplete: (code: string) => void;
  /** Every change, for a caller that enables its own "Verify" button. */
  onCodeChange?: (code: string) => void;
  /** Bump to empty the boxes and focus the first — a fresh code, a wrong one. */
  resetSignal?: number;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}

export function OtpCodeInput({ onComplete, onCodeChange, resetSignal = 0, disabled, invalid, className }: Props) {
  const { t } = useTranslation();
  const [digits, setDigits] = useState<string[]>(blank);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setDigits(blank());
    onCodeChange?.("");
    // After the boxes are enabled again / the dialog has mounted.
    const id = requestAnimationFrame(() => inputs.current[0]?.focus());
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  const put = (next: string[]) => {
    setDigits(next);
    const code = next.join("");
    onCodeChange?.(code);
    if (next.every((d) => d !== "")) onComplete(code);
  };

  const handleChange = (idx: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    if (cleaned.length > 1) {
      // A paste (or SMS autofill) of the whole code into any box.
      const next = blank();
      cleaned.slice(0, OTP_CODE_LEN).split("").forEach((c, i) => (next[i] = c));
      inputs.current[Math.min(cleaned.length, OTP_CODE_LEN) - 1]?.focus();
      put(next);
      return;
    }
    const next = [...digits];
    next[idx] = cleaned;
    if (cleaned && idx < OTP_CODE_LEN - 1) inputs.current[idx + 1]?.focus();
    put(next);
  };

  return (
    <div dir="ltr" className={cn("flex justify-center gap-2.5", className)}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            inputs.current[i] = el;
          }}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={OTP_CODE_LEN}
          aria-label={t("order.otp.code", "Verification code")}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          className={cn(
            "size-14 rounded-xl border bg-card text-center text-2xl font-bold tabular-nums outline-none transition-colors",
            "focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-ring/50",
            invalid ? "border-destructive" : "border-border/70",
            disabled && "opacity-50",
          )}
        />
      ))}
    </div>
  );
}
