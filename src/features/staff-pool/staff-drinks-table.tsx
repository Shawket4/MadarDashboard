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
 *
 * The money columns read the SERVER's verdict: what the pool gave free
 * (`comp_minor`) and what the line was still charged (`extras_minor`). Two
 * things about them must survive any redesign:
 *
 * - a drink rung by a till from before staff drinks were priced has NO figures.
 *   That is "unknown", so it is a dash and a footnote — a 0 would claim the
 *   branch gave nothing away, which is the one thing it certainly did not do;
 * - when an offline till claimed a different comp than the server priced, the
 *   row says both figures in a sentence, under the note where there is room
 *   for one, and the figure itself carries the marker.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/app/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/empty-state";
import { StatusPill } from "@/components/app/status-pill";
import type { StaffDrink } from "@/data/api/generated/models";
import { fmtDate, fmtMoney, fmtTime } from "@/lib/format";

import { staffDrinkMoney } from "./util";

export function StaffDrinksTable({
  drinks,
  loading,
  error,
  onRetry,
  /** More than one business day is on screen, so each row says which. */
  showDate,
  onOpenOrder,
}: {
  drinks: StaffDrink[];
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  showDate?: boolean;
  /** Opens the sale a drink was rung on. Omit it and no row offers the link. */
  onOpenOrder?: (orderId: string) => void;
}) {
  const { t } = useTranslation();
  const unpricedHint = t(
    "staffPool.unpricedHint",
    "Rung before staff drinks were priced",
  );
  const anyUnpriced = drinks.some((d) => !staffDrinkMoney(d).priced);

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
        meta: {
          label: t("staffPool.colTime", "Time"),
          numeric: true,
          align: "start",
        },
      },
      {
        accessorKey: "item_name",
        header: t("staffPool.colItem", "Item"),
        cell: ({ row }) => {
          const d = row.original;
          // The size is part of the item's identity here: a large and a single
          // are different costs out of the same pool.
          const label = d.size_label
            ? `${d.item_name} · ${d.size_label}`
            : d.item_name;
          return d.quantity > 1 ? `${label} × ${d.quantity}` : label;
        },
        meta: { label: t("staffPool.colItem", "Item"), phone: "title" },
      },
      {
        accessorKey: "note",
        header: t("staffPool.colNote", "Note"),
        cell: ({ row }) => {
          const money = staffDrinkMoney(row.original);
          return (
            <div className="space-y-1">
              <span
                dir="auto"
                className="block whitespace-pre-wrap break-words"
              >
                {row.original.note}
              </span>
              {money.priced && money.tillSaid != null ? (
                <p
                  data-testid="comp-mismatch"
                  className="text-xs text-[color-mix(in_oklab,var(--color-warning)_50%,var(--color-foreground))]"
                >
                  {t("staffPool.compMismatch", {
                    defaultValue:
                      "The till reported {{reported}}; the server priced it at {{server}}.",
                    reported: fmtMoney(money.tillSaid),
                    server: fmtMoney(money.comp),
                  })}
                </p>
              ) : null}
            </div>
          );
        },
        meta: { label: t("staffPool.colNote", "Note"), className: "min-w-56" },
      },
      {
        accessorKey: "comp_minor",
        header: t("staffPool.colComp", "Given free"),
        cell: ({ row }) => {
          const money = staffDrinkMoney(row.original);
          if (!money.priced) return <Unpriced hint={unpricedHint} />;
          return (
            <span className="inline-flex flex-col items-end gap-1">
              {fmtMoney(money.comp)}
              {money.tillSaid != null ? (
                <StatusPill tone="warning" size="sm" className="font-sans">
                  {t("staffPool.compMismatchBadge", "Till differs")}
                </StatusPill>
              ) : null}
            </span>
          );
        },
        meta: { label: t("staffPool.colComp", "Given free"), numeric: true },
      },
      {
        accessorKey: "extras_minor",
        header: t("staffPool.colExtras", "Extras charged"),
        cell: ({ row }) => {
          const money = staffDrinkMoney(row.original);
          if (!money.priced) return <Unpriced hint={unpricedHint} />;
          return fmtMoney(money.extras);
        },
        meta: {
          label: t("staffPool.colExtras", "Extras charged"),
          numeric: true,
        },
      },
      {
        accessorKey: "cost_minor",
        header: t("staffPool.colCost", "Cost"),
        cell: ({ row }) =>
          row.original.cost_minor == null
            ? "—"
            : fmtMoney(row.original.cost_minor),
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
      ...(onOpenOrder
        ? [
            {
              id: "order",
              header: t("staffPool.colOrder", "Order"),
              cell: ({ row }) => {
                const orderId = row.original.order_id;
                // A record-only drink has no sale behind it: nothing to open,
                // and a dead link would be worse than none.
                if (!orderId) return null;
                return (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => onOpenOrder(orderId)}
                  >
                    {t("staffPool.viewOrder", "View order")}
                  </Button>
                );
              },
              meta: { label: t("staffPool.colOrder", "Order"), align: "end" },
            } satisfies ColumnDef<StaffDrink>,
          ]
        : []),
    ],
    [t, showDate, onOpenOrder, unpricedHint],
  );

  return (
    <div className="space-y-2">
      <DataTable
        columns={columns}
        data={drinks}
        loading={loading}
        error={error}
        onRetry={onRetry}
        getRowId={(d) => d.id}
        emptyState={
          <EmptyState
            title={t("staffPool.drinksEmpty", "No staff drinks in this period")}
          />
        }
      />
      {anyUnpriced ? (
        // The dash needs its reason on the page, not only in a tooltip: a touch
        // screen has no hover, and "—" beside money invites the reading "free".
        <p className="text-xs text-muted-foreground">
          {t(
            "staffPool.unpricedNote",
            "— means the drink was rung before staff drinks were priced, so there is no figure for it. It still counted against the allowance.",
          )}
        </p>
      ) : null}
    </div>
  );
}

function Unpriced({ hint }: { hint: string }) {
  return (
    <span title={hint} data-testid="comp-unpriced">
      <span aria-hidden>—</span>
      <span className="sr-only">{hint}</span>
    </span>
  );
}
