import { useMemo, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { MadarWordmark } from "@/components/brand/madar-wordmark";
import { LegalLinks } from "@/components/legal-links";
import { useLogin } from "@/data/api/generated/api";
import { useAuthStore } from "@/data/stores/auth.store";
import { getErrorMessage } from "@/data/api/errors";
import { fadeInUp } from "@/lib/motion";

type LoginValues = { email: string; password: string };

/**
 * Sign-in. One quiet surface in both themes: the wordmark and the theme/language
 * toggles on top, the form on a card in the middle, the legal links at the foot.
 * Every colour is a semantic token, so light and dark need no overrides of their own
 * (the old split layout hard-coded a navy panel with blurred gradient glows, and
 * inverted the logo in dark mode, which also whitened its brand "d"). The orbit
 * behind is the brand motif in hairlines: the border colour, one brand dot.
 */
export function LoginPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "ar" ? "ar" : "en";
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string };
  const signIn = useAuthStore((s) => s.signIn);
  const [showPw, setShowPw] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .min(1, t("common.requiredField", "This field is required"))
          .email(t("auth.errors.invalidEmail", "Enter a valid email")),
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
    <div className="relative isolate flex min-h-svh flex-col overflow-hidden bg-background text-foreground">
      <Orbit />

      <header className="flex items-center justify-between px-4 py-4 sm:px-8 sm:py-6">
        <MadarWordmark lang={lang} title={t("app.name", "Madar")} className="h-7" />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <motion.div initial="hidden" animate="show" variants={fadeInUp} className="w-full max-w-sm">
          <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
            <h1 className="text-2xl font-semibold tracking-tight">{t("auth.signInTitle", "Sign in to Madar")}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t("auth.signInSubtitle", "Sign in to your account to continue")}
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => mutate({ data: v }))} className="mt-6 space-y-4" noValidate>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("auth.email", "Email address")}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          inputMode="email"
                          dir="ltr"
                          placeholder={t("auth.emailPlaceholder", "you@madar.com")}
                          className="h-11"
                          {...field}
                        />
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
                            dir="ltr"
                            className="h-11 pe-11"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw((s) => !s)}
                            className="absolute end-0 top-0 flex size-11 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none"
                            aria-label={showPw ? t("auth.hidePassword", "Hide password") : t("auth.showPassword", "Show password")}
                            aria-pressed={showPw}
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
                  {isPending ? t("auth.signingIn", "Signing in…") : t("auth.signIn", "Sign in")}
                </Button>
              </form>
            </Form>
          </div>
        </motion.div>
      </main>

      <footer className="px-4 pb-6 text-center">
        <LegalLinks />
        <p className="mt-2 text-xs text-muted-foreground">
          {t("common.copyright", { year, defaultValue: `© ${year} Madar` })}
        </p>
      </footer>
    </div>
  );
}

/** The brand's orbit in hairlines, off the page's end edge. Decorative. */
function Orbit() {
  return (
    <svg
      viewBox="0 0 800 800"
      aria-hidden="true"
      className="pointer-events-none absolute -end-64 top-1/2 -z-10 size-[56rem] -translate-y-1/2 text-border sm:-end-48"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="400" cy="400" r="130" />
        <circle cx="400" cy="400" r="250" />
        <circle cx="400" cy="400" r="380" />
      </g>
      <circle cx="400" cy="400" r="10" className="fill-border" />
      <circle cx="223" cy="223" r="9" className="fill-brand" />
    </svg>
  );
}
