import { useTranslation } from "react-i18next";

import { StatusPill, toneFor } from "@/components/app/status-pill";

/** An order's status. A change in place (a void landing) settles the pill into its new state. */
export function OrderStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <StatusPill popOn={status} tone={toneFor(status, "success")}>
      {t(`orderStatus.${status}`, status)}
    </StatusPill>
  );
}
