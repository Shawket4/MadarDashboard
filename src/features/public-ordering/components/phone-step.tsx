import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

import { fadeInUp } from "@/lib/motion";
import { formatPhoneDisplay, formatPhoneInput, ltrIsolate } from "@/lib/phone";
import { getDeviceToken, getGuestPhone, setGuestPhone } from "@/features/public-shell/guest";
import { PhoneVerifyView } from "@/features/public-shell/phone-verify";
import { usePhoneOtp } from "@/features/public-shell/use-phone-otp";

interface PhoneStepProps {
  orgId: string;
  /** Whether this branch requires OTP (when true, OTP is collected inline here
   * if no trusted device token is already stored for the phone). */
  otpRequired: boolean;
  /** Called as soon as the token is resolved — does NOT wait for profile queries.
   * Profile history/locations load in the background at the page level. */
  onContinue: (phone: string, deviceToken: string) => void;
}

/**
 * The ordering flow's first step. The phone/OTP machine and its look are the
 * shared `public-shell` ones; what is this step's own is remembering the guest
 * per org, and skipping itself entirely for a guest this device already knows.
 */
export function PhoneStep({ orgId, otpRequired, onContinue }: PhoneStepProps) {
  const { t } = useTranslation();

  // The phone this device last ordered with, canonical (see `getGuestPhone`).
  const [saved] = useState(() => getGuestPhone(orgId));
  // Auto-skip: a saved phone with a device token (or OTP off) needs nothing
  // from the customer — advance without showing the form at all.
  const [autoSkip] = useState(() => !!saved && (!!getDeviceToken(saved) || !otpRequired));
  // Set once the phone is resolved; the step keeps spinning until the page moves on.
  const [resolved, setResolved] = useState(false);

  const proceed = useCallback(
    (phone: string, deviceToken: string | null) => {
      setResolved(true);
      setGuestPhone(orgId, phone);
      // "" = resolved without a token (otp_required=false).
      onContinue(phone, deviceToken ?? "");
    },
    [orgId, onContinue],
  );

  const otp = usePhoneOtp({ otpRequired, initialPhone: formatPhoneInput(saved), onVerified: proceed });

  useEffect(() => {
    if (autoSkip && saved) proceed(saved, getDeviceToken(saved));
    // Once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While auto-skipping: show a clean loading splash (no form flicker)
  if (autoSkip) {
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

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="show">
      <PhoneVerifyView
        otp={otp}
        busy={resolved}
        roomy
        submitVariant="brand"
        copy={{
          title: t("order.phone.title", "Your phone number"),
          hint: t("order.phone.subtitle", "We'll use this to confirm your order and show your past orders."),
          sent: (phone) => t("order.otp.sent", { phone }),
          submitLabel: (
            <>
              {t("order.phone.continue", "Continue")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </>
          ),
        }}
        banner={
          // A saved phone was pre-loaded but OTP is required — show the number and offer switching
          saved ? (
            <div className="mb-4 flex items-center justify-between rounded-xl bg-brand/5 px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                {t("order.phone.savedAs", "Ordering as {{phone}}", { phone: ltrIsolate(formatPhoneDisplay(otp.canonical || saved)) })}
              </span>
              <button
                type="button"
                onClick={() => otp.setPhone("")}
                className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
              >
                <RefreshCw className="size-3" />
                {t("order.phone.switchNumber", "Switch")}
              </button>
            </div>
          ) : null
        }
      />
    </motion.div>
  );
}
