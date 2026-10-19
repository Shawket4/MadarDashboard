import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown } from "lucide-react";

import { Link } from "@/components/app/link";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { ReadinessCheck } from "@/data/api/generated/models";
import { keepScopeWith } from "@/data/scope/list-search";
import { cn } from "@/lib/utils";

import { CHECKS, problemLink } from "./checks";

/** A check's title, its sentence for this state, and its button's words. */
export function useCheckCopy() {
  const { t, i18n } = useTranslation();
  const list = (names: string[]) =>
    new Intl.ListFormat(i18n.resolvedLanguage ?? "en", { type: "conjunction" }).format(names);
  return {
    title: (key: string) => t(`setup.checks.${key}.title`),
    action: (key: string) => t(`setup.checks.${key}.action`),
    line: (c: ReadinessCheck) => {
      const names = c.problems.map((p) => p.name);
      const total = c.total ?? 0;
      return c.ok
        ? t(`setup.checks.${c.key}.ok`, { count: c.count, total })
        : t(`setup.checks.${c.key}.todo`, {
            count: c.count,
            total,
            done: Math.max(0, total - c.count),
            names: list(names.length ? names : [""]),
          });
    },
  };
}

/** The state mark: a tick, an open ring (to do before selling) or a dashed ring (worth doing). */
function StateMark({ check }: { check: ReadinessCheck }) {
  const { t } = useTranslation();
  if (check.ok)
    return (
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-success/15 text-[color-mix(in_oklab,var(--color-success)_55%,var(--color-foreground))]">
        <Check aria-hidden className="size-4" strokeWidth={2.5} />
        <span className="sr-only">{t("setup.state.done", "Done")}</span>
      </span>
    );
  return (
    <span
      className={cn(
        "size-7 shrink-0 rounded-full border-2",
        check.level === "blocking" ? "border-warning" : "border-dashed border-muted-foreground/50",
      )}
    >
      <span className="sr-only">
        {check.level === "blocking" ? t("setup.state.todo", "To do before selling") : t("setup.state.advice", "Worth doing")}
      </span>
    </span>
  );
}

/**
 * One readiness check as a row: what it is, what's wrong in one line, one
 * button to the page that fixes it (or `action`, when the fix is a dialog), and
 * the named things it found, each linking to its own editor.
 */
export function CheckRow({ check, action }: { check: ReadinessCheck; action?: ReactNode }) {
  const { t } = useTranslation();
  const copy = useCheckCopy();
  const [open, setOpen] = useState(false);
  const def = CHECKS[check.key];
  const Icon = def.icon;
  const named = check.problems.length > 0 && check.problems.some((p) => p.entity_type !== "branch");

  return (
    <li
      data-check={check.key}
      className={cn(
        "rounded-xl border bg-card transition-colors",
        check.ok ? "border-border/60" : check.level === "blocking" ? "border-border" : "border-border/80",
      )}
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
          <StateMark check={check} />
          <div className="flex min-w-0 flex-1 basis-56 items-start gap-3">
            <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", check.ok ? "text-muted-foreground" : "text-foreground")} />
            <div className="min-w-0">
              <p className={cn("font-medium leading-tight", check.ok && "text-muted-foreground")}>{copy.title(check.key)}</p>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">{copy.line(check)}</p>
            </div>
          </div>
          {!check.ok ? (
            <div className="flex flex-wrap items-center gap-2 ms-11 sm:ms-0">
              {named ? (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" aria-expanded={open}>
                    {open ? t("setup.hideList", "Hide list") : t("setup.showList", "See which")}
                    <ChevronDown aria-hidden className={cn("size-4 transition-transform duration-fast", open && "rotate-180")} />
                  </Button>
                </CollapsibleTrigger>
              ) : null}
              {action ?? (
                <Button asChild variant={check.level === "blocking" ? "default" : "outline"} size="sm">
                  <Link to={def.link.to as never} params={def.link.params as never} search={keepScopeWith(def.link.search ?? {}) as never}>
                    {copy.action(check.key)}
                  </Link>
                </Button>
              )}
            </div>
          ) : null}
        </div>
        {named ? (
          <CollapsibleContent>
            <ul className="space-y-0.5 border-t border-border/60 px-4 py-3 ps-[4.75rem]">
              {check.problems.map((p) => {
                const link = problemLink(p);
                return (
                  <li key={`${p.entity_type}-${p.entity_id}`}>
                    <Link
                      to={link.to as never}
                      params={link.params as never}
                      search={keepScopeWith({}) as never}
                      className="inline-flex max-w-full rounded-sm text-sm text-foreground underline decoration-border underline-offset-4 outline-none hover:decoration-current focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="truncate">{p.name}</span>
                    </Link>
                  </li>
                );
              })}
              {check.more > 0 ? (
                <li className="pt-1 text-sm text-muted-foreground">
                  {t("setup.andMore", { count: check.more, defaultValue: "and {{count}} more" })}
                </li>
              ) : null}
            </ul>
          </CollapsibleContent>
        ) : null}
      </Collapsible>
    </li>
  );
}
