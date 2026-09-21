// What a table has done, and what it earns.
//
// The link was always in the data — a settled bill carries its open ticket,
// and the ticket carries its table — and nothing read it, so a floor plan
// could show a manager a room full of tables and not answer the only question
// worth asking about them: which of these actually earns.
//
// Money and covers count SETTLED bills only. An open bill has not finished
// and a voided one took nothing; folding either into an average would flatter
// a table that lost money. Both still appear in the list, because the history
// is what HAPPENED and the figures are what it was worth — and a table that
// keeps getting voided is exactly the thing a manager should see.
import { useTranslation } from "react-i18next";

import { useTableHistory } from "@/data/api/generated/api";
import type { TableSitting } from "@/data/api/generated/models";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtElapsedMs, fmtMoney, fmtNumber } from "@/lib/format";
import { StatusPill } from "@/components/app/status-pill";
import { CustomerLink, type CustomerLinkControl } from "@/features/customers/customer-link";

/** A stay, not a timestamp — the shared elapsed shape (`42m` · `1h 05m`). */
const stay = (minutes: number): string => (minutes < 1 ? "—" : fmtElapsedMs(minutes * 60_000));

/** "1h 02m" — kept for callers that need the plain ASCII form. */
export function formatStay(minutes: number): string {
  if (minutes < 1) return "—";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${String(m).padStart(2, "0")}m`;
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums"><bdi>{value}</bdi></p>
    </div>
  );
}

function SittingRow({ s, customers }: { s: TableSitting; customers?: CustomerLinkControl }) {
  const { t } = useTranslation();
  const name = s.customer_name?.trim();
  const who = name || s.ticket_ref || "—";
  const covers = s.guest_count ?? 0;
  return (
    <li className="flex items-baseline justify-between gap-3 border-b py-2 last:border-0">
      <div className="min-w-0">
        {/* The name opens the customer the sitting belongs to, for those who may see customers. */}
        {name && customers ? (
          <CustomerLink name={name} customerId={s.customer_id} control={customers} className="block truncate text-sm" />
        ) : (
          <p className="truncate text-sm">{who}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {[
            stay(s.minutes),
            covers > 0
              ? t("floor.history.covers", { count: covers, defaultValue: "{{count}} covers" })
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      {/* A bill that took no money says WHY, rather than showing a zero that
          reads as a table earning nothing. */}
      {s.total_amount == null ? (
        <StatusPill tone={s.status === "open" ? "accent" : "danger"} size="sm">
          {s.status === "open"
            ? t("floor.history.stillOpen", "Still open")
            : t("floor.history.voided", "Voided")}
        </StatusPill>
      ) : (
        <span className="shrink-0 font-mono text-sm tabular-nums">
          {fmtMoney(s.total_amount)}
        </span>
      )}
    </li>
  );
}

/** A table's figures, then what happened — the last 30 days unless a window
 *  is given (the Tables insights page passes the scope's). */
export function TableHistory({
  tableId,
  from,
  to,
  customers,
}: {
  tableId: string;
  from?: string;
  to?: string;
  /** The surface's customer sheet; without one a name stays plain text. */
  customers?: CustomerLinkControl;
}) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useTableHistory(
    tableId,
    from || to ? { from, to } : undefined,
  );

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <p className="p-4 text-xs text-muted-foreground">
        {t("floor.history.failed", "Couldn't load this table's history.")}
      </p>
    );
  }
  if (data.sittings.length === 0) {
    return (
      <p className="p-4 text-xs text-muted-foreground">
        {from || to
          ? t("floor.history.emptyPeriod", "Nothing sat here in this period.")
          : t("floor.history.empty", "Nothing has sat here in the last 30 days.")}
      </p>
    );
  }

  // Turns ride the wire ×100 so the payload stays integer; one decimal is as
  // far as a turn rate is ever read.
  const turns = fmtNumber(data.turns_per_day_x100 / 100, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-2">
        <Figure
          label={t("floor.history.takings", "Takings")}
          value={fmtMoney(data.total_minor)}
        />
        <Figure
          label={t("floor.history.avgBill", "Average bill")}
          value={fmtMoney(data.average_bill_minor)}
        />
        <Figure
          label={t("floor.history.avgStay", "Average stay")}
          value={stay(data.average_minutes)}
        />
        <Figure label={t("floor.history.turns", "Turns a day")} value={turns} />
      </div>
      <div>
        <p className="mb-1 text-sm font-semibold">
          {t("floor.history.bills", "Bills")}
        </p>
        <ul>
          {data.sittings.map((s) => (
            <SittingRow key={s.open_ticket_id} s={s} customers={customers} />
          ))}
        </ul>
      </div>
    </div>
  );
}
