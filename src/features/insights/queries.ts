import type { QueryClient } from "@tanstack/react-query";

import {
  getListDecisionsQueryOptions,
  getListFloorTablesQueryOptions,
  getListUsersQueryOptions,
  getMenuMarginLedgerQueryOptions,
  getRepricingQueryOptions,
  runMetricsQuery,
} from "@/data/api/generated/api";
import { ALL_BRANCHES_ID } from "@/data/scope/use-scope";
import { SPECS, byTableSpec } from "./tables-util";

interface Scope {
  branchId: string | null;
  from: string | null;
  to: string | null;
}

/**
 * Insights requests, built in ONE place: the pages read them and the Reports
 * sidebar prefetch warms them, so both ask for the same cache key.
 */

/** Reports ▸ Operations ▸ Tables: the metrics layer's `tables` dataset for the scope. */
export function tablesMetricsQueryOptions({ branchId, from, to }: Scope, language: string | undefined) {
  const locale = language?.startsWith("ar") ? "ar" : "en";
  return {
    queryKey: ["metrics", "tables", branchId, from, to, locale] as const,
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      runMetricsQuery(
        {
          locale,
          period: from || to ? { from, to } : { preset: "last_30_days" },
          widgets: [
            { key: "summary", spec: SPECS.summary },
            { key: "byTable", spec: byTableSpec(!!branchId) },
            { key: "byHour", spec: SPECS.byHour },
          ],
        },
        undefined,
        signal,
      ),
  };
}

/** Warm the Tables report: its metrics, and the floor that maps a row to its history. */
export function prefetchTablesInsights(qc: QueryClient, scope: Scope, language: string | undefined): void {
  void qc.prefetchQuery(tablesMetricsQueryOptions(scope, language));
  if (scope.branchId) void qc.prefetchQuery(getListFloorTablesQueryOptions({ branch_id: scope.branchId }));
}

export const ledgerParams = ({ from, to }: Scope, basis: "snapshot" | "current") => ({
  from: from ?? undefined,
  to: to ?? undefined,
  ...(basis === "current" ? { cost_basis: "current" } : {}),
});

export const decisionsParams = (orgId: string, branchId: string | null) => ({ org_id: orgId, ...(branchId ? { branch_id: branchId } : {}) });

/** Warm Menu profitability: the margin ledger, plus the sub-tab it opens on. */
export function prefetchProfitability(
  qc: QueryClient,
  orgId: string | null,
  scope: Scope,
  f: { basis: "snapshot" | "current"; ptab: "ledger" | "repricing" | "decisions" },
): void {
  if (!orgId) return;
  const scopeBranchId = scope.branchId ?? ALL_BRANCHES_ID;
  void qc.prefetchQuery(getMenuMarginLedgerQueryOptions(scopeBranchId, ledgerParams(scope, f.basis)));
  if (f.ptab === "repricing") void qc.prefetchQuery(getRepricingQueryOptions(scopeBranchId));
  if (f.ptab === "decisions") {
    void qc.prefetchQuery(getListDecisionsQueryOptions(decisionsParams(orgId, scope.branchId)));
    void qc.prefetchQuery(getListUsersQueryOptions({ org_id: orgId }));
  }
}
