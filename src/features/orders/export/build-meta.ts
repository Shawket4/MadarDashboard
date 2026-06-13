import type { TFunction } from "i18next";
import { fmtDate } from "@/lib/format";

export function buildMeta(args: {
  branchName: string;
  from: string | null;
  to: string | null;
  payment: string | null;
  status: string | null;
  t: TFunction;
}): string {
  const parts: string[] = [];
  parts.push(`${args.t("orders.branch", "Branch")}: ${args.branchName}`);
  if (args.from && args.to) parts.push(`${fmtDate(args.from)} → ${fmtDate(args.to)}`);
  else parts.push(args.t("orders.allTime", "All time"));
  if (args.payment) parts.push(args.t(`payments.${args.payment}`, args.payment));
  if (args.status) parts.push(args.t(`orderStatus.${args.status}`, args.status));
  return parts.join(" · ");
}
