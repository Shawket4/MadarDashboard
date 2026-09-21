/**
 * The tables a customer has booked — `GET /customers/{id}/bookings`, behind
 * `customers.view` like the sheet it sits in. Newest first, read through the
 * merge chain, a page at a time.
 *
 * Read-only. A row opens the booking on the Bookings page (that branch, that
 * day) for someone who may read bookings; for anyone else it is a plain row.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useListBranches, useListCustomerBookings } from "@/data/api/generated/api";
import type { BookingView } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthz } from "@/data/authz/use-authz";
import { BookingStatusBadge } from "@/features/bookings/status-badge";
import { serviceDateOf } from "@/features/bookings/util";
import { Cap } from "@/generated/capabilities";
import { useOrgId } from "@/hooks/use-org-id";
import { fmtDateTime, fmtNumber } from "@/lib/format";

const PAGE = 10;

export function BookingsSection({ customerId }: { customerId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canOpenBooking = useAuthz().can(Cap.bookingsRead);
  const orgId = useOrgId();
  const [limit, setLimit] = useState(PAGE);
  const q = useListCustomerBookings(customerId, { limit, offset: 0 }, { query: { placeholderData: (prev) => prev } });
  const branches = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const branchName = (id: string) => branches.data?.find((b) => b.id === id)?.name ?? "—";
  const rows = q.data ?? [];

  const open = (b: BookingView) =>
    void navigate({
      to: "/bookings",
      search: (prev: Record<string, unknown>) => ({ ...prev, branchId: b.branch_id, date: serviceDateOf(b.starts_at), booking: b.id }),
    });

  return (
    <section className="space-y-3" aria-labelledby="customer-bookings-title">
      <h3 id="customer-bookings-title" className="text-sm font-semibold">
        {t("customers.bookings.title", "Bookings")}
      </h3>
      {q.isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : q.isError ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
          <span className="text-muted-foreground">{getErrorMessage(q.error)}</span>
          <Button variant="outline" size="sm" onClick={() => void q.refetch()}>
            {t("common.retry", "Retry")}
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          {t("customers.bookings.empty", "No bookings. A table booked under this customer's number shows here.")}
        </p>
      ) : (
        <>
          <ul className="divide-y rounded-lg border text-sm">
            {rows.map((b) => (
              <li key={b.id} data-testid="customer-booking" className="flex items-start gap-3 p-3">
                <CalendarClock aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  {canOpenBooking ? (
                    <Button variant="link" size="sm" className="h-auto p-0 font-medium" onClick={() => open(b)}>
                      {fmtDateTime(b.starts_at)}
                    </Button>
                  ) : (
                    <p className="font-medium">{fmtDateTime(b.starts_at)}</p>
                  )}
                  <p className="text-muted-foreground">
                    {t("customers.bookings.party", { defaultValue: "Party of {{n}}", n: fmtNumber(b.party_size) })}
                    {" · "}
                    <span dir="auto">{branchName(b.branch_id)}</span>
                  </p>
                </div>
                <BookingStatusBadge status={b.status} />
              </li>
            ))}
          </ul>
          {rows.length >= limit ? (
            <Button variant="outline" size="sm" loading={q.isFetching} onClick={() => setLimit((n) => n + PAGE)}>
              {t("customers.bookings.more", "Show more")}
            </Button>
          ) : null}
        </>
      )}
    </section>
  );
}
