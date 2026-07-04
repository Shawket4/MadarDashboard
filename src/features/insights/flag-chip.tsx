import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BellOff, Wrench, X } from "lucide-react";

import type { Signal } from "@/data/api/generated/models";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SIGNAL_TONE, signalLabel, signalReason } from "./signals";

export type DecisionAction = "acted" | "dismissed" | "snoozed";

/**
 * One advisory flag as a compact chip. Clicking opens a popover with the
 * plain-language reason and three actions: Fix (deep link to the fix surface,
 * recorded as `acted`), Dismiss and Snooze (both suppress server-side).
 */
export function FlagChip({
  signal,
  onFix,
  onDecide,
  busy,
}: {
  signal: Signal;
  /** Record `acted` (fire-and-forget) then navigate to the fix surface. */
  onFix: (signal: Signal) => void;
  /** POST the decision, then invalidate so the signal disappears. */
  onDecide: (signal: Signal, action: "dismissed" | "snoozed") => Promise<void>;
  busy?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const decide = async (action: "dismissed" | "snoozed") => {
    await onDecide(signal, action);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex shrink-0 cursor-pointer items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
            "transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            SIGNAL_TONE[signal.kind] ?? "bg-muted text-muted-foreground",
          )}
        >
          {signalLabel(t, signal.kind)}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-72 space-y-3">
        <p className="text-sm leading-relaxed">{signalReason(t, signal)}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" disabled={busy} onClick={() => onFix(signal)}>
            <Wrench className="size-3.5" />
            {t("insights.actions.fix", "Fix")}
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void decide("dismissed")}>
            <X className="size-3.5" />
            {t("insights.actions.dismiss", "Dismiss")}
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void decide("snoozed")}>
            <BellOff className="size-3.5" />
            {t("insights.actions.snooze", "Snooze")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
