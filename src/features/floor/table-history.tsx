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
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

/** "1h 02m" — a stay, not a timestamp. */
export function formatStay(minutes: number): string {
  if (minutes < 1) return "—";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${String(m).padStart(2, "0")}m`;
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg tabular-nums">{value}</p>
    </div>
  );
}

function SittingRow({ s }: { s: TableSitting }) {
  const { t } = useTranslation();
  const who = s.customer_name?.trim() || s.ticket_ref || "—";
  const covers = s.guest_count ?? 0;
  return (
    <li className="flex items-baseline justify-between gap-3 border-b py-2 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm">{who}</p>
        <p className="text-xs text-muted-foreground">
          {[
            formatStay(s.minutes),
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
        <span
          className={cn(
            "shrink-0 rounded px-1.5 py-0.5 text-[11px]",
            s.status === "open"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {s.status === "open"
            ? t("floor.history.stillOpen", "Still open")
            : t("floor.history.voided", "Voided")}
        </span>
      ) : (
        <span className="shrink-0 font-mono text-sm tabular-nums">
          {fmtMoney(s.total_amount)}
        </span>
      )}
    </li>
  );
}

/** A table's last 30 days: the figures, then what happened. */
export function TableHistory({ tableId }: { tableId: string }) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useTableHistory(tableId);

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
        {t("floor.history.empty", "Nothing has sat here in the last 30 days.")}
      </p>
    );
  }

  // Turns ride the wire ×100 so the payload stays integer; one decimal is as
  // far as a turn rate is ever read.
  const turns = (data.turns_per_day_x100 / 100).toFixed(1);

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
          value={formatStay(data.average_minutes)}
        />
        <Figure label={t("floor.history.turns", "Turns a day")} value={turns} />
      </div>
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("floor.history.bills", "Bills")}
        </p>
        <ul>
          {data.sittings.map((s) => (
            <SittingRow key={s.open_ticket_id} s={s} />
          ))}
        </ul>
      </div>
    </div>
  );
}
