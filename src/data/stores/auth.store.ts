import { safeStorage } from "@/lib/safe-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { apiContext } from "@/data/api/client";
import { queryClient } from "@/data/api/query";
import { clearShellCache } from "@/data/api/persist-shell";
import { useAppStore } from "@/data/stores/app.store";
import { LS_KEYS } from "@/data/config/constants";
import { setOrgAddons } from "@/lib/plan-features";
import type { UserPublic } from "@/data/types";

/** Mirrors hooks/use-org-modules.ts (not imported: a store must not pull in React hooks). */
const MODULES_KEY_PREFIX = "madar.modules.";

interface AuthState {
  user: UserPublic | null;
  token: string | null;
  /**
   * The plan of the org in scope (`free` | `paid`), as login and `/auth/me`
   * say it; for a super admin, the selected org's. Null = not known yet, which
   * every plan check reads as Paid (madar-plan: an unknown plan never locks a
   * paying shop out). Kept in storage so a reload does not flash paid-only
   * pages at a Free shop.
   */
  plan: string | null;
  /** Features the org has as add-ons beside its plan (Rewards by Madar: `["loyalty"]` on Free). */
  addons: string[];
  hasHydrated: boolean;
  signIn: (token: string, user: UserPublic, plan?: string | null) => void;
  setPlan: (plan: string | null, addons?: string[]) => void;
  signOut: () => void;
  setUser: (user: UserPublic) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      plan: null,
      addons: [],
      hasHydrated: false,
      signIn: (token, user, plan) => {
        apiContext.setToken(token);
        set({ token, user, plan: plan ?? null });
      },
      setPlan: (plan, addons = []) => {
        setOrgAddons(addons);
        set({ plan, addons });
      },
      signOut: () => {
        // Purge api contexts
        apiContext.setToken(null);
        apiContext.setOrg(null);
        apiContext.setBranch(null);

        // Reset persistent app context
        useAppStore.setState({
          selectedOrgId: null,
          selectedOrgLogo: null,
          selectedBranchId: null,
        });

        // Flush React Query cached requests, and the shell kept between visits
        // (and the per-org module answers kept in localStorage).
        queryClient.clear();
        clearShellCache();
        forgetRememberedModules();

        setOrgAddons([]);
        set({ token: null, user: null, plan: null, addons: [] });
      },
      setUser: (user) => set({ user }),
    }),
    {
      name: LS_KEYS.auth,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ user: s.user, token: s.token, plan: s.plan, addons: s.addons }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) apiContext.setToken(state.token);
        setOrgAddons(state?.addons ?? []);
        state?.hasHydrated !== undefined &&
          useAuthStore.setState({ hasHydrated: true });
      },
    },
  ),
);

function forgetRememberedModules() {
  try {
    for (let i = safeStorage.length - 1; i >= 0; i--) {
      const k = safeStorage.key(i);
      if (k?.startsWith(MODULES_KEY_PREFIX)) safeStorage.removeItem(k);
    }
  } catch {
    /* storage is a convenience */
  }
}

// Wire the 401 handler so the axios interceptor can purge auth cleanly.
// Idempotent within a teardown: when several in-flight requests 401 at once we
// must signOut + redirect exactly once. Re-running queryClient.clear() and
// re-assigning window.location.href per request can cancel an already-initiated
// navigation (notably in the Tauri webview), stranding the user on a cleared,
// data-less shell. The flag resets naturally on the next full page load.
let tearingDown = false;
apiContext.setOnUnauthorized(() => {
  if (tearingDown) return;
  tearingDown = true;
  useAuthStore.getState().signOut();
  // Bounce to login (preserving where we were) unless we're already there.
  if (!window.location.pathname.startsWith("/login")) {
    const here = window.location.pathname + window.location.search;
    window.location.href = `/login?redirect=${encodeURIComponent(here)}`;
  }
});

// Synchronously keep apiContext headers in sync with Zustand stores
const updateApiContext = () => {
  const authState = useAuthStore.getState();
  const appState = useAppStore.getState();

  const user = authState.user;
  const role = user?.role;
  const isSuperAdmin = role === "super_admin";

  const orgId = isSuperAdmin ? appState.selectedOrgId : (user?.org_id ?? null);
  const branchId =
    role === "branch_manager" || role === "teller"
      ? (user?.branch_id ?? appState.selectedBranchId)
      : appState.selectedBranchId;

  apiContext.setToken(authState.token);
  apiContext.setOrg(orgId);
  apiContext.setBranch(branchId);
};

// Subscribe to store updates
useAuthStore.subscribe(updateApiContext);
useAppStore.subscribe(updateApiContext);

// Run initially to boot up
updateApiContext();
