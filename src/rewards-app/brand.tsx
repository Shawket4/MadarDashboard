import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/**
 * The present on its tile (the Rewards by Madar design system, public-rewards/):
 * Ink on light, Paper on dark. Rewards is monochrome, so nothing here is teal.
 */
export function RewardsTile({ className }: { className?: string }) {
  return (
    <>
      <img src="/tile-ink.svg" alt="" className={cn("size-9 shrink-0 dark:hidden", className)} />
      <img src="/tile-paper.svg" alt="" className={cn("hidden size-9 shrink-0 dark:block", className)} />
    </>
  );
}

/** The tile and the product's name, "Rewards" over "by Madar". */
export function RewardsLockup({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <RewardsTile />
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-[15px] font-semibold tracking-tight">{t("rewardsApp.wordmark", "Rewards")}</span>
        <span className="block truncate text-xs text-muted-foreground">{t("rewardsApp.byMadar", "by Madar")}</span>
      </span>
    </span>
  );
}
