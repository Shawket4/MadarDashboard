/**
 * Rules first (Dawam DSH-6, RU-1): until the business saves its rules nobody
 * can clock in — the API answers every punch with `RULES_NOT_SET`. So every
 * Dawam page says so, and sends the owner to the one page that fixes it —
 * the set-up checklist when more than the rules is missing (SA-4).
 */
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import { setupProgress, useSetupData } from "./setup";

export function RulesFirstBanner() {
  const { t } = useTranslation();
  const data = useSetupData(true, true);
  // Only an answer that says "never saved" shows it; loading or an error says nothing.
  if (!data.settings || data.settings.rules_saved_at) return null;
  // The checklist only when we know another step is missing too; someone who
  // can't read one of them (a 403) still gets sent to the rules.
  const p = setupProgress(data);
  const more = p.ready && p.count < 3;
  return (
    <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4">
      <Scale className="size-5 shrink-0 text-warning" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{t("dawam.rulesFirstTitle", "Save the rules before anyone can clock in")}</p>
        <p className="text-sm text-muted-foreground">
          {t("dawam.rulesFirstHint", "Lateness, overtime, pay day and labour limits. Until they are saved, the app refuses every clock-in.")}
        </p>
      </div>
      <Button asChild>
        {more ? (
          <Link to="/staff/setup">{t("dawam.setupFinish", "Finish set-up")}</Link>
        ) : (
          <Link to="/staff/rules">{t("dawam.rulesFirstAction", "Set the rules")}</Link>
        )}
      </Button>
    </div>
  );
}
