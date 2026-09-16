/**
 * Access ▸ Review: the owner's queue of things worth a look
 * (PERMISSIONS_ARCHITECTURE §4.4.5, POS_SIGNIN_OVERHAUL §3.4).
 * - money acts a till did offline that the server's permission re-check did
 *   not back (accepted, because the money moved, and flagged);
 * - someone's correct PIN typed at a branch they do not work at.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { StatusPill, type StatusTone } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getErrorMessage } from "@/data/api/errors";
import { useListFlags, useReviewFlag } from "@/data/api/generated/api";
import type { ReplayFlag } from "@/data/api/generated/models";
import { queryClient } from "@/data/api/query";
import { fmtStamp } from "@/lib/format";

const REASON_TONE: Record<string, StatusTone> = {
  stale_snapshot: "info",
  unauthorized_offline: "danger",
  pin_wrong_branch: "warning",
};

export function reasonKey(reason: string) {
  return `access.review.reasons.${reason}`;
}

export function ReviewPage() {
  const { t } = useTranslation();
  const [showReviewed, setShowReviewed] = useState(false);
  const flags = useListFlags({ include_reviewed: showReviewed || undefined });
  const review = useReviewFlag({
    mutation: {
      onSuccess: () =>
        void queryClient.invalidateQueries({
          predicate: (q) => typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("/authz/flags"),
        }),
      onError: (e) => toast.error(getErrorMessage(e)),
    },
  });

  const columns = useMemo<ColumnDef<ReplayFlag>[]>(
    () => [
      {
        id: "who",
        header: t("access.review.person", "Person"),
        meta: { phone: "title", label: t("access.review.person", "Person") },
        cell: ({ row }) => <span className="font-medium" data-testid="flag-row">{row.original.author_name ?? "—"}</span>,
      },
      {
        accessorKey: "reason",
        header: t("access.review.what", "What happened"),
        meta: { label: t("access.review.what", "What happened") },
        cell: ({ row }) => (
          <StatusPill size="sm" tone={REASON_TONE[row.original.reason] ?? "neutral"}>
            {t(reasonKey(row.original.reason), row.original.reason)}
          </StatusPill>
        ),
      },
      {
        accessorKey: "capability",
        header: t("access.review.permission", "Permission"),
        meta: { label: t("access.review.permission", "Permission") },
        cell: ({ row }) => <bdi dir="ltr" className="font-mono text-xs text-muted-foreground">{row.original.capability}</bdi>,
      },
      {
        accessorKey: "occurred_at",
        header: t("access.review.when", "When"),
        meta: { numeric: true, label: t("access.review.when", "When") },
        cell: ({ row }) => fmtStamp(row.original.occurred_at),
      },
    ],
    [t],
  );

  return (
    <Page>
      <PageHeader
        title={t("access.review.title", "Review")}
        description={t("access.review.subtitle", "Offline acts the permission check did not back, and PINs tried at the wrong branch.")}
      />
      <DataTable
        columns={columns}
        data={flags.data ?? []}
        loading={flags.isLoading}
        error={flags.error}
        onRetry={() => void flags.refetch()}
        getRowId={(f) => String(f.id)}
        hideViewOptions
        pageSize={20}
        toolbar={
          <Label className="flex h-9 items-center gap-2 rounded-[10px] border bg-card px-3 text-sm font-normal">
            <Switch checked={showReviewed} onCheckedChange={setShowReviewed} />
            {t("access.review.showReviewed", "Show reviewed")}
          </Label>
        }
        rowActions={(f) =>
          f.reviewed_at ? (
            <StatusPill size="sm" tone="success">{t("access.review.reviewed", "Reviewed")}</StatusPill>
          ) : (
            <Button variant="ghost" size="sm" loading={review.isPending && review.variables?.id === f.id} onClick={() => review.mutate({ id: f.id })}>
              {t("access.review.markReviewed", "Mark reviewed")}
            </Button>
          )
        }
        emptyState={
          <EmptyState
            icon={ShieldCheck}
            title={t("access.review.empty", "Nothing to review")}
            description={t("access.review.emptyHint", "Flagged offline acts and wrong-branch PINs appear here.")}
          />
        }
      />
    </Page>
  );
}
