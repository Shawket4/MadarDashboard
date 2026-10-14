import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { SERVICE_MODE_ICON, serviceModeOf } from "./service-mode";

/** Pickup / Dine in on an order: a glyph and a word, never colour alone. */
export function ServiceModeBadge({ order, className }: { order: { service_mode?: string | null }; className?: string }) {
  const { t } = useTranslation();
  const mode = serviceModeOf(order);
  const Icon = SERVICE_MODE_ICON[mode];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-sm", className)} data-service-mode={mode}>
      <Icon aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
      {t(`orders.serviceMode.${mode}`)}
    </span>
  );
}
