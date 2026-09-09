/**
 * What the signup form asks for, and what happens afterwards.
 *
 * The birthday fields collapse when birthdays are off, rather than sitting
 * there disabled: off means the signup form does not ASK, and a set of greyed
 * inputs implies a date of birth is being held somewhere. It is not.
 */
import { useTranslation } from "react-i18next";
import type { UseFormReturn } from "react-hook-form";

import { Card, CardContent } from "@/components/ui/card";

import { BirthdayPreview } from "./birthday-preview";
import type { ProgramValues } from "./form-schema";
import { previewOf } from "./form-schema";
import { TextRow, ToggleRow } from "./fields";
import type { LoyaltySettings } from "@/data/api/generated/models";

export function SignupCard({
  form,
  saved,
}: {
  form: UseFormReturn<ProgramValues>;
  saved: LoyaltySettings | undefined;
}) {
  const { t } = useTranslation();
  const values = form.watch();

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <ToggleRow
          form={form}
          name="require_otp"
          label={t("loyalty.requireOtp", "Verify phone on signup")}
          hint={t(
            "loyalty.requireOtpHint",
            "Sends a WhatsApp code, like ordering and bookings.",
          )}
        />

        <ToggleRow
          form={form}
          name="birthday_enabled"
          label={t("loyalty.birthdays", "Birthdays")}
          hint={t(
            "loyalty.birthdaysHint",
            "Asks for a date of birth at signup and sends a WhatsApp greeting on the day. Off means the form does not ask at all.",
          )}
        />

        {values.birthday_enabled ? (
          <div className="space-y-4 rounded-lg border border-border/70 p-3">
            <TextRow
              form={form}
              name="birthday_reward_amount"
              label={t("loyalty.birthdayGift", "Birthday gift")}
              placeholder={t("loyalty.birthdayGiftNone", "Leave empty for a greeting only")}
              hint={t(
                "loyalty.birthdayGiftHint",
                "Points or stamps added on the day. Optional — plenty of shops greet without giving anything away.",
              )}
            />
            <TextRow
              form={form}
              name="birthday_message"
              label={t("loyalty.birthdayMessage", "Message (English)")}
              placeholder={t(
                "loyalty.birthdayMessagePlaceholder",
                "Leave empty to use ours. {name} becomes their name.",
              )}
            />
            <TextRow
              form={form}
              name="birthday_message_ar"
              dir="rtl"
              label={t("loyalty.birthdayMessageAr", "Message (Arabic)")}
              placeholder={t(
                "loyalty.birthdayMessageArPlaceholder",
                "Leave empty and Arabic members get the English one.",
              )}
            />
            <BirthdayPreview settings={previewOf(values, saved)} />
          </div>
        ) : null}

        <ToggleRow
          form={form}
          name="winback_enabled"
          label={t("loyalty.winback", "Win back quiet customers")}
          hint={t(
            "loyalty.winbackHint",
            "Messages a member who has not been in for a week, and once more a week later. Never a third time, and never someone who has asked you to stop.",
          )}
        />

        {values.winback_enabled ? (
          <div className="space-y-4 rounded-lg border border-border/70 p-3">
            <TextRow
              form={form}
              name="winback_reward_amount"
              label={t("loyalty.winbackGift", "Something to come back for")}
              placeholder={t(
                "loyalty.winbackGiftNone",
                "Leave empty for words only",
              )}
              hint={t(
                "loyalty.winbackGiftHint",
                "Points or stamps added with the message. A nudge carrying something converts far better than one that does not.",
              )}
            />
            <TextRow
              form={form}
              name="winback_message"
              label={t("loyalty.winbackMessage", "Your own wording")}
              placeholder={t(
                "loyalty.winbackMessagePlaceholder",
                "Leave empty to use ours, written in each language. {name} becomes their name.",
              )}
              hint={t(
                "loyalty.winbackMessageHint",
                "One message, in whichever language you write it — it replaces both of ours. A link to their card is always added, so they can stop the messages.",
              )}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
