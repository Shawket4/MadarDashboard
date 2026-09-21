/** A booking's status, toned — shared by the bookings list and a customer's bookings. */
import { useTranslation } from "react-i18next";

import { StatusPill } from "@/components/app/status-pill";

import { STATUS_TONES, type BookingStatus } from "./util";

export function BookingStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <StatusPill tone={STATUS_TONES[status as BookingStatus] ?? "neutral"}>
      {t(`bookings.status.${status}`, status.replace("_", " "))}
    </StatusPill>
  );
}
