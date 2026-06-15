import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Bike, ChevronRight, Store } from "lucide-react";

import type { PublicBranch } from "@/data/api/generated/models/publicBranch";
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
          open ? "bg-emerald-500" : "bg-muted-foreground/50",
        )}
      />
      <span>{label}</span>
      <span className={cn("font-medium", open ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
        · {open ? t("order.channel.open") : t("order.channel.closed")}
      </span>
    </span>
  );
}

interface ChannelStepProps {
  branch: PublicBranch;
  onSelect: (channel: Channel) => void;
}

interface ChannelOption {
  channel: Channel;
  enabled: boolean;
  open: boolean;
  icon: typeof Store;
  title: string;
  hint: string;
}

export function ChannelStep({ branch, onSelect }: ChannelStepProps) {
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

  return (
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
                "group flex w-full items-center gap-3 rounded-2xl border p-4 text-start shadow-sm transition-all",
                o.open
                  ? "border-border/70 bg-card hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md active:translate-y-0"
                  : "cursor-not-allowed border-dashed border-border/60 bg-muted/40 opacity-70",
              )}
            >
              <span
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-xl",
                  o.open ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-semibold">{o.title}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      o.open
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {o.open ? t("order.channel.open") : t("order.channel.closed")}
                  </span>
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{o.hint}</span>
              </span>
              {o.open && (
                <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              )}
            </button>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
