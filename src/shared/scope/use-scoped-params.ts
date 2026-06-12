import { useScopeStore } from "./scope-store";

/** The one hook scoped pages read — branch + period from the global scope. */
export const useScopedParams = (): { branchId: string | null; from: string | null; to: string | null } => {
  const branchId = useScopeStore((s) => s.branchId);
  const from = useScopeStore((s) => s.from);
  const to = useScopeStore((s) => s.to);
  return { branchId, from, to };
};
