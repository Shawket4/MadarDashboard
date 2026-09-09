/**
 * The Google Wallet object for one member, verbatim. **Super admin only.**
 *
 * This exists because the nearby-notification question kept being answered by
 * reasoning about what we send rather than by looking at what Google holds.
 * Both stories — "the locations never arrived" and "Google has them and does
 * nothing with them" — produce exactly the same symptom on a phone, and only
 * the object tells them apart.
 *
 * So the panel leads with the one comparison that decides it (branches we
 * expect vs. branches Google stored) and then shows the raw JSON, unsummarised.
 * A summary here would just be another layer of guesswork between the evidence
 * and the person reading it.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, RefreshCw } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetLoyaltyGoogleObject,
  useRefreshLoyaltyGooglePass,
} from "@/data/api/generated/api";
import type { GoogleRefreshReport } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";

export function GoogleObjectDialog({
  memberId,
  memberName,
  onOpenChange,
}: {
  memberId: string | null;
  memberName: string;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation();
  // Only asked for when a row is picked: this makes a live call to Google.
  const q = useGetLoyaltyGoogleObject(memberId ?? "", {
    query: { enabled: !!memberId, staleTime: 0, gcTime: 0 },
  });

  // Reading says what Google HOLDS; it never says why. The refresh runs the
  // real provisioning and keeps a transcript of every request and answer, which
  // is the only way to see a write that failed quietly — a refused refresh is
  // deliberately a warning, so the customer keeps the card they have.
  const [report, setReport] = useState<GoogleRefreshReport | null>(null);
  const refresh = useRefreshLoyaltyGooglePass();
  const run = () => {
    if (!memberId) return;
    refresh.mutate(
      { id: memberId },
      { onSuccess: (r) => setReport(r), onError: () => setReport(null) },
    );
  };

  const d = q.data;
  const matches = d && d.object && d.stored_locations === d.expected_locations;

  return (
    <Dialog
      open={!!memberId}
      onOpenChange={(o) => {
        if (!o) setReport(null);
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl">
        <DialogHeader className="min-w-0">
          <DialogTitle className="truncate">
            {t("loyalty.googleObject", "Google Wallet object")}
          </DialogTitle>
          <DialogDescription>
            {t("loyalty.googleObjectFor", {
              defaultValue: "What Google is holding for {{name}}.",
              name: memberName,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={run}
            disabled={refresh.isPending}
          >
            {refresh.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {t("loyalty.refreshFromGoogle", "Send it again, and show me")}
          </Button>
          <p className="min-w-0 flex-1 text-xs text-muted-foreground">
            {t(
              "loyalty.refreshHint",
              "Writes the class and the card, then reports every request and Google's answer.",
            )}
          </p>
        </div>

        {refresh.error ? (
          <p className="text-sm text-destructive">
            {getErrorMessage(refresh.error)}
          </p>
        ) : null}

        {report ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-4 rounded-lg bg-muted px-3 py-2 text-sm">
              <span>
                {t("loyalty.branchesSent", "Sent")}:{" "}
                <b className="font-mono">{report.sent_locations}</b>
              </span>
              <span
                className={
                  report.class_locations === report.sent_locations
                    ? undefined
                    : "font-medium text-destructive"
                }
              >
                {t("loyalty.branchesOnClass", "Kept on the class")}:{" "}
                <b className="font-mono">{report.class_locations}</b>
              </span>
              <span
                className={
                  report.object_locations === report.sent_locations
                    ? undefined
                    : "font-medium text-destructive"
                }
              >
                {t("loyalty.branchesOnObject", "Kept on the card")}:{" "}
                <b className="font-mono">{report.object_locations}</b>
              </span>
            </div>
            {report.error ? (
              <p className="text-sm text-destructive [overflow-wrap:anywhere]">
                {report.error}
              </p>
            ) : null}
            <ol className="space-y-2">
              {report.steps.map((s, i) => (
                <li key={`${s.step}-${i}`} className="rounded-lg border">
                  <div className="flex items-center gap-2 border-b px-3 py-1.5 text-xs">
                    <span className="font-medium">{s.step}</span>
                    <span
                      className={`ms-auto font-mono ${
                        s.status >= 200 && s.status < 300
                          ? "text-muted-foreground"
                          : "font-semibold text-destructive"
                      }`}
                    >
                      {s.status || "—"}
                    </span>
                  </div>
                  <pre className="max-h-48 overflow-auto px-3 py-2 text-[11px] leading-relaxed">
                    {s.body}
                  </pre>
                </li>
              ))}
            </ol>
            {report.class ? (
              <details className="rounded-lg border">
                <summary className="cursor-pointer px-3 py-2 text-xs font-medium">
                  {t("loyalty.classNow", "The class, as Google holds it")}
                </summary>
                <pre className="max-h-72 overflow-auto border-t px-3 py-2 text-[11px]">
                  {JSON.stringify(report.class, null, 2)}
                </pre>
              </details>
            ) : null}
          </div>
        ) : null}

        {q.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : q.error ? (
          <p className="text-sm text-destructive">{getErrorMessage(q.error)}</p>
        ) : d ? (
          <div className="space-y-3">
            {/* The verdict, before the JSON — the counts are the whole point. */}
            <div className="flex flex-wrap gap-4 rounded-lg bg-muted px-3 py-2 text-sm">
              <span>
                {t("loyalty.branchesExpected", "Branches we send")}:{" "}
                <b className="font-mono">{d.expected_locations}</b>
              </span>
              <span
                className={
                  matches
                    ? "text-success-foreground"
                    : "font-medium text-destructive"
                }
              >
                {t("loyalty.branchesStored", "Branches Google has")}:{" "}
                <b className="font-mono">{d.stored_locations}</b>
              </span>
            </div>
            {d.error ? (
              <p className="text-sm text-destructive [overflow-wrap:anywhere]">
                {d.error}
              </p>
            ) : null}
            {d.object ? (
              <pre className="max-h-96 overflow-auto rounded-lg border bg-card p-3 text-xs">
                {JSON.stringify(d.object, null, 2)}
              </pre>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
