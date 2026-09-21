import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { HelpCircle, Lock } from "lucide-react";

import { SegmentedControl } from "@/components/app/segmented-control";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  explain,
  getUserAccessQueryKey,
  setAssignments,
  setOverride,
  useListBranches,
  useListRoles,
  useUserAccess,
} from "@/data/api/generated/api";
import type { CapabilityAccess, Explanation, LimitsView, UserAccess, UserPublic } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { queryClient } from "@/data/api/query";
import { useAuthz } from "@/data/authz/use-authz";
import type { CapabilityMeta } from "@/generated/capabilities";

import { AlwaysOn, CapabilityGroups } from "./capability-groups";
import { LimitsButton } from "./limits-button";
import { bilingual, capLabel } from "./catalog";

type Effect = "inherit" | "allow" | "deny";
const ALL = "all";

/** A person's access: their roles and branches, and allow / deny per capability. */
export function PersonAccessSheet({ user, open, onOpenChange }: { user: UserPublic; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const authz = useAuthz();
  const [branch, setBranch] = useState<string>(ALL);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const branchId = branch === ALL ? undefined : branch;

  const q = useUserAccess(user.id, branchId ? { branch_id: branchId } : undefined, { query: { enabled: open } });
  const branchesQ = useListBranches({ org_id: user.org_id ?? "" }, { query: { enabled: open && !!user.org_id } });
  const access = q.data;
  const byKey = useMemo(() => new Map((access?.capabilities ?? []).map((c) => [c.capability, c])), [access]);
  const branchName = (id: string | null | undefined) => branchesQ.data?.find((b) => b.id === id)?.name ?? "—";

  const refresh = () => queryClient.invalidateQueries({ queryKey: getUserAccessQueryKey(user.id) });

  const write = async (meta: CapabilityMeta, effect: Effect, limits?: LimitsView | null) => {
    setBusy(meta.key);
    try {
      await setOverride(user.id, {
        capability: meta.key,
        effect,
        branch_id: branchId ?? null,
        reason: reason.trim() || null,
        limits: limits ?? null,
      });
      await refresh();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const effectOf = (row: CapabilityAccess): Effect => {
    const ov = row.overrides.find((o) => (o.branch_id ?? undefined) === branchId);
    return ov ? (ov.effect as Effect) : "inherit";
  };

  const control = (meta: CapabilityMeta) => {
    const row = byKey.get(meta.key);
    if (!row || !access) return null;
    const why = <WhyButton userId={user.id} capability={meta.key} branchId={branchId} />;
    if (row.source === "core") return <div className="flex items-center gap-2"><AlwaysOn />{why}</div>;
    if (row.source === "owner") {
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("access.owner", "Owner")}</span>
          {why}
        </div>
      );
    }
    const disabled = !access.can_edit || !row.editable || busy === meta.key;
    const inherited = row.from_roles.length > 0;
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <SegmentedControl<Effect>
          value={effectOf(row)}
          onChange={(v) => !disabled && void write(meta, v)}
          options={[
            { value: "inherit", label: inherited ? t("access.inheritOn", "Role: on") : t("access.inheritOff", "Role: off") },
            { value: "allow", label: t("access.allow", "Allow") },
            { value: "deny", label: t("access.deny", "Deny") },
          ]}
        />
        {meta.limits.length > 0 && row.effective ? (
          <LimitsButton meta={meta} value={row.limits ?? null} disabled={disabled} onSave={(l) => void write(meta, "allow", l)} />
        ) : null}
        {why}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{t("access.personTitle", { name: user.name, defaultValue: "{{name}}'s access" })}</SheetTitle>
          <SheetDescription>{t("access.personHint", "Their roles give them a starting point. Allow or deny single things here.")}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          {q.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : !access ? null : (
            <>
              {!access.can_edit ? (
                <p className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                  <Lock className="size-4" aria-hidden />
                  {access.locked_reason ?? t("access.locked", "You can't change this person's access.")}
                </p>
              ) : null}

              <AssignmentsEditor
                userId={user.id}
                access={access}
                branches={branchesQ.data ?? []}
                disabled={!access.can_edit}
                onSaved={() => void refresh()}
                branchName={branchName}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t("access.where", "Where")}</Label>
                  <Select value={branch} onValueChange={setBranch}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>{t("access.allBranches", "All branches")}</SelectItem>
                      {(branchesQ.data ?? []).map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  {/* Optional, and never a blocker: the server accepts an absent or
                      empty reason for every capability (owner, 2026-09-18). */}
                  <Label htmlFor="access-reason">{t("access.reason", "Reason (optional)")}</Label>
                  <Input
                    id="access-reason"
                    data-testid="access-reason"
                    value={reason}
                    maxLength={200}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("access.reasonHint", "Only if you want a note in the history. Nothing here is ever required.")}
                  </p>
                </div>
              </div>

              {authz.ready ? <CapabilityGroups control={control} /> : null}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AssignmentsEditor({
  userId,
  access,
  branches,
  disabled,
  onSaved,
  branchName,
}: {
  userId: string;
  access: UserAccess;
  branches: { id: string; name: string }[];
  disabled: boolean;
  onSaved: () => void;
  branchName: (id: string) => string;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const rolesQ = useListRoles();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, { all: boolean; branches: string[] }>>({});
  const [saving, setSaving] = useState(false);

  const start = () => {
    setDraft(Object.fromEntries(access.assignments.map((a) => [a.role_id, { all: a.all_branches, branches: a.branch_ids }])));
    setEditing(true);
  };
  const save = async () => {
    setSaving(true);
    try {
      await setAssignments(userId, {
        assignments: Object.entries(draft).map(([role_id, v]) => ({ role_id, all_branches: v.all, branch_ids: v.all ? [] : v.branches })),
      });
      setEditing(false);
      onSaved();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
        <h3 className="text-sm font-semibold">{t("access.roles", "Roles")}</h3>
        {!disabled && !editing ? <Button size="sm" variant="outline" onClick={start}>{t("common.edit", "Edit")}</Button> : null}
      </div>
      {!editing ? (
        <ul className="divide-y">
          {access.assignments.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">{t("access.noRolesHeld", "No roles")}</li>
          ) : (
            access.assignments.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                <span className="font-medium">{bilingual(a.role_name_en, a.role_name_ar, lang)}</span>
                <span className="text-muted-foreground">
                  {a.all_branches ? t("access.allBranches", "All branches") : a.branch_ids.map(branchName).join("، ")}
                </span>
              </li>
            ))
          )}
        </ul>
      ) : (
        <div className="space-y-3 p-4">
          {(rolesQ.data ?? []).filter((r) => r.kind !== "org_admin").map((r) => {
            const d = draft[r.id];
            return (
              <div key={r.id} className="space-y-2 rounded-lg border p-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={!!d}
                    onCheckedChange={(v) =>
                      setDraft((prev) => {
                        const next = { ...prev };
                        if (v) next[r.id] = { all: false, branches: [] };
                        else delete next[r.id];
                        return next;
                      })
                    }
                  />
                  {bilingual(r.name_en, r.name_ar, lang)}
                </label>
                {d ? (
                  <div className="flex flex-wrap gap-3 ps-6 text-sm">
                    <label className="flex items-center gap-2">
                      <Checkbox checked={d.all} onCheckedChange={(v) => setDraft((p) => ({ ...p, [r.id]: { ...d, all: !!v } }))} />
                      {t("access.allBranches", "All branches")}
                    </label>
                    {!d.all
                      ? branches.map((b) => (
                          <label key={b.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={d.branches.includes(b.id)}
                              onCheckedChange={(v) =>
                                setDraft((p) => ({
                                  ...p,
                                  [r.id]: { ...d, branches: v ? [...d.branches, b.id] : d.branches.filter((x) => x !== b.id) },
                                }))
                              }
                            />
                            {b.name}
                          </label>
                        ))
                      : null}
                  </div>
                ) : null}
              </div>
            );
          })}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>{t("common.cancel", "Cancel")}</Button>
            <Button size="sm" disabled={saving} onClick={() => void save()}>{t("common.save", "Save")}</Button>
          </div>
        </div>
      )}
    </section>
  );
}

/** "Why?" — the explanation from `/authz/explain`, in the viewer's language. */
function WhyButton({ userId, capability, branchId }: { userId: string; capability: string; branchId?: string }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [data, setData] = useState<Explanation | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setData(await explain({ user_id: userId, capability, ...(branchId ? { branch_id: branchId } : {}) }));
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const stepText = (s: Explanation["steps"][number]) => {
    const role = s.role_name ? bilingual(s.role_name, s.role_name_ar ?? s.role_name, lang) : "";
    switch (s.kind) {
      case "owner": return t("access.whyOwner", "Owner: holds everything");
      case "inactive": return t("access.whyInactive", "The account is switched off");
      case "core": return t("access.whyCore", { role, defaultValue: "{{role}}: always on for this role" });
      case "assignment":
        if (s.applies_here === false) return t("access.whyNotHere", { role, defaultValue: "{{role}}: not at this branch" });
        return s.grants
          ? t("access.whyRoleGrants", { role, defaultValue: "{{role}}: allows it" })
          : t("access.whyRoleNot", { role, defaultValue: "{{role}}: does not allow it" });
      case "override_allow": return t("access.whyAllow", "Allowed for this person");
      case "override_deny": return t("access.whyDeny", "Denied for this person");
      case "protected": return t("access.whyProtected", "An owner can never lose this");
      case "limit": return t("access.whyLimit", "Allowed up to a limit");
      case "ask_manager": return t("access.whyAsk", "Can ask a manager to approve");
      case "not_held": return t("access.whyNotHeld", "Result: not allowed");
      default: return s.kind;
    }
  };

  return (
    <Popover onOpenChange={(o) => o && void load()}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("access.why", "Why?")}>
          <HelpCircle className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        {loading || !data ? (
          <Skeleton className="h-16" />
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-semibold">{capLabel({ en: data.label_en, ar: data.label_ar }, lang)}</p>
            <p className="text-xs font-medium">
              {data.effective ? t("access.resultAllowed", "Allowed") : t("access.resultNotAllowed", "Not allowed")}
            </p>
            <ul className="list-disc space-y-1 ps-4 text-xs text-muted-foreground">
              {data.steps.map((s, i) => <li key={i}>{stepText(s)}</li>)}
            </ul>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
