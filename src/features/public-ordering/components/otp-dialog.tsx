import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, ShieldCheck } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CODE_LEN = 4;

interface OtpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string;
  sending: boolean;
  verifying: boolean;
  /** null when no error; a translated message otherwise. */
  error: string | null;
  onVerify: (code: string) => void;
  onResend: () => void;
  onChangeNumber: () => void;
}

/**
 * A focused 4-digit OTP entry. The customer's phone already received a code;
 * verifying returns a device token that we persist so future orders skip OTP.
 */
export function OtpDialog({
  open,
  onOpenChange,
  phone,
  sending,
  verifying,
  error,
  onVerify,
  onResend,
  onChangeNumber,
}: OtpDialogProps) {
  const { t } = useTranslation();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LEN).fill(""));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      setDigits(Array(CODE_LEN).fill(""));
      // Focus the first box after the dialog mounts.
      requestAnimationFrame(() => inputs.current[0]?.focus());
    }
  }, [open]);

  const code = digits.join("");

  const commit = (next: string[]) => {
    setDigits(next);
    if (next.every((d) => d !== "")) onVerify(next.join(""));
  };

  const handleChange = (idx: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      const next = [...digits];
      next[idx] = "";
      setDigits(next);
      return;
    }
    // Support paste of the full code into any box.
    if (cleaned.length > 1) {
      const next = Array(CODE_LEN).fill("");
      cleaned
        .slice(0, CODE_LEN)
        .split("")
        .forEach((c, i) => (next[i] = c));
      commit(next);
      inputs.current[Math.min(cleaned.length, CODE_LEN) - 1]?.focus();
      return;
    }
    const next = [...digits];
    next[idx] = cleaned;
    if (idx < CODE_LEN - 1) inputs.current[idx + 1]?.focus();
    commit(next);
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <div className="flex flex-col items-center text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
            <ShieldCheck className="size-6" />
          </span>
          <DialogTitle>{t("order.otp.title")}</DialogTitle>
          <DialogDescription className="mt-1">
            {t("order.otp.sent", { phone })}
          </DialogDescription>
        </div>

        <div dir="ltr" className="my-4 flex justify-center gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={CODE_LEN}
              aria-label={t("order.otp.code")}
              className={cn(
                "size-12 rounded-xl border bg-background text-center text-xl font-bold tabular-nums outline-none transition-colors",
                "focus:border-brand focus:ring-2 focus:ring-brand/30",
                error ? "border-destructive" : "border-border",
              )}
            />
          ))}
        </div>

        {error && <p className="text-center text-sm text-destructive">{error}</p>}

        <Button
          className="w-full"
          size="lg"
          loading={verifying}
          disabled={code.length < CODE_LEN || verifying}
          onClick={() => onVerify(code)}
        >
          {t("order.otp.verifyAndPlace")}
        </Button>

        <div className="mt-1 flex items-center justify-center gap-4 text-sm">
          <Button variant="link" size="sm" disabled={sending} onClick={onResend} className="h-auto p-0">
            {sending && <Loader2 className="size-3 animate-spin" />}
            {t("order.otp.resend")}
          </Button>
          <span className="text-muted-foreground">·</span>
          <Button variant="link" size="sm" onClick={onChangeNumber} className="h-auto p-0">
            {t("order.otp.change")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
