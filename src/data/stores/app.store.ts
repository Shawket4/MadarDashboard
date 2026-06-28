import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { apiContext } from "@/data/api/client";
import { APP_TZ, LS_KEYS } from "@/data/config/constants";
import i18n from "@/i18n";

type Language = "en" | "ar";

interface AppState {
  selectedOrgId: string | null;
  selectedOrgLogo: string | null;
  selectedBranchId: string | null;
  /** Last-used period preset — restored into the URL on a bare visit. */
  scopePreset: string;
  language: Language;
  sidebarCollapsed: boolean;
  /**
   * Effective IANA timezone for the current scope, resolved as
   * branch.timezone → org.timezone → APP_TZ by `useSyncTimezone`. Every date
   * formatter reads this (never the device timezone), so times are shown in the
   * branch/org's configured zone regardless of where the dashboard runs.
   * Persisted so a reload formats in the right zone before data re-loads.
   */
  activeTimezone: string;
  setSelectedOrg: (id: string | null, logoUrl?: string | null) => void;
  setSelectedBranch: (id: string | null) => void;
  setScopePreset: (preset: string) => void;
  setLanguage: (lang: Language) => void;
  setActiveTimezone: (tz: string) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedOrgId: null,
      selectedOrgLogo: null,
      selectedBranchId: null,
      scopePreset: "30d",
      language: "en",
      sidebarCollapsed: false,
      activeTimezone: APP_TZ,
      setSelectedOrg: (id, logoUrl) =>
        set((s) => {
          apiContext.setOrg(id);
          // A different org means the persisted branch no longer belongs here.
          // Drop it (-> "all branches") so scoped queries don't fire against a
          // foreign branch id and 403/404 into a stuck, data-less state.
          const orgChanged = s.selectedOrgId !== id;
          if (orgChanged) apiContext.setBranch(null);
          return {
            selectedOrgId: id,
            selectedOrgLogo: logoUrl ?? null,
            ...(orgChanged ? { selectedBranchId: null } : {}),
          };
        }),
      setSelectedBranch: (id) => {
        apiContext.setBranch(id);
        set({ selectedBranchId: id });
      },
      setScopePreset: (preset) => set({ scopePreset: preset }),
      setActiveTimezone: (tz) => set({ activeTimezone: tz }),
      setLanguage: (lang) => {
        void i18n.changeLanguage(lang);
        set({ language: lang });
      },
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (c) => set({ sidebarCollapsed: c }),
    }),
    {
      name: LS_KEYS.app,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        selectedOrgId: s.selectedOrgId,
        selectedOrgLogo: s.selectedOrgLogo,
        selectedBranchId: s.selectedBranchId,
        scopePreset: s.scopePreset,
        language: s.language,
        sidebarCollapsed: s.sidebarCollapsed,
        activeTimezone: s.activeTimezone,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.selectedOrgId) apiContext.setOrg(state.selectedOrgId);
        if (state?.selectedBranchId) apiContext.setBranch(state.selectedBranchId);
        if (state?.language) void i18n.changeLanguage(state.language);
      },
    },
  ),
);
