import { useTranslation } from "react-i18next";
import { ChevronDown, ScanSearch } from "lucide-react";

import { ListCard } from "@/components/app/list-row";
import { SectionHeader } from "@/components/app/section-header";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/data/api/errors";
import { useCan } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { fmtDateTime, fmtMoney, fmtMoneySigned } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useTillSpotChecks, type TillSpotCheck } from "./api";

/** Over/short tone, pulled halfway to foreground for text contrast (CLAUDE.md). */
export function differenceTone(diff: number | null | undefined): "even" | "over" | "short" {
  if (!diff) return "even";
  return diff > 0 ? "over" : "short";
}

const toneClass = {
  even: "text-[color-mix(in_oklch,var(--color-success)_60%,var(--color-foreground))]",
  over: "text-[color-mix(in_oklch,var(--color-warning)_50%,var(--color-foreground))]",
  short: "text-[color-mix(in_oklch,var(--color-destructive)_60%,var(--color-foreground))]",
} as const;

/** Mid-till cash spot checks (T17). Gated by the till read capability. */
export function TillSpotChecks({ tillId, enabled }: { tillId: string | null; enabled: boolean }) {
  const canRead = useCan(Cap.tillRead);
  if (!canRead) return null;
  return <TillSpotChecksLoader tillId={tillId} enabled={enabled} />;
}

function TillSpotChecksLoader({ tillId, enabled }: { tillId: string | null; enabled: boolean }) {
  const q = useTillSpotChecks(tillId, enabled);
  if (q.isLoading) return <Skeleton className="h-24 w-full rounded-2xl" />;
  if (q.isError) {
    return (
      <p role="alert" className="text-sm text-muted-foreground">
        {getErrorMessage(q.error)}
      </p>
    );
  }
  return <SpotCheckList checks={q.data ?? []} />;
}

export function SpotCheckList({ checks }: { checks: TillSpotCheck[] }) {
  const { t } = useTranslation();
  return (
    <section className="space-y-3" data-testid="till-spot-checks">
      <SectionHeader as="h3" icon={ScanSearch} title={t("tills.spotChecks.title", "Spot checks")} count={checks.length} />
      {checks.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="spot-checks-empty">
          {t("tills.spotChecks.empty", "No spot checks were taken on this till.")}
        </p>
      ) : (
        <ListCard>
          {checks.map((c) => (
            <SpotCheckRow key={c.id} check={c} />
          ))}
        </ListCard>
      )}
    </section>
  );
}

function DiffLabel({ diff }: { diff: number }) {
  const { t } = useTranslation();
  const tone = differenceTone(diff);
  const label =
    tone === "even"
      ? t("tills.spotChecks.even", "Even")
      : tone === "over"
        ? t("tills.spotChecks.over", "Over")
        : t("tills.spotChecks.short", "Short");
  return (
    <span className={cn("inline-flex items-center gap-1 font-semibold", toneClass[tone])} data-tone={tone}>
      <span>{label}</span>
      {tone === "even" ? null : <bdi className="tabular-nums">{fmtMoneySigned(diff)}</bdi>}
    </span>
  );
}

function SpotCheckRow({ check }: { check: TillSpotCheck }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2 px-3 py-3 text-sm sm:px-4" data-testid="spot-check-row">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{fmtDateTime(check.checked_at)}</p>
          <p className="text-xs text-muted-foreground">
            {t("tills.spotChecks.checkedBy", { name: check.checked_by_name, defaultValue: "Checked by {{name}}" })}
            {check.approved_by_name
              ? ` · ${t("tills.spotChecks.approvedBy", { name: check.approved_by_name, defaultValue: "approved by {{name}}" })}`
              : null}
          </p>
        </div>
        <DiffLabel diff={check.cash_discrepancy} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">{t("tills.spotChecks.counted", "Counted")}</span>
          <bdi className="tabular-nums">{fmtMoney(check.counted_cash)}</bdi>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">{t("tills.spotChecks.expected", "Expected")}</span>
          <bdi className="tabular-nums">{fmtMoney(check.expected_cash)}</bdi>
        </div>
      </div>
      {check.note ? <p className="text-xs text-foreground/80">{check.note}</p> : null}
      {check.methods.length > 0 ? (
        <Collapsible>
          <CollapsibleTrigger className="group inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            {t("tills.spotChecks.methods", { count: check.methods.length, defaultValue: "{{count}} methods" })}
            <ChevronDown className="size-3 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-1">
            {check.methods.map((m) => (
              <div key={m.method} className="flex items-center justify-between gap-2 text-xs" data-testid="spot-check-method">
                <span className="text-muted-foreground">{t(`payments.${m.method}`, m.method)}</span>
                <span className="flex items-center gap-2">
                  <bdi className="tabular-nums">
                    {m.counted == null ? t("tills.spotChecks.notCounted", "Not counted") : fmtMoney(m.counted)}
                    {" / "}
                    {fmtMoney(m.expected)}
                  </bdi>
                  {m.discrepancy == null ? null : <DiffLabel diff={m.discrepancy} />}
                </span>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}
