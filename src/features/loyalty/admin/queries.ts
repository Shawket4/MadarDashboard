
/**
 * Every loyalty read is scoped the same way: a branch's row, or (no params)
 * the organisation's own. One builder for the panes AND the sidebar prefetch.
 */
export const programParams = (branchId: string | null): { branch_id?: string } =>
  branchId ? { branch_id: branchId } : {};
