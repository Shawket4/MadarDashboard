/**
 * Phone entry + WhatsApp code for the reservations site: the shared
 * `public-shell` component, with the booking copy.
 */
import { useTranslation } from "react-i18next";

import { PhoneVerify as SharedPhoneVerify } from "@/features/public-shell/phone-verify";

interface Props {
  /** When false the number is taken as-is (branch does not require OTP). */
  otpRequired: boolean;
  initialPhone?: string;
  onVerified: (phone: string, deviceToken: string | null) => void;
  /** A request is IN FLIGHT. Spins the button. */
  busy?: boolean;
  /** The form behind this one is not ready. Greys the button WITHOUT spinning it. */
  disabled?: boolean;
  submitLabel: string;
}

export function PhoneVerify({ otpRequired, submitLabel, ...rest }: Props) {
  const { t } = useTranslation();
  return (
    <SharedPhoneVerify
      otpRequired={otpRequired}
      copy={{
        title: t("reservations.phoneTitle", "Your WhatsApp number"),
        hint: otpRequired
          ? t("reservations.phoneHintOtp", "We’ll send a code to confirm it, then your booking details.")
          : t("reservations.phoneHint", "We’ll send your booking details there."),
        sent: (phone) => t("reservations.otpSent", "We sent a WhatsApp code to {{phone}}.", { phone }),
        submitLabel,
      }}
      {...rest}
    />
  );
}
