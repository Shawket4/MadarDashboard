/**
 * The owner sets the device up once: email and password (the account made at
 * sign-up), then the branch this browser stamps for. A shop with one branch
 * skips the choice. Tellers sign in with their PIN after that.
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";

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
      setError(getErrorMessage(e));
    }
  };

  if (pick) {
    return (
      <section className="mx-auto w-full max-w-sm space-y-3">
        <h2 className="text-lg font-semibold">{t("rewardsTeller.pickBranch", "Which branch is this device at?")}</h2>
        {pick.branches.map((b) => (
          <Button
            key={b.id}
            variant="outline"
            className="h-12 w-full justify-start"
            onClick={() => onDone({ orgId: pick.orgId, branchId: b.id, branchName: b.name }, pick.owner)}
          >
            {b.name}
          </Button>
        ))}
      </section>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="mx-auto w-full max-w-sm space-y-4" noValidate>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t("rewardsTeller.setupTitle", "Set up this device")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("rewardsTeller.setupHint", "The shop owner signs in once. After that, staff sign in with their PIN.")}
          </p>
        </div>
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>{t("rewardsTeller.email", "Email")}</FormLabel>
            <FormControl><Input type="email" autoComplete="username" dir="ltr" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel>{t("rewardsTeller.password", "Password")}</FormLabel>
            <FormControl><Input type="password" autoComplete="current-password" dir="ltr" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="h-12 w-full" loading={form.formState.isSubmitting}>
          {t("rewardsTeller.signIn", "Sign in")}
        </Button>
      </form>
    </Form>
  );
}
