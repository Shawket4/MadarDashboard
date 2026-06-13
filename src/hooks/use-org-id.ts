import { useAppStore } from "@/data/stores/app.store";
import { useAuthStore } from "@/data/stores/auth.store";

/** The org the current user is scoped to (super-admins use the selected org). */
export function useOrgId(): string | null {
  const role = useAuthStore((s) => s.user?.role);
  const userOrgId = useAuthStore((s) => s.user?.org_id);
  const selectedOrgId = useAppStore((s) => s.selectedOrgId);
  return role === "super_admin" ? selectedOrgId : (userOrgId ?? null);
}
