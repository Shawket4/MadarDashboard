import { useMemo, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useLogin } from "@/data/api/generated/api";
import { useAuthStore } from "@/data/stores/auth.store";
import { signupEnabled } from "@/features/signup/flag";
import { AuthShell } from "./auth-shell";
import { getErrorMessage } from "@/data/api/errors";
import { isAxiosError } from "axios";

type LoginValues = { email: string; password: string };

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string };
  const signIn = useAuthStore((s) => s.signIn);
  const [showPw, setShowPw] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().min(1, t("common.requiredField", "This field is required")).email(
          t("auth.errors.invalidEmail", "Enter a valid email"),
        ),
        password: z.string().min(1, t("common.requiredField", "This field is required")),
      }),
    [t],
  );

  const form = useForm<z.input<typeof schema>, unknown, LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const { mutate, isPending } = useLogin({
    mutation: {
      onSuccess: (data) => {
        signIn(data.token, data.user, data.plan);
        navigate({ to: search.redirect ?? "/" });
      },
      // A refused sign-in is wrong credentials (not an expired session), in
      // the reader's language: the server's sentence is English.
      onError: (e) =>
        toast.error(isAxiosError(e) && e.response?.status === 401 ? t("auth.errors.invalid") : getErrorMessage(e)),
    },
  });

  return (
    <AuthShell
      title={t("auth.welcome", "Welcome back")}
      subtitle={t("auth.signInSubtitle", "Sign in to your account to continue")}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => mutate({ data: v }))} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.email", "Email address")}</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder={t("auth.emailPlaceholder", "you@madar.com")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.password", "Password")}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPw ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="pe-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute end-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none"
                      aria-label={showPw ? t("auth.hidePassword", "Hide password") : t("auth.showPassword", "Show password")}
                    >
                      {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" loading={isPending} className="h-11 w-full text-base">
            <LogIn className="size-4 rtl:-scale-x-100" />
            {t("auth.signIn", "Sign in")}
          </Button>
        </form>
      </Form>

      {signupEnabled() ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("signup.noAccount", "No account?")}{" "}
          <Link to="/signup" className="font-medium text-foreground underline underline-offset-4">
            {t("signup.signUpFree", "Sign up free")}
          </Link>
        </p>
      ) : null}
    </AuthShell>
  );
}
