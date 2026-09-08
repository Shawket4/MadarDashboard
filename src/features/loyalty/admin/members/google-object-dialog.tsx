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
import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetLoyaltyGoogleObject } from "@/data/api/generated/api";
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

  const d = q.data;
  const matches = d && d.object && d.stored_locations === d.expected_locations;

  return (
    <Dialog open={!!memberId} onOpenChange={onOpenChange}>
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
