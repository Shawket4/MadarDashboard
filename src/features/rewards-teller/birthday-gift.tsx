/**
 * The member's birthday gift: one free item of the
 * programme (a counter shop has no menu, so the shop picks which), valid until
 * its last day. Warm, not loud: an amber wash and the cake, never confetti, so
 * it reads as good news without competing with the Stamp button.
 *
 * One compact row ABOVE the card, so it is the first thing the teller sees and
 * never sits under the phone's sticky Stamp panel. Open: the date and "Give
 * the gift". Claimed or expired: one quiet line, so the teller can answer "did
 * I get my birthday gift?" without a button.
 */
import { useTranslation } from "react-i18next";
import { Cake, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { GiftState } from "./util";

export function BirthdayGift({
  gift,
  busy,
  disabled,
  onGive,
}: {
  gift: GiftState;
  busy?: boolean;
  disabled?: boolean;
  onGive: () => void;
}) {
  const { t } = useTranslation();
  const open = gift.status === "open";
  return (
    <section
      aria-labelledby="gift-title"
      className={cn(
        "flex items-center gap-3 rounded-[24px] border p-3 ps-3.5",
        open
          ? "border-[color-mix(in_oklab,var(--color-warning)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-warning)_11%,var(--color-card))]"
          : "bg-card",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-2xl",
          open ? "bg-warning text-warning-foreground" : "bg-secondary text-muted-foreground",
        )}
      >
        {gift.status === "claimed" ? <Check className="size-6" /> : <Cake className="size-6" />}
      </span>
      <div className="min-w-0 flex-1">
        <h3
          id="gift-title"
          className={cn(
            "text-base font-semibold leading-snug",
            open && "text-[color-mix(in_oklab,var(--color-warning)_50%,var(--color-foreground))]",
          )}
        >
          {open
            ? t("rewardsTeller.giftTitle", "Birthday gift: one free item")
            : gift.status === "claimed"
              ? t("rewardsTeller.giftClaimedTitle", "Birthday gift given")
              : t("rewardsTeller.giftExpiredTitle", "Birthday gift expired")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {open
            ? t("rewardsTeller.giftValid", "Valid until {{date}}", { date: fmtDate(gift.lastDay) })
            : gift.status === "claimed"
              ? t("rewardsTeller.giftClaimedBody", "Already handed over this year.")
              : t("rewardsTeller.giftExpiredBody", "It was valid until {{date}}.", { date: fmtDate(gift.lastDay) })}
        </p>
      </div>
      {open ? (
        <Button className="h-12 shrink-0 rounded-2xl px-4 text-base" loading={busy} disabled={disabled} onClick={onGive}>
          {t("rewardsTeller.giftGive", "Give the gift")}
        </Button>
      ) : null}
    </section>
  );
}
