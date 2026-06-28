import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { apiContext } from "@/data/api/client";
import { queryClient } from "@/data/api/query";
import { useAppStore } from "@/data/stores/app.store";
import { LS_KEYS } from "@/data/config/constants";
import type { UserPublic } from "@/data/types";

interface AuthState {
  user: UserPublic | null;
  token: string | null;
  hasHydrated: boolean;
  signIn: (token: string, user: UserPublic) => void;
  signOut: () => void;
  setUser: (user: UserPublic) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hasHydrated: false,
      signIn: (token, user) => {
        apiContext.setToken(token);
        set({ token, user });
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

        // Flush React Query cached requests
        queryClient.clear();

        set({ token: null, user: null });
      },
      setUser: (user) => set({ user }),
    }),
    {
      name: LS_KEYS.auth,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, token: s.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) apiContext.setToken(state.token);
        state?.hasHydrated !== undefined &&
          useAuthStore.setState({ hasHydrated: true });
      },
    },
  ),
);

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
