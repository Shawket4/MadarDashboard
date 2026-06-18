import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { ChevronRight, MapPin, Store } from "lucide-react";

import type { PublicBranch } from "@/data/api/generated/models/publicBranch";
import { usePublicBranches } from "@/data/api/generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { listItem, staggerContainer } from "@/lib/motion";

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
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
          >
            <Skeleton className="size-11 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2 rounded-full" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
            <Skeleton className="size-5 shrink-0 rounded-full" />
          </div>
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
                "group flex w-full items-center gap-3 rounded-2xl p-4 text-start transition-all",
                anyOpen
                  ? "border border-border/70 bg-card shadow-sm hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md active:translate-y-0"
                  : "border border-dashed border-border/70 bg-muted/30",
              )}
            >
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl",
                  anyOpen ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground",
                )}
              >
                <MapPin className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate font-serif font-medium",
                    !anyOpen && "text-muted-foreground",
                  )}
                >
                  {b.name}
                </span>
                <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {anyOpen ? (
                    <>
                      {b.in_mall_enabled && (
                        <ChannelPill open={b.in_mall_open_now} label={t("order.channel.inMall")} />
                      )}
                      {b.outside_enabled && (
                        <ChannelPill open={b.outside_open_now} label={t("order.channel.outside")} />
                      )}
                    </>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {t("order.channel.closed")}
                    </span>
                  )}
                </span>
              </span>
              {anyOpen && (
                <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              )}
            </button>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

/** A compact status pill for a single ordering channel: green when open, muted when not. */
function ChannelPill({ open, label }: { open: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        open ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
      )}
    >
      {open && <span className="size-1.5 rounded-full bg-success" />}
      {label}
    </span>
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
