import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Bike, ChevronRight, Clock, Store } from "lucide-react";

import type { PublicBranch } from "@/data/api/generated/models/publicBranch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listItem, staggerContainer } from "@/lib/motion";

import type { Channel } from "../types";

/** A tiny coloured dot + label that says whether a channel is open right now. */
export function ChannelDot({ open, label }: { open: boolean; label: string }) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "size-1.5 rounded-full",
          open ? "bg-success" : "bg-muted-foreground/50",
        )}
      />
      <span>{label}</span>
      <span className={cn("font-medium", open ? "text-success" : "text-muted-foreground")}>
        · {open ? t("order.channel.open") : t("order.channel.closed")}
      </span>
    </span>
  );
}

interface ChannelStepProps {
  branch: PublicBranch;
  onSelect: (channel: Channel) => void;
  /** Offered when every enabled channel is closed — enter read-only browse. */
  onBrowse?: () => void;
}

interface ChannelOption {
  channel: Channel;
  enabled: boolean;
  open: boolean;
  icon: typeof Store;
  title: string;
  hint: string;
}

export function ChannelStep({ branch, onSelect, onBrowse }: ChannelStepProps) {
  const { t } = useTranslation();

  const all: ChannelOption[] = [
    {
      channel: "in_mall",
      enabled: branch.in_mall_enabled,
      open: branch.in_mall_open_now,
      icon: Store,
      title: t("order.channel.inMall"),
      hint: t("order.channel.inMallHint"),
    },
    {
      channel: "outside",
      enabled: branch.outside_enabled,
      open: branch.outside_open_now,
      icon: Bike,
      title: t("order.channel.outside"),
      hint: t("order.channel.outsideHint"),
    },
  ];
  const options = all.filter((o) => o.enabled);
  // Every channel this branch offers is shut right now — offer a browse escape.
  const allClosed = options.length > 0 && options.every((o) => !o.open);

  return (
    <div className="space-y-4">
    <motion.ul variants={staggerContainer(0.06)} initial="hidden" animate="show" className="space-y-3">
      {options.map((o) => {
        const Icon = o.icon;
        return (
          <motion.li key={o.channel} variants={listItem}>
            <button
              type="button"
              onClick={() => o.open && onSelect(o.channel)}
              disabled={!o.open}
              className={cn(
                "group flex w-full items-center gap-4 rounded-2xl border p-5 text-start shadow-sm transition-all",
                o.open
                  ? "border-border/70 bg-card hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md active:translate-y-0"
                  : "cursor-not-allowed border-dashed border-border/60 bg-muted/40 opacity-70",
              )}
            >
              <span
                className={cn(
                  "flex size-14 shrink-0 items-center justify-center rounded-xl",
                  o.open ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-7" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-serif text-lg font-semibold leading-tight">{o.title}</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      o.open
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {o.open && <span className="size-1.5 rounded-full bg-success" />}
                    {o.open ? t("order.channel.open") : t("order.channel.closed")}
                  </span>
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">{o.hint}</span>
              </span>
              {o.open && (
                <ChevronRight className="size-5 shrink-0 text-brand transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              )}
            </button>
          </motion.li>
        );
      })}
    </motion.ul>

      {allClosed && onBrowse && (
        <div className="rounded-2xl border border-brand/30 bg-brand/5 p-5 text-center">
          <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-brand/10 text-brand">
            <Clock className="size-5" />
          </span>
          <p className="font-serif text-base font-semibold leading-tight">
            {t("order.browse.allClosedTitle", "Everything's closed right now")}
          </p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
            {t("order.browse.allClosedBody", "No channels are taking orders at the moment.")}
          </p>
          <Button variant="brand" className="mt-4" onClick={onBrowse}>
            {t("order.browse.cta", "Browse the menu")}
          </Button>
        </div>
      )}
    </div>
  );
}
