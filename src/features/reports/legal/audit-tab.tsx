import { useTranslation } from "react-i18next";
import { Coins, ListChecks, UserRound } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuditReport } from "@/data/api/generated/models";
import { fmtMoney, fmtNumber } from "@/lib/format";

interface AuditTabProps {
  query: { data?: AuditReport; isLoading: boolean; isError: boolean; refetch: () => void };
  /** The 2nd breakdown card's title (`by_reason`) — "Reason", "Void reason",
   * "Discount", "Branch"… whatever the report's second axis actually is. */
  reasonLabel: string;
}

/** Every legal/compliance audit report shares this shape (a total plus a
 * reason and an issuer breakdown), so one component renders all five. */
export function AuditTab({ query, reasonLabel }: AuditTabProps) {
  const { t } = useTranslation();
  const d = query.data;

  const kpis: LedgerItem[] = [
    { key: "count", label: t("reports.legal.eventCount", "Events"), icon: ListChecks, accent: "primary", value: d?.total_count ?? 0, formatType: "number", loading: query.isLoading },
    { key: "amount", label: t("reports.legal.eventAmount", "Total amount"), icon: Coins, accent: "warning", value: d?.total_amount_minor ?? 0, formatType: "money", loading: query.isLoading },
  ];

  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-4">
      <LedgerStrip items={kpis} />

      {query.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : !d || d.total_count === 0 ? (
        <EmptyState title={t("reports.legal.empty", "Nothing recorded in this period")} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <BreakdownCard icon={ListChecks} title={reasonLabel} rows={d.by_reason} />
          <BreakdownCard icon={UserRound} title={t("reports.legal.byIssuer", "By staff member")} rows={d.by_issuer} />
        </div>
      )}
    </div>
  );
}

function BreakdownCard({
  icon: Icon,
  title,
  rows,
}: {
  icon: typeof ListChecks;
  title: string;
  rows: { label: string; count: number; amount_minor: number }[];
}) {
  const { t } = useTranslation();
  return (
    <Card className="py-0">
      <CardHeader className="pt-4">
        <CardTitle className="flex items-center gap-1.5 text-base">
          <Icon aria-hidden className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("reports.legal.empty", "Nothing recorded in this period")}</p>
        ) : (
          <ul className="divide-y text-sm">
            {rows.map((r, i) => (
              // Labels can repeat (two staff with the same name are separate rows).
              <li key={`${i}:${r.label}`} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{t("reports.legal.eventsCount", { defaultValue: "{{n}} events", n: fmtNumber(r.count) })}</p>
                </div>
                <span className="shrink-0 font-mono tabular-nums">{fmtMoney(r.amount_minor)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
