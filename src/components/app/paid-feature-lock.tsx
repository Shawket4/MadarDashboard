/**
 * A part of a page that belongs to a paid feature, shown to a Free shop as
 * what it is: visible, labelled "Paid plan", disabled, and one tap from asking
 * Madar. The owner sees the feature exists; nothing behind it is fetched.
 *
 * `children` is the real thing and is rendered only when the plan has the
 * feature, so its hooks (and its requests) never run on Free. `preview` is the
 * static stand-in a Free shop sees instead: no data, no inputs that act.
 *
 *   <PaidFeatureLock feature="inventory" title="Recipe steps" preview={<StepsPreview />}>
 *     <SectionSteps ... />
 *   </PaidFeatureLock>
 */
import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

import { UpgradeButton } from "@/components/app/upgrade-page";
import { Badge } from "@/components/ui/badge";
import type { Feature } from "@/generated/plans";
import { useHasFeature } from "@/hooks/use-plan";
import { cn } from "@/lib/utils";

interface Props {
  feature: Feature;
  /** What is locked, in the page's words ("Recipe steps"); omitted = just the note. */
  title?: string;
  /** `block`: a card with the note and a preview below. `inline`: one quiet line, for a control within a row. */
  layout?: "block" | "inline";
  /** What a Free shop sees in place of `children`. */
  preview?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function PaidFeatureLock({ feature, title, layout = "block", preview, children, className }: Props) {
  const { t } = useTranslation();
  const has = useHasFeature(feature);
  if (has) return <>{children}</>;

  const note = t("plan.lock.note", "On the paid plan — contact Madar");
  const badge = (
    <Badge variant="outline" className="gap-1 border-transparent bg-muted text-muted-foreground">
      <Lock aria-hidden className="size-3" />
      {t("plan.lock.badge", "Paid plan")}
    </Badge>
  );
  const contact = (
    <UpgradeButton feature={feature} variant="outline" size="sm" label={t("plan.lock.cta", "Contact Madar")} />
  );

  if (layout === "inline") {
    return (
      <div data-paid-lock={feature} className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", className)}>
        {preview ? <div aria-hidden inert className="pointer-events-none min-w-0 flex-1 select-none opacity-55">{preview}</div> : null}
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          {badge}
          {note}
        </span>
        {contact}
      </div>
    );
  }

  return (
    <section
      data-paid-lock={feature}
      aria-label={title ? `${title}: ${note}` : note}
      className={cn("rounded-xl border border-dashed border-border bg-muted/30 p-4", className)}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Lock className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
            {title}
            {badge}
          </p>
          <p className="text-xs text-muted-foreground">{note}</p>
        </div>
        {contact}
      </div>
      {preview ? (
        <div aria-hidden inert className="pointer-events-none mt-3 select-none opacity-55">
          {preview}
        </div>
      ) : null}
    </section>
  );
}
