import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { CapabilityMeta } from "@/generated/capabilities";
import { cn } from "@/lib/utils";

import { bilingual, capHint, capLabel, catalogGroups } from "./catalog";

/** "Always on" marker for a core capability: locked, never a toggle. */
export function AlwaysOn() {
  const { t } = useTranslation();
  return (
    <Badge variant="outline" className="gap-1 border-transparent bg-muted text-muted-foreground">
      <Lock className="size-3" aria-hidden />
      {t("access.alwaysOn", "Always on")}
    </Badge>
  );
}

/**
 * Every shown capability, grouped with plain names. `control` renders the
 * right-hand side of a row (a switch, a tri-state, "Always on"). The advanced
 * tier of each group starts collapsed.
 */
export function CapabilityGroups({
  control,
  filter,
}: {
  control: (meta: CapabilityMeta) => ReactNode;
  filter?: (meta: CapabilityMeta) => boolean;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const groups = catalogGroups()
    .map((g) => ({ ...g, main: g.main.filter(filter ?? (() => true)), advanced: g.advanced.filter(filter ?? (() => true)) }))
    .filter((g) => g.main.length + g.advanced.length > 0);
  const advancedCount = groups.reduce((n, g) => n + g.advanced.length, 0);

  const row = (meta: CapabilityMeta) => {
    const hint = capHint(meta, lang);
    return (
      <li key={meta.key} className="flex min-h-12 items-center justify-between gap-4 px-4 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-medium">{capLabel(meta, lang)}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div className="shrink-0">{control(meta)}</div>
      </li>
    );
  };

  return (
    <div className="space-y-4">
      {groups.map((g) =>
        g.main.length > 0 ? (
          <section key={g.key} className="overflow-hidden rounded-xl border bg-card">
            <h3 className="border-b bg-muted/30 px-4 py-2.5 text-sm font-semibold">{bilingual(g.en, g.ar, lang)}</h3>
            <ul className="divide-y">{g.main.map(row)}</ul>
          </section>
        ) : null,
      )}
      {advancedCount > 0 ? (
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span>
              {t("access.advanced", "Advanced")}{" "}
              <span className="font-normal text-muted-foreground">({advancedCount})</span>
            </span>
            <ChevronDown className={cn("size-4 transition-transform", showAdvanced && "rotate-180")} aria-hidden />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            {groups
              .filter((g) => g.advanced.length > 0)
              .map((g) => (
                <section key={g.key} className="overflow-hidden rounded-xl border bg-card">
                  <h3 className="border-b bg-muted/30 px-4 py-2.5 text-sm font-semibold">{bilingual(g.en, g.ar, lang)}</h3>
                  <ul className="divide-y">{g.advanced.map(row)}</ul>
                </section>
              ))}
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}
