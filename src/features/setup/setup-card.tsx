import { useTranslation } from "react-i18next";
import { ArrowRight, Rocket, Wrench } from "lucide-react";

import { Link } from "@/components/app/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthz } from "@/data/authz/use-authz";
import { keepScopeWith } from "@/data/scope/list-search";
import { Cap } from "@/generated/capabilities";
import { useOrgId } from "@/hooks/use-org-id";
import { Reveal } from "@/lib/motion";

import { leftToDo, nextCheck, showsHomeCard, stageOf } from "./checks";
import { useCheckCopy } from "./check-row";
import { useReadiness } from "./queries";

/**
 * The home page's pointer to Setup: while something stops a sale, how many
 * things and the next one; once nothing does, the first sale to ring up. Gone
 * after the first sale, and back by itself if something breaks the till again.
 * Nothing is dismissed or stored: it follows the server's answer.
 *
 * A super admin scoped to a shop sees it too: setting a shop up on its owner's
 * behalf is exactly when it helps.
 */
export function SetupCard() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const canSee = useAuthz().can(Cap.orgSettingsEdit);
  const q = useReadiness(canSee ? orgId : null);
  const copy = useCheckCopy();
  const r = q.data;
  if (!r || !showsHomeCard(r)) return null;

  const ready = stageOf(r) === "ready";
  const next = nextCheck(r);
  const Icon = ready ? Rocket : Wrench;

  return (
    <Reveal>
      <Card className="flex-row flex-wrap items-center gap-4 border-primary/20 bg-primary/5 p-4 shadow-sm">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 basis-56">
          <p className="text-sm font-semibold">
            {ready
              ? t("setup.card.readyTitle", "Ready to sell")
              : t("setup.card.title", { count: leftToDo(r), defaultValue: "{{count}} things before your first sale" })}
          </p>
          <p className="text-xs text-muted-foreground text-pretty">
            {ready
              ? t("setup.card.readyBody", "Ring up a first order on the tablet and you're live.")
              : next
                ? t("setup.card.next", { what: copy.title(next.key), defaultValue: "Next: {{what}}." }) + " " + copy.line(next)
                : null}
          </p>
        </div>
        <Button asChild size="sm" variant={ready ? "outline" : "default"}>
          <Link to="/setup" search={keepScopeWith({}) as never}>
            {ready ? t("setup.card.readyCta", "Get the apps") : t("setup.card.cta", "Continue setup")}
            <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
          </Link>
        </Button>
      </Card>
    </Reveal>
  );
}
