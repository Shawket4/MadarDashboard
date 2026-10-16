/** A booking's status, toned — shared by the bookings list and a customer's bookings. */
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { StatusPill } from "@/components/app/status-pill";
import { useChangeSignal, usePop } from "@/lib/motion";

import { STATUS_TONES, type BookingStatus } from "./util";

export function BookingStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  // Seated, no-show, cancelled: a change in place settles the pill into its new state.
  const ref = useRef<HTMLSpanElement>(null);
  usePop(ref, useChangeSignal(status));
  return (
    <span ref={ref} className="inline-flex">
      <StatusPill tone={STATUS_TONES[status as BookingStatus] ?? "neutral"}>
        {t(`bookings.status.${status}`, status.replace("_", " "))}
      </StatusPill>
    </span>
  );
}
