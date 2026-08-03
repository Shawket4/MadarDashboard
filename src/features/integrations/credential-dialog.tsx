import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { AxiosError } from "axios";
import { z } from "zod";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { createCredential, useListBranches } from "@/data/api/generated/api";
import type { CredentialWithSecret } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { buildUsername, invalidateCredentials, randomUsernameSuffix } from "./util";
import { hasSecureRandom } from "./passphrase";

interface Props {
  orgId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Hands the one-time secret up so the page can build the handoff. */
  onIssued: (c: CredentialWithSecret) => void;
}

export function CredentialDialog({ orgId, open, onOpenChange, onIssued }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const branchesQuery = useListBranches({ org_id: orgId }, { query: { enabled: open && !!orgId } });
  const branches = useMemo(
    () => (branchesQuery.data ?? []).filter((b) => b.is_active),
    [branchesQuery.data],
  );

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t("common.requiredField", "This field is required")).max(120),
        branch_id: z.string().uuid(t("integrations.branchRequired", "Choose a branch")),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", branch_id: "" },
  });

  // The username is generated, never typed, so it lives outside the form. Only
  // the random suffix is state — the readable prefix is derived from the label,
  // which means typing re-slugs the prefix without churning the suffix, and
  // "regenerate" stays a distinct, deliberate action.
  const [suffix, setSuffix] = useState(randomUsernameSuffix);
  const label = form.watch("name");
  const username = buildUsername(label, suffix);

  useEffect(() => {
    if (open) {
      form.reset({ name: "", branch_id: "" });
      setSuffix(randomUsernameSuffix());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (v: Values) => {
    // Refuse before creating anything: a credential we cannot hand off is worse
    // than no credential, because it exists server-side with a lost password.
    if (!hasSecureRandom()) {
      toast.error(
        t(
          "integrations.handoff.noSecureRandom",
          "This browser cannot generate a secure password. Open the dashboard over HTTPS and try again.",
        ),
      );
      return;
    }

    setBusy(true);
    try {
      let attempt = username;
      for (let tries = 0; ; tries += 1) {
        try {
          const created = await createCredential({ name: v.name, branch_id: v.branch_id, username: attempt });
          void invalidateCredentials();
          onOpenChange(false);
          onIssued(created);
          return;
        } catch (e) {
          // The suffix is random, so a 409 means an astronomically unlikely
          // collision — regenerate and retry once rather than making the
          // operator resolve a name they never chose.
          const conflict = e instanceof AxiosError && e.response?.status === 409;
          if (!conflict || tries >= 1) throw e;
          const next = randomUsernameSuffix();
          setSuffix(next);
          attempt = buildUsername(v.name, next);
        }
      }
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t("integrations.newTitle", "New integration credential")}</DialogTitle>
          <DialogDescription>
            {t("integrations.newHint", "Grants a partner read-only access to one branch's order analytics.")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("integrations.label", "Label")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("integrations.labelPlaceholder", "Rue — One Ninety")} />
                  </FormControl>
                  <FormDescription>{t("integrations.labelHint", "Who this credential is for. Only you see it.")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="branch_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("integrations.branch", "Branch")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("integrations.branchPlaceholder", "Select a branch")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("integrations.branchHint", "The only branch this partner can read. It cannot be changed later — issue a second credential for another branch.")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>{t("integrations.username", "Username")}</FormLabel>
              <div className="flex items-center gap-2">
                <Input value={username} readOnly dir="ltr" className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setSuffix(randomUsernameSuffix())}
                  aria-label={t("integrations.regenerate", "Regenerate")}
                >
                  <RefreshCw className="size-4" />
                </Button>
              </div>
              <FormDescription>
                {t("integrations.usernameHint", "Generated for you. The password is generated too and goes straight into an encrypted file — it is never shown on screen.")}
              </FormDescription>
            </FormItem>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button type="submit" disabled={busy}>{t("integrations.issue", "Issue credential")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
