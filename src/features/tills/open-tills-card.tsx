import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Wallet } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDuration } from "@/lib/format";

import { useOpenTills, type Till } from "./api";
import { FlagBadge, VerificationBadge } from "./till-badges";

/** Dashboard home: who is selling right now at the selected branch (live via the tills topic). */
export function OpenTillsCard({ branchId }: { branchId: string | null | undefined }) {
  const q = useOpenTills(branchId);
  if (!branchId) return null;
  return q.isLoading ? <Skeleton className="h-24 w-full" /> : <OpenTillsList tills={q.data ?? []} />;
}

export function OpenTillsList({ tills }: { tills: Till[] }) {
  const { t } = useTranslation();
  return (
    <Card className="rounded-2xl py-0 shadow-none">
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Wallet className="size-4 text-muted-foreground" aria-hidden="true" />
            {t("dashboard.openTills", "Open tills")}
            <span className="tabular text-muted-foreground">{tills.length}</span>
          </p>
          <Link to="/tills" className="text-xs text-primary hover:underline">
            {t("common.viewAll", "View all")}
          </Link>
        </div>
        {tills.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("dashboard.noOpenTill", "No open till")}</p>
        ) : (
          <ul className="divide-y">
            {tills.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm" data-testid="open-till">
                <span>
                  <span className="font-medium">{s.teller_name}</span>
                  {s.device_code ? <span className="ms-1 font-mono text-muted-foreground">{s.device_code}</span> : null}
                </span>
                <span className="flex flex-wrap items-center gap-1">
                  <VerificationBadge verification={s.verification} />
                  <FlagBadge till={s} />
                  <span className="tabular text-xs text-muted-foreground">{fmtDuration(s.opened_at)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
