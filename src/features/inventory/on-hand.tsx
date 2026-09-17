import { useTranslation } from "react-i18next";

import { StatusPill } from "@/components/app/status-pill";
import { fmtNumber, fmtUnit } from "@/lib/format";
import { cn } from "@/lib/utils";
import { isBelowZero } from "./lib";

const NEGATIVE = "text-[color-mix(in_oklch,var(--color-destructive)_60%,var(--color-foreground))]";

/**
 * An on-hand figure. Below zero is allowed (waste or a sale recorded by a till
 * that could not see the book stock), so it is never hidden or clamped: the
 * negative number is tinted and carries a "Below zero" marker.
 */
export function OnHand({
  qty,
  unit,
  className,
  pill = true,
}: {
  qty: number;
  unit?: string | null;
  className?: string;
  pill?: boolean;
}) {
  const { t } = useTranslation();
  const below = isBelowZero(qty);
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)} data-below-zero={below || undefined}>
      <bdi className={cn("tabular", below && cn("font-semibold", NEGATIVE))}>
        {fmtNumber(qty)} {fmtUnit(unit ?? undefined)}
      </bdi>
      {below && pill ? (
        <StatusPill tone="danger" size="sm">
          {t("inventory.catalog.belowZero", "Below zero")}
        </StatusPill>
      ) : null}
    </span>
  );
}

export function belowZeroClass(qty: number | null | undefined): string | undefined {
  return isBelowZero(qty) ? NEGATIVE : undefined;
}
