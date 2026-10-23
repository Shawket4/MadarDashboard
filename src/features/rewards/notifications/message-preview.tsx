/**
 * The message as a member meets it: the lock-screen notification the wallet
 * raises, and the line it leaves on the card (Apple's auxiliary row; Google's
 * message under the card). A member reading Arabic gets the Arabic line, else
 * the English one, each falling back to the other (madar-card's
 * `message_line_for`). Mocks in the system font, as the OS draws them.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Wallet } from "lucide-react";

import { SegmentedControl } from "@/components/app/segmented-control";
import type { Message } from "@/data/api/generated/models";

import { useCardRules } from "../use-card-rules";

type Store = "apple" | "google";
type Lang = "en" | "ar";

export function MessagePreview({ message }: { message: Message }) {
  const { t } = useTranslation();
  const { rules: card } = useCardRules();
  const [store, setStore] = useState<Store>("apple");
  const [lang, setLang] = useState<Lang>("en");
  const arabic = lang === "ar";
  const line = card ? card.message_line_for(message, arabic).trim() : (arabic ? message.ar : message.en) ?? "";
  const dir = arabic ? "rtl" : "ltr";
  const empty = t("rewards.notifications.previewEmpty", "Your message appears here.");

  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4" aria-label={t("rewards.notifications.previewTitle", "Preview")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{t("rewards.notifications.previewTitle", "Preview")}</h2>
        <div className="flex flex-wrap gap-2">
          <SegmentedControl
            value={store}
            onChange={setStore}
            options={[
              { value: "apple", label: t("rewards.notifications.apple", "Apple Wallet") },
              { value: "google", label: t("rewards.notifications.google", "Google Wallet") },
            ]}
          />
          <SegmentedControl
            value={lang}
            onChange={setLang}
            options={[
              { value: "en", label: "EN" },
              { value: "ar", label: "ع" },
            ]}
          />
        </div>
      </div>

      {/* The lock screen: the notification the wallet raises. */}
      <div className="rounded-xl bg-muted p-3">
        <p className="mb-2 text-center text-xs text-muted-foreground">{t("rewards.notifications.lockScreen", "Lock screen")}</p>
        <div className="flex items-start gap-2.5 rounded-xl border bg-background p-3 shadow-xs" dir={dir} data-testid="preview-notification">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-foreground text-background" aria-hidden>
            <Wallet className="size-4" />
          </span>
          <div className="min-w-0 flex-1 font-sans">
            <p className="text-xs font-semibold">
              {store === "apple" ? (arabic ? "المحفظة" : "Wallet") : "Google Wallet"}
            </p>
            <p className="text-sm break-words">{line || <span className="text-muted-foreground">{empty}</span>}</p>
          </div>
        </div>
      </div>

      {/* The card: where the line stays after the notification. */}
      <div dir={dir}>
        {store === "apple" ? (
          <div className="rounded-xl border bg-background p-3" data-testid="preview-card">
            <div className="mb-2 h-12 rounded-md bg-muted" aria-hidden />
            <p className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">{arabic ? "رسالة" : "Message"}</p>
            <p className="text-sm break-words">{line || <span className="text-muted-foreground">{empty}</span>}</p>
          </div>
        ) : (
          <div className="space-y-2" data-testid="preview-card">
            <div className="h-20 rounded-2xl bg-muted" aria-hidden />
            <div className="rounded-xl border bg-background p-3">
              <p className="text-sm break-words">{line || <span className="text-muted-foreground">{empty}</span>}</p>
            </div>
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground" dir="auto">
          {store === "apple"
            ? t("rewards.notifications.previewAppleHint", "On an iPhone the line stays on the card's front until the next message.")
            : t("rewards.notifications.previewGoogleHint", "Google Wallet shows the message on the card's details.")}
        </p>
      </div>
    </section>
  );
}
