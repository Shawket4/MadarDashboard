/**
 * The staff drinks of the selected period, one row each, newest first.
 *
 * The note column is the reason this table exists. The pool belongs to the
 * branch's day and not to a person, so there is no "who is this for" field
 * anywhere in the feature — by design. The note IS the answer, in the teller's
 * own words, and a table that truncated it to an ellipsis would report nothing
 * at all. It gets the room and it wraps.
 *
 * `overspent_on_replay` is a quieter fact riding along on the badge rather than
 * taking a column of its own: it means the SERVER's recount made the drink an
 * overspend when the till had not thought so — two devices disagreeing about
 * the day's count, usually an offline tablet catching up. Worth seeing when you
 * are looking at an overspend; not worth a column you would scan past all day.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/app/data-table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/empty-state";
import type { StaffDrink } from "@/data/api/generated/models";
import { fmtDate, fmtMoney, fmtTime } from "@/lib/format";

export function StaffDrinksTable({
  drinks,
  loading,
  error,
  onRetry,
  /** More than one business day is on screen, so each row says which. */
  showDate,
}: {
  drinks: StaffDrink[];
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  showDate?: boolean;
}) {
  const { t } = useTranslation();

  const columns = useMemo<ColumnDef<StaffDrink>[]>(
    () => [
      {
        accessorKey: "recorded_at",
        header: t("staffPool.colTime", "Time"),
        cell: ({ row }) => {
          const d = row.original;
          const time = fmtTime(d.recorded_at);
          // The business day, not the clock date: a drink poured at 1am belongs
          // to the day the branch is still working through.
          return showDate ? `${fmtDate(d.business_date)} · ${time}` : time;
        },
        meta: { label: t("staffPool.colTime", "Time"), numeric: true, align: "start" },
      },
      {
        accessorKey: "item_name",
        header: t("staffPool.colItem", "Item"),
        cell: ({ row }) => {
          const d = row.original;
          // The size is part of the item's identity here: a large and a single
          // are different costs out of the same pool.
          const label = d.size_label ? `${d.item_name} · ${d.size_label}` : d.item_name;
          return d.quantity > 1 ? `${label} × ${d.quantity}` : label;
        },
        meta: { label: t("staffPool.colItem", "Item"), phone: "title" },
      },
      {
        accessorKey: "note",
        header: t("staffPool.colNote", "Note"),
        cell: ({ row }) => (
          <span className="whitespace-pre-wrap break-words">{row.original.note}</span>
        ),
        meta: { label: t("staffPool.colNote", "Note"), className: "min-w-56" },
      },
      {
        accessorKey: "cost_minor",
        header: t("staffPool.colCost", "Cost"),
        cell: ({ row }) =>
          row.original.cost_minor == null ? "—" : fmtMoney(row.original.cost_minor),
        meta: { label: t("staffPool.colCost", "Cost"), numeric: true },
      },
      {
        id: "overspent",
        header: t("staffPool.colOver", "Over allowance"),
        cell: ({ row }) => {
          const d = row.original;
          if (!d.overspent) return null;
          const replay = d.overspent_on_replay;
          return (
            <Badge
              variant="destructive"
              title={
                replay
                  ? t(
                      "staffPool.overOnReplayHint",
                      "The till didn't count this as over at the time — the server did, once it had the whole day.",
                    )
                  : undefined
              }
            >
              {t("staffPool.overBadge", "Over allowance")}
              {replay ? (
                <span className="font-normal opacity-70">
                  {t("staffPool.overOnReplay", "· on recount")}
                </span>
              ) : null}
            </Badge>
          );
        },
        meta: { label: t("staffPool.colOver", "Over allowance"), align: "end" },
      },
    ],
    [t, showDate],
  );

  return (
    <DataTable
      columns={columns}
      data={drinks}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(d) => d.id}
      emptyState={<EmptyState title={t("staffPool.drinksEmpty", "No staff drinks in this period")} />}
    />
  );
}
