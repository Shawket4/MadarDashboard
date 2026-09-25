/**
 * Owner only (SC-12, SC-13 guardrails): who works the nights, by gender,
 * against who said they want them — for the business and branch by branch,
 * each branch with its own gap flag (over 20 points) and learning state — and
 * the kept monthly audits. The server computes every figure.
 */
import { useTranslation } from "react-i18next";
import { Scale } from "lucide-react";

import { StatusPill } from "@/components/app/status-pill";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFairness, useFairnessAudits } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { fmtDate } from "@/lib/format";
import { dawamQuery, failedEmpty } from "./live";

export function FairnessCard({ month }: { month: string }) {
  const { t } = useTranslation();
  const q = useFairness({ month }, { query: dawamQuery() });
  const auditsQ = useFairnessAudits({ query: dawamQuery() });
  const v = q.data;
  const gender = (g: string | null | undefined) =>
    g === "m" ? t("dawam.gender_m", "Male") : g === "f" ? t("dawam.gender_f", "Female") : t("dawam.notSet", "Not set");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Scale className="size-4" />{t("dawam.fairnessTitle", "Night shifts, fairly")}</CardTitle>
        <CardDescription>{t("dawam.fairnessHint", "This month's nights by gender, against who said they prefer evenings. Only you see this.")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {failedEmpty(q) ? (
          <p className="text-sm text-destructive">{getErrorMessage(q.error)}</p>
        ) : !v ? <Skeleton className="h-24 w-full" /> : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="py-1 text-start font-semibold">{t("dawam.gender", "Gender")}</th>
                  <th className="py-1 text-end font-semibold">{t("dawam.people", "People")}</th>
                  <th className="py-1 text-end font-semibold">{t("dawam.willing", "Prefer evenings")}</th>
                  <th className="py-1 text-end font-semibold">{t("dawam.shifts", "Shifts")}</th>
                  <th className="py-1 text-end font-semibold">{t("dawam.nightShifts", "Night shifts")}</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {v.rows.map((r) => (
                  <tr key={r.gender ?? "none"} className="border-t">
                    <td className="py-1.5">{gender(r.gender)}</td>
                    <td className="py-1.5 text-end">{r.people}</td>
                    <td className="py-1.5 text-end">{r.willing}</td>
                    <td className="py-1.5 text-end">{r.shifts}</td>
                    <td className="py-1.5 text-end">{r.night_shifts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-sm text-muted-foreground">
              {t("dawam.fairnessDecided", { accepted: v.accepted_4w, decided: v.decided_4w, defaultValue: `Managers accepted ${v.accepted_4w} of ${v.decided_4w} suggestions in the last 4 weeks.` })}
              {v.learning_frozen ? ` ${t("dawam.learningFrozen", "Under 40% accepted, so suggestions stopped learning from decisions until that changes.")}` : ""}
            </p>

            {(v.branches ?? []).length > 0 ? (
              <section className="space-y-1.5">
                <h3 className="text-sm font-semibold text-muted-foreground">{t("dawam.byBranch", "Branch by branch")}</h3>
                <table className="w-full text-sm" aria-label={t("dawam.byBranch", "Branch by branch")}>
                  <thead>
                    <tr className="text-xs text-muted-foreground">
                      <th className="py-1 text-start font-semibold">{t("dawam.branch", "Branch")}</th>
                      <th className="py-1 text-end font-semibold">{t("dawam.gapPoints", "Gap (points)")}</th>
                      <th className="py-1 text-end font-semibold">{t("dawam.accepted", "Accepted")}</th>
                      <th className="py-1 text-end font-semibold">{t("dawam.byDefaultDecided", "Decided by the default")}</th>
                      <th className="py-1 text-end font-semibold"><span className="sr-only">{t("dawam.state", "State")}</span></th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {v.branches.map((b) => (
                      <tr key={b.branch_id} className="border-t">
                        <td className="py-1.5">{b.branch_name}</td>
                        <td className="py-1.5 text-end">{b.gap_points}</td>
                        <td className="py-1.5 text-end">{b.accepted}/{b.decided}</td>
                        <td className="py-1.5 text-end">{b.by_default_decided}</td>
                        <td className="py-1.5 text-end">
                          <span className="inline-flex flex-wrap justify-end gap-1">
                            {b.flagged ? <StatusPill size="sm" tone="danger">{t("dawam.flagged", "Over 20 points")}</StatusPill> : null}
                            {b.learning_frozen ? <StatusPill size="sm" tone="warning">{t("dawam.frozen", "Learning paused")}</StatusPill> : null}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : null}
          </>
        )}

        <section className="space-y-1.5">
          <h3 className="text-sm font-semibold text-muted-foreground">{t("dawam.audits", "Monthly audits")}</h3>
          {failedEmpty(auditsQ) ? (
            <p className="text-sm text-destructive">{getErrorMessage(auditsQ.error)}</p>
          ) : (auditsQ.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("dawam.noAudits", "The first audit runs at the start of next month.")}</p>
          ) : (
            <ul className="space-y-1 text-sm" aria-label={t("dawam.audits", "Monthly audits")}>
              {(auditsQ.data ?? []).map((a) => (
                <li key={`${a.branch_id}|${a.month}`} className="flex flex-wrap items-center gap-2 border-t py-1.5">
                  <span className="font-medium">{a.report.branch_name}</span>
                  <span className="text-muted-foreground">{fmtDate(a.month)}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {t("dawam.gapOf", { n: a.report.gap_points, defaultValue: "gap {{n}} points" })}
                  </span>
                  {a.flagged ? <StatusPill size="sm" tone="danger">{t("dawam.flagged", "Over 20 points")}</StatusPill> : (
                    <StatusPill size="sm" tone="success">{t("dawam.fair", "Within 20 points")}</StatusPill>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
