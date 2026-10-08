import { useMemo, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
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
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { useLogin } from "@/data/api/generated/api";
import { useAuthStore } from "@/data/stores/auth.store";
import { getErrorMessage } from "@/data/api/errors";
import { fadeInUp, riseIn, staggerContainer } from "@/lib/motion";
import { LegalLinks } from "@/components/legal-links";
import { currentYear } from "@shared/dates";
import { MadarWordmark } from "@/components/brand/madar-wordmark";
import { BrandShowcase } from "./brand-showcase";

type LoginValues = { email: string; password: string };

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

  const year = currentYear(i18n.resolvedLanguage ?? i18n.language ?? "en");

  return (
    <div className="flex min-h-svh bg-background">
      {/* Brand panel: the chrome's ink in both themes; the family on its orbit. */}
      <aside className="relative isolate hidden w-1/2 overflow-hidden border-e border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex xl:w-[55%]">
        <motion.div
          initial="hidden"
          animate="show"
          variants={staggerContainer(0.14, 0.05)}
          className="relative flex w-full flex-col justify-between p-12 xl:p-16"
        >
          <motion.div variants={riseIn} className="flex items-center gap-3">
            <img src="/Icon.svg" alt="" className="size-11 rounded-xl ring-1 ring-sidebar-border" draggable={false} />
            <div className="leading-tight">
              <p className="text-xl font-semibold">{t("app.name", "Madar")}</p>
              <p className="text-sm text-sidebar-muted">{t("app.tagline", "Coffee Shop Management")}</p>
            </div>
          </motion.div>

          <motion.div variants={riseIn} className="max-w-md">
            <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-balance xl:text-5xl">
              {t("auth.welcome", "Welcome back")}
            </h1>
            <p className="mt-4 text-base text-sidebar-muted">
              {t("auth.signInSubtitle", "Sign in to your account to continue")}
            </p>
          </motion.div>

          <motion.div variants={riseIn}>
            <BrandShowcase />
          </motion.div>

          <motion.p variants={riseIn} className="text-xs text-sidebar-muted">
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
            <MadarWordmark
              lang={isAr ? "ar" : "en"}
              title={t("app.name", "Madar")}
              className="mb-6 h-9 select-none"
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

          <p className="mt-8 text-center text-xs text-muted-foreground lg:hidden">
            {t("common.copyright", { year, defaultValue: `© ${year} Madar` })}
          </p>
          <LegalLinks className="mt-2 lg:mt-8" />
        </motion.div>
      </main>
    </div>
  );
}
