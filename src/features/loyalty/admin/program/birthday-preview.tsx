/**
 * The greeting exactly as it will be sent.
 *
 * Rendered by the SERVER, from the same function the birthday sweep calls. A
 * preview reimplemented here is a preview that drifts, and the thing it would
 * drift from is a message sent once a year to a customer — where nobody would
 * ever catch it.
 *
 * It previews the settings being EDITED, not the saved ones: seeing what you
 * are about to save is the whole point.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { previewLoyaltyBirthdayMessage } from "@/data/api/generated/api";
import type { LoyaltySettings } from "@/data/api/generated/models";

export function BirthdayPreview({ settings }: { settings: LoyaltySettings | null }) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<{ en: string; ar: string } | null>(null);

  // Debounced: this is a network call and the fields it watches are typed into.
  const key = settings
    ? JSON.stringify([
        settings.birthday_message,
        settings.birthday_message_ar,
        settings.birthday_reward_amount,
        settings.mode,
        settings.program_name,
      ])
    : null;

  useEffect(() => {
    if (!settings || !key) return;
    let live = true;
    const id = setTimeout(() => {
      previewLoyaltyBirthdayMessage(settings)
        .then((p) => {
          if (live) setPreview(p);
        })
        // A preview that cannot load is not worth an error toast over the form
        // the person is in the middle of filling.
        .catch(() => {
          if (live) setPreview(null);
        });
    }, 400);
    return () => {
      live = false;
      clearTimeout(id);
    };
    // `key` is the debounce trigger; `settings` is read at fire time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!preview) return null;

  return (
    <div className="space-y-2 rounded-lg bg-muted/50 p-3">
      <p className="text-xs font-medium text-muted-foreground">
        {t("loyalty.birthdayPreview", "What they'll receive")}
      </p>
      <p className="text-sm">{preview.en}</p>
      <p className="text-sm" dir="rtl">
        {preview.ar}
      </p>
    </div>
  );
}
