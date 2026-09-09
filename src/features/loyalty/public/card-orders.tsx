/**
 * What this member has bought here — their own receipts, on their own card.
 *
 * A receipt list, not a report: no totals row, no filters, no chart. The one
 * question it answers is "what did I have last time", and the shape follows the
 * page's existing rhythm — a titled `Section` over a `Panel`, newest first.
 *
 * A card with no visits yet says so plainly. An empty history is the normal
 * first day of a membership, and dressing it as a failure would be the page
 * apologising for something that has not gone wrong. A request that actually
 * FAILS renders nothing at all: a customer opening their card to show it at the
 * counter should not be handed an error about a list they did not ask for.
 */
import { useTranslation } from "react-i18next";
import { Receipt } from "lucide-react";

import { useLoyaltyCardOrders } from "@/data/api/generated/api";
import type { PastOrder } from "@/data/api/generated/models/pastOrder";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDateTime, fmtMoney } from "@/lib/format";

import { Panel, Section } from "./page-shell";

/**
 * Newest first, decided here rather than trusted from the wire.
 *
 * A list whose order silently depends on the server is a list that reorders
 * itself the day a query loses its `ORDER BY`, and "my last visit" moving to
 * the bottom of the page is not a subtle bug to a customer.
 */
export const newestFirst = (orders: PastOrder[]): PastOrder[] =>
  [...orders].sort((a, b) => Date.parse(b.placed_at) - Date.parse(a.placed_at));

export function CardOrders({ token, accent }: { token: string; accent?: string }) {
  const { t } = useTranslation();
  const q = useLoyaltyCardOrders(token, { query: { retry: false } });

  if (q.isError) return null;

  return (
    <Section title={t("loyalty.yourVisits", "What you've had")} accent={accent}>
      {q.isLoading ? (
        <Panel className="flex flex-col gap-3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </Panel>
      ) : (q.data?.orders.length ?? 0) === 0 ? (
        <Panel className="flex items-center gap-3">
          <Receipt className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            {t("loyalty.noVisitsYet", "Nothing here yet — your visits will show up after your first order.")}
          </p>
        </Panel>
      ) : (
        <Panel className="p-0">
          <ul className="divide-y divide-border/70">
            {newestFirst(q.data?.orders ?? []).map((o) => (
              <PastVisit key={o.id} order={o} />
            ))}
          </ul>
        </Panel>
      )}
    </Section>
  );
}

function PastVisit({ order }: { order: PastOrder }) {
  return (
    <li className="flex flex-col gap-1 px-4 py-3">
      <div className="flex items-baseline gap-3">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{order.branch_name}</span>
        <span className="shrink-0 text-sm tabular-nums">{fmtMoney(order.total)}</span>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <time dateTime={order.placed_at} className="shrink-0">
          {fmtDateTime(order.placed_at)}
        </time>
        {/* Gap rather than margins or punctuation glued to a word: these strings
            are the shop's own item names, so a line can be Arabic, Latin, or
            both, and the separators must not travel with the reordered text. */}
        <ul className="flex min-w-0 flex-wrap items-baseline gap-x-2">
          {order.items.map((item, i) => (
            <li key={`${item}-${i}`} className="flex items-baseline gap-2">
              {i > 0 ? (
                <span aria-hidden className="text-muted-foreground/50">
                  ·
                </span>
              ) : null}
              {item}
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
