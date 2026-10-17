import type { QueryClient } from "@tanstack/react-query";

import {
  getBookingAvailabilityQueryOptions,
  getGetBookingSettingsQueryOptions,
  getListBookingsQueryOptions,
  getListFloorTablesQueryOptions,
  getListSectionsQueryOptions,
} from "@/data/api/generated/api";
import type { BookingAvailabilityParams, ListBookingsParams } from "@/data/api/generated/models";
import type { BookingView } from "@/data/api/generated/models/bookingView";
import type { ListValues } from "@/data/scope/list-search";
import type { PrefetchCtx } from "@/lib/route-prefetch";
import { bookingsSearch } from "./search";
import { serviceToday } from "./util";

type BookingsValues = ListValues<typeof bookingsSearch.spec>;

/** The day's list request, built in ONE place for the page and the sidebar prefetch. No `date` = today. */
export function bookingsListParams(branchId: string, f: Pick<BookingsValues, "date">): ListBookingsParams & { date: string } {
  return { branch_id: branchId, date: f.date || serviceToday() };
}

/** The booking dialog's availability request: the dialog reads it, a row hover warms it. */
export function availabilityParams(
  branchId: string,
  a: { day: string; party: number | ""; sectionId: string | null; bookingId?: string | null },
): BookingAvailabilityParams {
  return {
    branch_id: branchId,
    date: a.day,
    party_size: Math.max(1, a.party || 1),
    section_id: a.sectionId ?? undefined,
    exclude_booking_id: a.bookingId ?? undefined,
  };
}

/** Row hover: what the edit dialog fires when it opens on `b` (it seeds from the booking). */
export function prefetchBookingDialog(qc: QueryClient, branchId: string, b: BookingView): void {
  void qc.prefetchQuery(getListSectionsQueryOptions({ branch_id: branchId }));
  void qc.prefetchQuery(
    getBookingAvailabilityQueryOptions(
      availabilityParams(branchId, {
        day: serviceToday(new Date(b.starts_at)),
        party: b.party_size,
        sectionId: b.section_id ?? null,
        bookingId: b.id,
      }),
    ),
  );
}

/** Sidebar/palette intent: warm the page's mount queries for the day it will open on. */
export function prefetchBookings(qc: QueryClient, { branchId }: PrefetchCtx): void {
  if (!branchId) return;
  void qc.prefetchQuery(getGetBookingSettingsQueryOptions({ branch_id: branchId }));
  void qc.prefetchQuery(getListFloorTablesQueryOptions({ branch_id: branchId }));
  void qc.prefetchQuery(getListBookingsQueryOptions(bookingsListParams(branchId, bookingsSearch.entryValues(branchId))));
}
