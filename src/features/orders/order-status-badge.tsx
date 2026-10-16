import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { StatusPill, toneFor } from "@/components/app/status-pill";
import { useChangeSignal, usePop } from "@/lib/motion";

/** An order's status. A change in place (a void landing) settles the pill into its new state. */
export function OrderStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLSpanElement>(null);
  usePop(ref, useChangeSignal(status));
  return (
    <span ref={ref} className="inline-flex">
      <StatusPill tone={toneFor(status, "success")}>{t(`orderStatus.${status}`, status)}</StatusPill>
    </span>
  );
}
