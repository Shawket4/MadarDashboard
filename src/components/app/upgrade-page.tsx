/**
 * "This is on the paid plan": the page a Free org gets instead of a paid
 * feature (route gate), and the same words anywhere the app has to say so.
 * Upgrading is manual (owner decision 2026-10-11): the owner switches the
 * plan in super admin, so the way up is a message to Madar on WhatsApp.
 */
import { useTranslation } from "react-i18next";
import { Gem, MessageCircle } from "lucide-react";

import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { madarWhatsAppHref } from "@/config/contact";
import type { Feature } from "@/generated/plans";

/** The upgrade link: a WhatsApp message to Madar in the reader's language. */
function useUpgradeHref(feature?: Feature): string {
  const { t } = useTranslation();
  const featureName = feature ? t(`plan.features.${feature}`) : undefined;
  const text = featureName
    ? t("plan.upgrade.message", { feature: featureName, defaultValue: "Hello Madar, I would like to move my shop to the paid plan ({{feature}})." })
    : t("plan.upgrade.messageGeneric", "Hello Madar, I would like to move my shop to the paid plan.");
  return madarWhatsAppHref(text);
}

export function UpgradeButton({
  feature,
  variant = "default",
  size,
  label,
}: {
  feature?: Feature;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  /** Replaces "Contact Madar on WhatsApp" where the button answers a specific limit. */
  label?: string;
}) {
  const { t } = useTranslation();
  const href = useUpgradeHref(feature);
  return (
    <Button asChild variant={variant} size={size}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="size-4" aria-hidden />
        {label ?? t("plan.upgrade.cta", "Contact Madar on WhatsApp")}
        <span className="sr-only">{t("common.opensInNewTab", "(opens in a new tab)")}</span>
      </a>
    </Button>
  );
}

export function UpgradePage({ feature }: { feature: Feature }) {
  const { t } = useTranslation();
  const name = t(`plan.features.${feature}`);
  return (
    <div className="p-6">
      <EmptyState
        icon={Gem}
        title={t("plan.upgrade.title", { feature: name, defaultValue: "{{feature}} is on the paid plan" })}
        description={t(
          "plan.upgrade.body",
          "Your shop is on the Free plan. Contact Madar to move to the paid plan; your sales and your data stay exactly as they are.",
        )}
        action={<UpgradeButton feature={feature} />}
      />
    </div>
  );
}
