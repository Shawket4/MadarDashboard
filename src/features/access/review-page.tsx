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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getErrorMessage } from "@/data/api/errors";
import { useBulkReviewFlags, useListFlags, useReviewFlag } from "@/data/api/generated/api";
import { useCan } from "@/data/authz/use-authz";
import type { ReplayFlag } from "@/data/api/generated/models";
import { queryClient } from "@/data/api/query";
import { Cap } from "@/generated/capabilities";
import { fmtStamp } from "@/lib/format";

import { capLabel, metaOf } from "./catalog";
import { readFlagCapability } from "./flag-detail";

const REASON_TONE: Record<string, StatusTone> = {
  stale_snapshot: "info",
  unauthorized_offline: "danger",
  pin_wrong_branch: "warning",
};

export function reasonKey(reason: string) {
  return `access.review.reasons.${reason}`;
}

export function ReviewPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const canReview = useCan(Cap.approvalsReview);
  const [showReviewed, setShowReviewed] = useState(false);
  const [picked, setPicked] = useState<ReadonlySet<number>>(() => new Set());
  const [note, setNote] = useState("");
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

  const rows = useMemo(() => flags.data ?? [], [flags.data]);
  /** Only open flags can be resolved; reviewed ones are already done. */
  const openRows = useMemo(() => rows.filter((f) => !f.reviewed_at), [rows]);
  const chosen = useMemo(() => openRows.filter((f) => picked.has(f.id)), [openRows, picked]);
  const allVisiblePicked = openRows.length > 0 && chosen.length === openRows.length;

  const invalidate = () =>
    void queryClient.invalidateQueries({
      predicate: (q) => typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("/authz/flags"),
    });

  const toggle = (id: number) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const bulk = useBulkReviewFlags({
    mutation: {
      onSuccess: (res) => {
        // Honest result: what went through, and every id that did not, with
        // the server's reason. Nothing is silently dropped.
        const failed = res.pending ?? [];
        if (failed.length) {
          toast.warning(
            t("access.review.bulkPartial", "Resolved {{ok}}, {{failed}} could not be resolved", {
              ok: res.resolved?.length ?? 0,
              failed: failed.length,
            }),
            { description: failed.map((p) => `#${p.id}: ${p.reason}`).join("\n") },
          );
        } else {
          toast.success(t("access.review.bulkDone", "Resolved {{ok}}", { ok: res.resolved?.length ?? 0 }));
        }
        setPicked(new Set());
        setNote("");
        invalidate();
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    },
  });

  const columns = useMemo<ColumnDef<ReplayFlag>[]>(
    () => [
      ...(canReview
        ? [
            {
              id: "pick",
              header: () => (
                <Checkbox
                  aria-label={t("access.review.selectAll", "Select all shown")}
                  data-testid="flag-select-all"
                  disabled={openRows.length === 0}
                  checked={allVisiblePicked}
                  onCheckedChange={(v) => setPicked(v ? new Set(openRows.map((f) => f.id)) : new Set())}
                />
              ),
              meta: { phone: "hidden" as const, className: "w-px" },
              cell: ({ row }: { row: { original: ReplayFlag } }) =>
                row.original.reviewed_at ? null : (
                  <Checkbox
                    aria-label={t("access.review.selectOne", "Select this action")}
                    data-testid={`flag-pick-${row.original.id}`}
                    checked={picked.has(row.original.id)}
                    onCheckedChange={() => toggle(row.original.id)}
                  />
                ),
            } as ColumnDef<ReplayFlag>,
          ]
        : []),
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
        cell: ({ row }) => {
          // A `capability:detail` flag says what happened in the detail; the
          // fixed reason beside it ("without the permission") would mislead.
          const { known } = readFlagCapability(row.original.capability);
          if (known) {
            return (
              <StatusPill size="sm" tone={known.tone} className="h-auto whitespace-normal py-0.5 text-start">
                {t(known.key)}
              </StatusPill>
            );
          }
          return (
            <StatusPill size="sm" tone={REASON_TONE[row.original.reason] ?? "neutral"}>
              {t(reasonKey(row.original.reason), row.original.reason)}
            </StatusPill>
          );
        },
      },
      {
        accessorKey: "capability",
        header: t("access.review.permission", "Permission"),
        meta: { label: t("access.review.permission", "Permission") },
        cell: ({ row }) => {
          const { capability, known } = readFlagCapability(row.original.capability);
          const meta = known ? metaOf(capability) : undefined;
          // Named the way the Roles screen names it; the key stays one hover away.
          if (meta) return <span title={row.original.capability}>{capLabel(meta, lang)}</span>;
          return <bdi dir="ltr" className="font-mono text-xs text-muted-foreground">{row.original.capability}</bdi>;
        },
      },
      {
        accessorKey: "occurred_at",
        header: t("access.review.when", "When"),
        meta: { numeric: true, label: t("access.review.when", "When") },
        cell: ({ row }) => fmtStamp(row.original.occurred_at),
      },
    ],
    [t, lang, canReview, picked, openRows, allVisiblePicked],
  );

  return (
    <Page>
      <PageHeader
        title={t("access.review.title", "Review")}
        description={t("access.review.subtitle", "Offline acts the permission check did not back, and PINs tried at the wrong branch.")}
      />
      <DataTable
        columns={columns}
        data={rows}
        loading={flags.isLoading}
        error={flags.error}
        onRetry={() => void flags.refetch()}
        getRowId={(f) => String(f.id)}
        hideViewOptions
        pageSize={20}
        toolbar={
          <>
            <Label className="flex h-9 items-center gap-2 rounded-[10px] border bg-card px-3 text-sm font-normal">
              <Switch checked={showReviewed} onCheckedChange={setShowReviewed} />
              {t("access.review.showReviewed", "Show reviewed")}
            </Label>
            {canReview && chosen.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2" data-testid="flag-bulk-bar">
                <span className="text-sm text-muted-foreground">
                  {t("access.review.selectedCount", "{{count}} selected", { count: chosen.length })}
                </span>
                <Input
                  className="h-9 w-56"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  data-testid="flag-bulk-note"
                  placeholder={t("access.review.notePlaceholder", "Note (optional)")}
                  aria-label={t("access.review.notePlaceholder", "Note (optional)")}
                />
                <Button
                  size="sm"
                  data-testid="flag-bulk-resolve"
                  loading={bulk.isPending}
                  onClick={() =>
                    bulk.mutate({
                      data: { flag_ids: chosen.map((f) => f.id), note: note.trim() || undefined },
                    })
                  }
                >
                  {t("access.review.bulkResolve", "Mark {{count}} reviewed", { count: chosen.length })}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setPicked(new Set())}>
                  {t("access.review.clearSelection", "Clear")}
                </Button>
              </div>
            ) : null}
          </>
        }
        rowActions={(f) =>
          f.reviewed_at || !canReview ? (
            f.reviewed_at ? (
              <StatusPill size="sm" tone="success">{t("access.review.reviewed", "Reviewed")}</StatusPill>
            ) : null
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
