import type { DisciplineReportParams } from "@/data/api/generated/models";
import { businessDate } from "@/lib/format";

/** The discipline report's request, for the page and the sidebar prefetch: the scope's period as business dates. */
export const disciplineParams = ({ branchId, from, to }: { branchId: string | null; from: string; to: string }): DisciplineReportParams => ({
  from: businessDate(from),
  to: businessDate(to),
  branch_id: branchId ?? undefined,
});
