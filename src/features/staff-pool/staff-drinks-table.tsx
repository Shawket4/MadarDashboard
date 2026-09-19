/**
 * The day's staff drinks, one row each.
 *
 * ── TODO: bind to the API ────────────────────────────────────────────────────
 * The backend has no list endpoint for staff drinks yet. `GET /staff-pool/today`
 * returns the day's TOTALS (allowance / used / remaining / over) and nothing
 * per-drink, so this table is rendered with an empty list and an explicit
 * "not available yet" empty state rather than a fake one.
 *
 * When `GET /staff-pool/drinks` lands, the only change here is the data:
 * regenerate the client, call the hook in `staff-pool-report-page`, and pass
 * `drinks` / `loading` / `error` down. The columns below are already written
 * against the generated `StaffDrink` model — time, item, note, cost and the
 * overspent flag — so nothing about this component moves.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The note column is deliberately wide and never truncated to nothing: the note
 * is the entire accountability of this feature. There is no "who is this for"
 * field anywhere in the pool, by design — the note IS the answer, in the
 * teller's own words, and a report that hides it reports nothing.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/app/data-table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/empty-state";
import type { StaffDrink } from "@/data/api/generated/models";
import { fmtMoney, fmtTime } from "@/lib/format";

export function StaffDrinksTable({
  drinks,
  loading,
  error,
  onRetry,
  /** True while there is no list endpoint to bind to. */
  unavailable,
}: {
  drinks: StaffDrink[];
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  unavailable?: boolean;
}) {
  const { t } = useTranslation();

  const columns = useMemo<ColumnDef<StaffDrink>[]>(
    () => [
      {
        accessorKey: "recorded_at",
        header: t("staffPool.colTime", "Time"),
        cell: ({ row }) => fmtTime(row.original.recorded_at),
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
        cell: ({ row }) =>
          row.original.overspent ? (
            <Badge variant="destructive">{t("staffPool.overBadge", "Over allowance")}</Badge>
          ) : null,
        meta: { label: t("staffPool.colOver", "Over allowance"), align: "end" },
      },
    ],
    [t],
  );

  return (
    <DataTable
      columns={columns}
      data={drinks}
      loading={loading}
      error={error}
      onRetry={onRetry}
      getRowId={(d) => d.id}
      emptyState={
        <EmptyState
          title={
            unavailable
              ? t("staffPool.drinksUnavailable", "The drink-by-drink list isn't available yet")
              : t("staffPool.drinksEmpty", "No staff drinks on this day")
          }
          description={
            unavailable
              ? t(
                  "staffPool.drinksUnavailableBody",
                  "The totals above are live. Each drink and its note will be listed here once the server can report them.",
                )
              : undefined
          }
        />
      }
    />
  );
}
