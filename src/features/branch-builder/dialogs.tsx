/**
 * The two moments the builder asks something of the person: which of the four
 * setups a new branch starts from, and — before a save — whether what the
 * change does is what they meant (CH-4).
 */
import { useTranslation } from "react-i18next";
import { ArrowRight, LayoutGrid, Loader2, Printer, ReceiptText, Split, TriangleAlert, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import {
  SETUPS, diffPlans, routingModeFor, type PieceRef, type Plan, type RoutingMode, type Setup,
} from "./plan";
import { pieceName, setupLabel } from "./vocabulary";

const SETUP_ICON: Record<Setup, LucideIcon> = {
  till: ReceiptText,
  till_printer: Printer,
  till_screen: LayoutGrid,
  sections: Split,
};

/** The four branch setups as the first thing a new branch sees (BB-3). */
export function SetupPicker({ onPick, disabled }: { onPick: (s: Setup) => void; disabled?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-6">
      <div className="space-y-1 text-center">
        <h2 className="text-lg font-semibold">{t("builder.pickTitle", "How is this branch set up?")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("builder.pickBody", "Pick the closest one. Everything it places can be changed, moved or removed afterwards.")}
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {SETUPS.map((s) => {
          const Icon = SETUP_ICON[s];
          const { title, body } = setupLabel(t, s);
          const common = s === "till_printer" || s === "till_screen";
          return (
            <li key={s}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(s)}
                className="group flex h-full w-full items-start gap-3 rounded-xl border bg-card p-4 text-start transition-colors duration-150 hover:border-primary/60 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60 motion-reduce:transition-none"
              >
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 space-y-1">
                  <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    {title}
                    {common ? (
                      <span className="rounded-full bg-secondary px-2 py-px text-[11px] font-medium text-muted-foreground">
                        {t("builder.mostCommon", "Most common")}
                      </span>
                    ) : null}
                  </span>
                  <span className="block text-xs leading-relaxed text-muted-foreground">{body}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const routingText = (t: ReturnType<typeof useTranslation>["t"], m: RoutingMode | string) =>
  ({
    off: t("builder.routing.off", "No kitchen: orders go nowhere but the receipt"),
    till: t("builder.routing.till", "The POS handles the kitchen and prints its chits"),
    kds: t("builder.routing.kds", "Kitchen screens"),
    both: t("builder.routing.both", "Kitchen screens, and chits from the POS"),
  })[m as RoutingMode] ?? m;

export interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  before: Plan;
  after: Plan;
  routingNow: string;
  /** Open kitchen items per section id. */
  openItems: Map<string, number>;
  saving: boolean;
  onConfirm: () => void;
}

/** What the save will do, in plain words, before it does it. */
export function ReviewDialog({
  open, onOpenChange, before, after, routingNow, openItems, saving, onConfirm,
}: ReviewDialogProps) {
  const { t } = useTranslation();
  const diff = diffPlans(before, after);
  const routingNext = routingModeFor(after);
  const busy = diff.removed.filter((r) => r.kind === "section" && (openItems.get(r.id) ?? 0) > 0);
  const firstSave = before.devices.length + before.printers.length + before.sections.length === 0;

  const names = (refs: PieceRef[], plan: Plan) =>
    refs.map((r) => pieceName(plan, r) || t("builder.unnamed", "Unnamed")).join(", ");

  const rows: { label: string; value: string; tone?: "danger" }[] = [];
  if (diff.added.length) rows.push({ label: t("builder.review.added", "Added"), value: names(diff.added, after) });
  if (diff.changed.length) rows.push({ label: t("builder.review.changed", "Changed"), value: names(diff.changed, after) });
  if (diff.removed.length) rows.push({ label: t("builder.review.removed", "Removed"), value: names(diff.removed, before), tone: "danger" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("builder.review.title", "Save the branch plan?")}</DialogTitle>
          <DialogDescription>
            {firstSave
              ? t("builder.review.firstBody", "This becomes the branch's plan. Devices and printers follow it from now on.")
              : t("builder.review.body", "The branch's devices follow the new plan at once. Orders already sent to the kitchen finish where they were sent.")}
          </DialogDescription>
        </DialogHeader>

        <dl className="space-y-3 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="grid grid-cols-[88px_1fr] gap-3">
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd className={cn("min-w-0 break-words", r.tone === "danger" && "text-destructive")}>{r.value}</dd>
            </div>
          ))}
          {routingNext !== routingNow ? (
            <div className="grid grid-cols-[88px_1fr] gap-3">
              <dt className="text-muted-foreground">{t("builder.review.kitchen", "Kitchen")}</dt>
              <dd className="flex min-w-0 flex-wrap items-center gap-1.5">
                <span className="text-muted-foreground line-through decoration-muted-foreground/60">{routingText(t, routingNow)}</span>
                <ArrowRight aria-hidden className="size-3.5 shrink-0 text-muted-foreground rtl:rotate-180" />
                <span className="font-medium">{routingText(t, routingNext)}</span>
              </dd>
            </div>
          ) : null}
          {rows.length === 0 && routingNext === routingNow ? (
            <p className="text-muted-foreground">{t("builder.review.onlyMoved", "Only positions on the canvas changed.")}</p>
          ) : null}
        </dl>

        {busy.length > 0 ? (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-[color-mix(in_oklab,var(--color-destructive)_60%,var(--color-foreground))]">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {t("builder.review.busy", "{{names}} still has items cooking. Finish or move them on the kitchen screen first, or keep the section.", {
              names: names(busy, before),
            })}
          </p>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button onClick={onConfirm} disabled={saving || busy.length > 0} className="gap-1.5">
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("builder.save", "Save plan")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
