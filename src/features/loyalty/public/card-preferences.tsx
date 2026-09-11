/**
 * The two things a customer can change about their own card.
 *
 * The token in the URL is the credential — the same one their pass carries and
 * the till scans. Deliberately so: someone who has just been messaged has to be
 * able to stop the messages by tapping the link in the message, not by
 * remembering a password they never made.
 *
 * The language half is not a control at all. We stored whatever their phone
 * said the day they signed up, and a phone that has since changed language is a
 * customer still being written to in the wrong one. Opening their own card is
 * the moment we can notice, so the page reports it rather than asking.
 */
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BellOff } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { useSetLoyaltyCardPreferences } from "@/data/api/generated/api";

import { Panel } from "./page-shell";

export function CardPreferences({
  token,
  optedOut,
}: {
  token: string;
  optedOut: boolean;
}) {
  const { t, i18n } = useTranslation();
  const save = useSetLoyaltyCardPreferences();
  const [off, setOff] = useState(optedOut);
  const told = useRef(false);

  // Once per visit, and only when it differs from what we hold.
  const locale = (i18n.resolvedLanguage ?? "en").startsWith("ar") ? "ar" : "en";
  useEffect(() => {
    if (told.current) return;
    told.current = true;
    save.mutate({ token, data: { locale } });
    // Deliberately once on mount: this reports a fact, it is not a control.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Panel>
      {/* The whole row is the label, so the tap target is the row and not a
          32px switch at the end of it. */}
      <label className="flex cursor-pointer items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
          <BellOff className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium leading-snug">
            {t("loyalty.noMessages", "Stop messages from this shop")}
          </span>
          <span className="block text-[13px] leading-snug text-muted-foreground">
            {t(
              "loyalty.noMessagesHint",
              "Your card and your balance stay exactly as they are.",
            )}
          </span>
        </span>
        <Switch
          checked={off}
          onCheckedChange={(v) => {
            // Optimistic: a switch that waits on a network round trip reads as
            // broken, and the worst case here is one more message.
            setOff(v);
            save.mutate({ token, data: { marketing_opt_out: v } });
          }}
          aria-label={t("loyalty.noMessages", "Stop messages from this shop")}
        />
      </label>
    </Panel>
  );
}
