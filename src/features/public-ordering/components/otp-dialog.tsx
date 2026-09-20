import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, ShieldCheck } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OTP_CODE_LEN, OtpCodeInput } from "@/features/public-shell/otp-code-input";
import { formatPhoneDisplay, ltrIsolate } from "@/lib/phone";

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
  const [code, setCode] = useState("");
  // Fresh boxes every time the dialog opens, and after a refused code.
  const [resetSignal, setResetSignal] = useState(0);
  useEffect(() => {
    if (open) setResetSignal((n) => n + 1);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <div className="flex flex-col items-center text-center">
          <span className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <ShieldCheck className="size-7" />
          </span>
          <DialogTitle className="font-serif text-xl">{t("order.otp.title")}</DialogTitle>
          <DialogDescription className="mt-1 text-muted-foreground">
            {t("order.otp.sent", { phone: ltrIsolate(formatPhoneDisplay(phone)) })}
          </DialogDescription>
        </div>

        <OtpCodeInput
          className="my-5"
          onComplete={onVerify}
          onCodeChange={setCode}
          resetSignal={resetSignal}
          invalid={!!error}
        />

        {error && <p role="alert" className="text-center text-sm text-destructive">{error}</p>}

        <Button
          variant="brand"
          className="w-full"
          size="lg"
          loading={verifying}
          disabled={code.length < OTP_CODE_LEN || verifying}
          onClick={() => onVerify(code)}
        >
          {t("order.otp.verifyAndPlace")}
        </Button>

        <div className="mt-3 flex items-center justify-center gap-4 text-sm">
          <Button
            variant="link"
            size="sm"
            disabled={sending}
            onClick={onResend}
            className="h-auto p-0 text-brand"
          >
            {sending && <Loader2 className="size-3 animate-spin" />}
            {t("order.otp.resend")}
          </Button>
          <span className="text-muted-foreground/60">·</span>
          <Button
            variant="link"
            size="sm"
            onClick={onChangeNumber}
            className="h-auto p-0 text-muted-foreground"
          >
            {t("order.otp.change")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
