import { useMemo, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Activity, Building2, Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";
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
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { useLogin } from "@/data/api/generated/api";
import { useAuthStore } from "@/data/stores/auth.store";
import { getErrorMessage } from "@/data/api/errors";
import { fadeInUp, riseIn, staggerContainer } from "@/lib/motion";

type LoginValues = { email: string; password: string };

const FEATURES = [
  { icon: Activity, key: "realtime", descKey: "realtimeDesc" },
  { icon: ShieldCheck, key: "rbac", descKey: "rbacDesc" },
  { icon: Building2, key: "multi", descKey: "multiDesc" },
] as const;

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
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
        signIn(data.token, data.user);
        navigate({ to: search.redirect ?? "/" });
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    },
  });

  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-svh bg-background">
      {/* Brand panel */}
      <aside className="relative hidden w-1/2 overflow-hidden bg-primary text-primary-foreground dark:brand-panel lg:flex xl:w-[55%]">
        <div className="pointer-events-none absolute -end-24 -top-24 size-96 rounded-full bg-brand/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -start-16 size-96 rounded-full bg-brand/20 blur-3xl" />
        <motion.div
          initial="hidden"
          animate="show"
          variants={staggerContainer(0.14, 0.05)}
          className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16"
        >
          <motion.div variants={riseIn} className="flex items-center gap-3">
            <img src="/Icon.svg" alt="" className="size-11 rounded-xl" draggable={false} />
            <div className="leading-tight">
              <p className="text-xl font-semibold">{t("app.name", "Madar")}</p>
              <p className="text-sm text-primary-foreground/60">{t("app.tagline", "Coffee Shop Management")}</p>
            </div>
          </motion.div>

          <motion.div variants={riseIn} className="max-w-md space-y-4">
            <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              {t("auth.welcome", "Welcome back")}
            </h1>
            <p className="text-base text-primary-foreground/70">
              {t("auth.signInSubtitle", "Sign in to your account to continue")}
            </p>
            <ul className="space-y-3 pt-4">
              {FEATURES.map(({ icon: Icon, key, descKey }) => (
                <li key={key} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="font-medium">{t(`auth.features.${key}`, key)}</p>
                    <p className="text-sm text-primary-foreground/60">{t(`auth.features.${descKey}`, "")}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.p variants={riseIn} className="text-xs text-primary-foreground/50">
            {t("common.copyright", { year, defaultValue: `© ${year} Madar` })}
          </motion.p>
        </motion.div>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="absolute end-4 top-4 flex items-center gap-1">
          <ThemeToggle />
          <LanguageToggle />
        </div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeInUp}
          className="w-full max-w-sm"
        >
          <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-start">
            <img
              src={isAr ? "/madar_ar.svg" : "/madar.svg"}
              alt={t("app.name", "Madar")}
              className="mb-6 h-9 w-auto select-none dark:brightness-0 dark:invert"
              draggable={false}
            />
            <h2 className="text-2xl font-semibold tracking-tight">{t("auth.welcome", "Welcome back")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("auth.signInSubtitle", "Sign in to your account to continue")}
            </p>
          </div>

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

          <p className="mt-8 text-center text-xs text-muted-foreground">
            {t("common.copyright", { year, defaultValue: `© ${year} Madar` })}
          </p>
        </motion.div>
      </main>
    </div>
  );
}
