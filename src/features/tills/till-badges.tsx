import { useTranslation } from "react-i18next";
import { ShieldQuestion, Wifi } from "lucide-react";

import { StatusPill, type StatusTone } from "@/components/app/status-pill";

import type { Till, TillStatus } from "./api";

const STATUS_TONE: Record<TillStatus, StatusTone> = {
  open: "accent",
  closed: "neutral",
  force_closed: "warning",
};

export function TillStatusBadge({ status }: { status: TillStatus }) {
  const { t } = useTranslation();
  return (
    <StatusPill tone={STATUS_TONE[status] ?? "neutral"} size="sm">
      {t(`tillStatus.${status}`, status.replace("_", " "))}
    </StatusPill>
  );
}

/** Only the non-default verifications earn a badge: server-verified is the norm. */
export function VerificationBadge({ verification }: { verification: Till["verification"] }) {
  const { t } = useTranslation();
  if (verification !== "unverified" && verification !== "lan") return null;
  return (
    <span data-testid="verification-badge" className="contents">
      <StatusPill
        size="sm"
        tone={verification === "unverified" ? "warning" : "neutral"}
        icon={verification === "lan" ? Wifi : ShieldQuestion}
      >
        {t(`tills.verification.${verification}`, verification === "lan" ? "Verified on LAN" : "Not verified")}
      </StatusPill>
    </span>
  );
}

export function FlagBadge({ till, onOpenOther }: { till: Pick<Till, "opened_while_another_open" | "other_till_id">; onOpenOther?: (id: string) => void }) {
  const { t } = useTranslation();
  if (!till.opened_while_another_open) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5" data-testid="flag-badge">
      <StatusPill size="sm" tone="warning">
        {t("tills.flagged", "Opened while another till was open")}
      </StatusPill>
      {till.other_till_id && onOpenOther ? (
        <button
          type="button"
          className="text-xs font-medium underline underline-offset-2 hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
    <span data-testid="disagreement-badge" className="contents">
      <StatusPill size="sm" tone="danger">
        {t("tills.reconciliation.disagreements", { count: till.disagreement_count, defaultValue: "{{count}} mismatches" })}
      </StatusPill>
    </span>
  );
}
