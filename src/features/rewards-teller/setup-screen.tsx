/**
 * The owner sets the device up once: email and password (the account made at
 * sign-up), then the branch this browser stamps for. A shop with one branch
 * skips the choice. Tellers sign in with their PIN after that.
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { z } from "zod";

import { ChevronRight, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { listBranches, login } from "@/data/api/generated/api";
import type { Branch } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";

import { type Session, type Setup, saveSession } from "./session";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});
type Values = z.infer<typeof schema>;

export function SetupScreen({ onDone }: { onDone: (setup: Setup, owner: Session) => void }) {
  const { t } = useTranslation();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  const [error, setError] = useState<string | null>(null);
  const [pick, setPick] = useState<{ orgId: string; owner: Session; branches: Branch[] } | null>(null);

  const submit = async (v: Values) => {
    setError(null);
    try {
      const r = await login({ email: v.email, password: v.password });
      const orgId = r.user.org_id;
      if (!orgId) {
        setError(t("rewardsTeller.setupNoShop", "This account has no shop. Sign in with the shop owner's account."));
        return;
      }
      const owner = { token: r.token, name: r.user.name };
      saveSession(owner);
      const branches = (await listBranches({ org_id: orgId })).filter((b) => b.is_active && b.kind === "branch");
      if (branches.length === 1) onDone({ orgId, branchId: branches[0].id, branchName: branches[0].name }, owner);
      else setPick({ orgId, owner, branches });
    } catch (e) {
      saveSession(null);
      // A 401 here is the email or password, not an ended session.
      setError(
        e instanceof AxiosError && e.response?.status === 401
          ? t("rewardsTeller.setupWrong", "Wrong email or password.")
          : getErrorMessage(e),
      );
    }
  };

  if (pick) {
    return (
      <section className="mx-auto w-full max-w-md space-y-5" aria-labelledby="pick-title">
        <div className="space-y-1">
          <h1 id="pick-title" className="text-2xl font-semibold text-balance">
            {t("rewardsTeller.pickBranch", "Which branch is this device at?")}
          </h1>
          <p className="text-base text-muted-foreground">
            {t("rewardsTeller.pickBranchHint", "Stamps from this device count at the branch you pick. You can change it later.")}
          </p>
        </div>
        {pick.branches.length === 0 ? (
          <p role="alert" className="rounded-2xl border p-4 text-base">
            {t("rewardsTeller.noBranches", "This shop has no open branch yet. Add one in the Madar dashboard, then sign in again.")}
          </p>
        ) : (
          <ul className="space-y-3">
            {pick.branches.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  data-press="product"
                  className="flex h-16 w-full items-center gap-3 rounded-2xl border bg-card px-4 text-start text-lg font-semibold shadow-xs outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  onClick={() => onDone({ orgId: pick.orgId, branchId: b.id, branchName: b.name }, pick.owner)}
                >
                  <MapPin className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{b.name}</span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground rtl:rotate-180" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="mx-auto w-full max-w-md space-y-5" noValidate aria-labelledby="setup-title">
        <div className="space-y-2">
          <img src="/tile-ink.svg" alt="" className="mb-5 size-14 dark:hidden" />
          <img src="/tile-paper.svg" alt="" className="mb-5 hidden size-14 dark:block" />
          <h1 id="setup-title" className="text-2xl font-semibold">
            {t("rewardsTeller.setupTitle", "Set up this device")}
          </h1>
          <p className="text-base text-pretty text-muted-foreground">
            {t("rewardsTeller.setupHint", "The shop owner signs in once. After that, staff sign in with their PIN.")}
          </p>
        </div>
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">{t("rewardsTeller.email", "Email")}</FormLabel>
            <FormControl><Input type="email" autoComplete="username" dir="ltr" className="h-14 rounded-2xl px-4 text-lg md:text-lg" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">{t("rewardsTeller.password", "Password")}</FormLabel>
            <FormControl><Input type="password" autoComplete="current-password" dir="ltr" className="h-14 rounded-2xl px-4 text-lg md:text-lg" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        {error ? (
          <p role="alert" className="rounded-2xl border border-[color-mix(in_oklab,var(--color-destructive)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-destructive)_10%,var(--color-card))] p-4 text-base font-medium text-[color-mix(in_oklab,var(--color-destructive)_55%,var(--color-foreground))]">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="h-14 w-full rounded-2xl text-lg" loading={form.formState.isSubmitting}>
          {t("rewardsTeller.signIn", "Sign in")}
        </Button>
      </form>
    </Form>
  );
}
