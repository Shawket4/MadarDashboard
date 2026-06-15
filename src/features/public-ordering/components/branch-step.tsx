import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { ChevronRight, MapPin, Store } from "lucide-react";

import type { PublicBranch } from "@/data/api/generated/models/publicBranch";
import { usePublicBranches } from "@/data/api/generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { listItem, staggerContainer } from "@/lib/motion";

import { ChannelDot } from "./channel-step";

interface BranchStepProps {
  orgId: string;
  onSelect: (branch: PublicBranch) => void;
}

/** A branch is offerable if at least one delivery channel is enabled. */
const isDeliverable = (b: PublicBranch) => b.in_mall_enabled || b.outside_enabled;

export function BranchStep({ orgId, onSelect }: BranchStepProps) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = usePublicBranches({ org_id: orgId });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<Store className="size-6" />}
        title={t("order.branch.error")}
        hint={t("order.branch.errorHint")}
      />
    );
  }

  const branches = (data ?? []).filter(isDeliverable);

  if (branches.length === 0) {
    return (
      <EmptyState
        icon={<Store className="size-6" />}
        title={t("order.branch.none")}
        hint={t("order.branch.noneHint")}
      />
    );
  }

  return (
    <motion.ul variants={staggerContainer(0.05)} initial="hidden" animate="show" className="space-y-3">
      {branches.map((b) => {
        const anyOpen = b.in_mall_open_now || b.outside_open_now;
        return (
          <motion.li key={b.id} variants={listItem}>
            <button
              type="button"
              onClick={() => onSelect(b)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 text-start shadow-sm transition-all",
                "hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md active:translate-y-0",
              )}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <MapPin className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{b.name}</span>
                <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {b.in_mall_enabled && (
                    <ChannelDot open={b.in_mall_open_now} label={t("order.channel.inMall")} />
                  )}
                  {b.outside_enabled && (
                    <ChannelDot open={b.outside_open_now} label={t("order.channel.outside")} />
                  )}
                  {!anyOpen && (
                    <span className="font-medium text-muted-foreground">
                      {t("order.channel.closed")}
                    </span>
                  )}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
            </button>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/70 px-6 py-12 text-center">
      <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </span>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}
