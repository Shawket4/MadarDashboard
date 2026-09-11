import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Combobox, type ComboboxOption } from "@/components/app/combobox";
import { useListOrgs } from "@/data/api/generated/api";
import { useAppStore } from "@/data/stores/app.store";
import { useAuthStore } from "@/data/stores/auth.store";
import { useScope } from "@/data/scope/use-scope";
import { cn } from "@/lib/utils";

/**
 * Which shop a super admin is looking at.
 *
 * Every other role brings its org in its token. A super admin's carries none —
 * by design, since the whole point of the role is to be able to look at any of
 * them — and the org travels in the `X-Org-Id` header instead, from
 * `app.store`. That plumbing was all in place; nothing ever set it. So a super
 * admin arrived on a dashboard with no org, which meant no branch picker
 * (it lists an org's branches), no branch header, and pages that quietly
 * returned nothing.
 *
 * This is the missing control. Picking here is picking the org for everything:
 * the header on every request, the branch list beside it, and the permissions
 * the backend applies — a super admin scoped to an org is treated as that org's
 * admin, which is what the role is for.
 *
 * Inactive orgs are listed rather than hidden. A super admin is exactly who
 * needs to open one.
 */
export function OrgPicker({ className }: { className?: string }) {
  const { t } = useTranslation();
  const role = useAuthStore((s) => s.user?.role);
  const isSuperAdmin = role === "super_admin";
  const selectedOrgId = useAppStore((s) => s.selectedOrgId);
  const setSelectedOrg = useAppStore((s) => s.setSelectedOrg);
  const { setBranch } = useScope();

  const list = useListOrgs({ query: { enabled: isSuperAdmin } });
  const orgs = useMemo(
    () => [...(list.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [list.data],
  );
  const options = useMemo<ComboboxOption[]>(
    () =>
      orgs.map((o) => ({
        value: o.id,
        label: o.name,
        // The slug is how a shop is named in a URL and in support threads, so
        // it is worth being able to type even though it is not on the chip.
        // A shop with no address of its own has none — search it by name.
        keywords: o.slug ?? undefined,
        hint: o.is_active ? undefined : t("orgs.inactive", "Inactive"),
      })),
    [orgs, t],
  );

  if (!isSuperAdmin) return null;

  return (
    <Combobox
      options={options}
      value={selectedOrgId}
      onChange={(id) => {
        const org = orgs.find((o) => o.id === id);
        setSelectedOrg(id, org?.logo_url ?? null);
        // The store drops the persisted branch when the org changes, but the
        // scope lives in the URL — and a branch id from the previous shop would
        // otherwise ride along into queries against this one.
        setBranch(null);
      }}
      placeholder={t("scope.pickOrg", "Select a shop")}
      searchPlaceholder={t("scope.searchOrgs", "Search shops…")}
      emptyText={t("scope.noOrgs", "No shops found")}
      disabled={list.isLoading}
      className={cn(
        "h-8 w-auto min-w-40 gap-2",
        // Nothing picked is not a neutral state for this control: it is why the
        // rest of the page is empty. Say so rather than looking settled.
        !selectedOrgId && "border-dashed",
        className,
      )}
    />
  );
}
