import { useTranslation } from "react-i18next";
import { AlertTriangle, ShieldQuestion, Wifi } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { Till } from "./api";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-success/10 text-success",
  closed: "bg-muted text-muted-foreground",
  force_closed: "bg-warning/10 text-warning",
};

export function TillStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <Badge variant="secondary" className={cn(STATUS_STYLES[status] ?? "")}>
      {t(`tillStatus.${status}`, status.replace("_", " "))}
    </Badge>
  );
}

/** Only the non-default verifications earn a badge: server-verified is the norm. */
export function VerificationBadge({ verification }: { verification: Till["verification"] }) {
  const { t } = useTranslation();
  if (verification !== "unverified" && verification !== "lan") return null;
  const Icon = verification === "lan" ? Wifi : ShieldQuestion;
  return (
    <Badge
      variant="secondary"
      data-testid="verification-badge"
      className={cn(verification === "unverified" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground")}
    >
      <Icon className="size-3" aria-hidden="true" />
      {t(`tills.verification.${verification}`, verification === "lan" ? "Verified on LAN" : "Not verified")}
    </Badge>
  );
}

export function FlagBadge({ till, onOpenOther }: { till: Pick<Till, "opened_while_another_open" | "other_till_id">; onOpenOther?: (id: string) => void }) {
  const { t } = useTranslation();
  if (!till.opened_while_another_open) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1" data-testid="flag-badge">
      <Badge variant="secondary" className="bg-warning/10 text-warning">
        <AlertTriangle className="size-3" aria-hidden="true" />
        {t("tills.flagged", "Opened while another till was open")}
      </Badge>
      {till.other_till_id && onOpenOther ? (
        <button
          type="button"
          className="text-xs text-primary underline-offset-2 hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            onOpenOther(till.other_till_id!);
          }}
        >
          {t("tills.flaggedLink", "See the other till")}
        </button>
      ) : null}
    </span>
  );
}

export function DisagreementBadge({ till }: { till: Pick<Till, "reconciliation_status" | "disagreement_count"> }) {
  const { t } = useTranslation();
  if (till.reconciliation_status !== "disagreed" || !till.disagreement_count) return null;
  return (
    <Badge variant="secondary" data-testid="disagreement-badge" className="bg-destructive/10 text-destructive">
      {t("tills.reconciliation.disagreements", { count: till.disagreement_count, defaultValue: "{{count}} mismatches" })}
    </Badge>
  );
}
