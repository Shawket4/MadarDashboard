import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import { toast } from "sonner";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { loginSchema, type LoginValues } from "@/entities/auth/schemas";
import { useLogin } from "@/shared/api/generated/api";
import { useAuthStore } from "@/shared/auth/store";
import { getErrorMessage } from "@/shared/api/errors";
import { ThemeToggle } from "@/widgets/theme-toggle/theme-toggle";
import { LanguageToggle } from "@/widgets/language-toggle/language-toggle";

export default function Login() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);
  const [showPw, setShowPw] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const { mutate, isPending } = useLogin({
    mutation: {
      onSuccess: (data) => {
        signIn(data.token, data.user);
        navigate("/", { replace: true });
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    }
  });

  return (
    <div className="min-h-screen flex bg-background">
      {/* Brand panel — flat cream */}
      <aside className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-[#FAF7F2]">
        <div className="flex flex-col justify-between w-full px-14 xl:px-20 py-14">
          {isAr ? (
            <img
              src="/sufrix_ar.svg"
              alt={t("app.name")}
              className="h-10 w-auto select-none self-start"
              draggable={false}
            />
          ) : (
            <svg
              viewBox="0 0 341.28 65.62"
              className="h-10 w-auto select-none self-start"
            >
              <g id="Layer_1-2" data-name="Layer 1">
                <path className="fill-[#0A2540]" d="M27.39,23.17l14.77-14.77c1.08-1.08,2.57-1.75,4.21-1.75,3.29,0,5.96,2.67,5.96,5.95,0,1.64-.67,3.14-1.75,4.21l-14.77,14.77c-.55-4.39-4.03-7.87-8.41-8.41ZM10.16,8.4l14.77,14.77c-4.39.55-7.86,4.03-8.41,8.41L1.75,16.81c-1.08-1.07-1.75-2.56-1.75-4.21,0-3.29,2.67-5.95,5.95-5.95,1.64,0,3.14.67,4.21,1.75ZM35.8,34.04l14.77,14.77c1.08,1.07,1.75,2.57,1.75,4.21,0,3.28-2.66,5.96-5.96,5.96-1.64,0-3.13-.67-4.21-1.75l-14.77-14.77c4.39-.55,7.87-4.03,8.41-8.41ZM24.93,42.46l-14.75,14.76h-.02c-1.07,1.09-2.56,1.76-4.21,1.76-3.29,0-5.95-2.67-5.95-5.96,0-1.64.67-3.13,1.75-4.21l14.77-14.77c.55,4.39,4.03,7.87,8.41,8.41Z"/>
                <circle className="fill-[#C25B3F]" cx="26.16" cy="32.81" r="5.75"/>
                <path className="fill-[#0A2540]" d="M126.55,65.62c-4.52,0-8.6-.78-12.23-2.34-3.63-1.56-6.62-3.79-8.97-6.7-2.35-2.9-3.88-6.35-4.57-10.34l9.54-1.45c.96,3.85,2.97,6.85,6.04,8.99,3.06,2.15,6.63,3.22,10.72,3.22,2.54,0,4.87-.4,7-1.21,2.13-.8,3.84-1.95,5.14-3.45,1.29-1.5,1.94-3.31,1.94-5.41,0-1.14-.2-2.14-.59-3.02-.39-.88-.93-1.64-1.62-2.3-.68-.66-1.52-1.22-2.5-1.7-.98-.48-2.05-.89-3.22-1.25l-16.14-4.77c-1.58-.47-3.18-1.08-4.82-1.82-1.63-.74-3.12-1.72-4.48-2.93-1.36-1.21-2.46-2.72-3.3-4.51-.84-1.8-1.27-3.98-1.27-6.54,0-3.88,1-7.16,3-9.86,2-2.7,4.7-4.74,8.11-6.13C117.76.73,121.58.04,125.81.04c4.25.06,8.07.82,11.44,2.27,3.37,1.46,6.17,3.55,8.4,6.28,2.23,2.73,3.77,6.04,4.62,9.91l-9.8,1.66c-.44-2.36-1.37-4.4-2.8-6.1-1.43-1.71-3.18-3.02-5.25-3.94-2.07-.92-4.32-1.39-6.74-1.42-2.33-.06-4.46.29-6.41,1.05-1.94.76-3.48,1.82-4.64,3.19-1.15,1.37-1.73,2.94-1.73,4.73s.51,3.16,1.53,4.25c1.02,1.07,2.28,1.93,3.79,2.56,1.5.62,2.99,1.14,4.48,1.55l11.63,3.28c1.46.41,3.11.96,4.96,1.64,1.86.69,3.65,1.64,5.38,2.87,1.73,1.23,3.17,2.85,4.3,4.88,1.14,2.02,1.71,4.57,1.71,7.62s-.64,5.98-1.93,8.39c-1.28,2.41-3.04,4.42-5.27,6.04-2.23,1.61-4.8,2.83-7.72,3.65-2.92.81-6,1.22-9.23,1.22Z"/>
                <path className="fill-[#0A2540]" d="M192.92,64.31v-13.65h-1.09V17.06h9.23v47.25h-8.14ZM177.3,65.58c-3.27,0-6.01-.52-8.23-1.57-2.21-1.05-4.02-2.43-5.4-4.13-1.39-1.7-2.45-3.57-3.17-5.58-.73-2.01-1.23-3.98-1.49-5.91-.26-1.92-.39-3.62-.39-5.07v-26.25h9.27v23.23c0,1.84.15,3.72.46,5.66.3,1.94.89,3.74,1.75,5.4.86,1.66,2.07,3.01,3.63,4.03,1.56,1.02,3.6,1.53,6.11,1.53,1.64,0,3.18-.27,4.64-.81,1.46-.54,2.74-1.41,3.83-2.6,1.09-1.2,1.95-2.77,2.58-4.73.62-1.95.94-4.33.94-7.13l5.69,2.15c0,4.29-.8,8.07-2.41,11.35-1.6,3.28-3.91,5.84-6.91,7.68-3,1.84-6.63,2.75-10.89,2.75Z"/>
                <path className="fill-[#0A2540]" d="M209.29,24.41v-7.35h28.92v7.35h-28.92ZM217.12,64.31V15.39c0-1.19.04-2.47.12-3.82.09-1.36.35-2.7.77-4.03.42-1.32,1.12-2.54,2.12-3.65,1.2-1.31,2.51-2.24,3.94-2.8,1.43-.56,2.85-.88,4.27-.96,1.41-.09,2.72-.13,3.91-.13h5.96v7.52h-5.51c-2.16,0-3.77.54-4.84,1.6-1.06,1.07-1.6,2.58-1.6,4.53v50.66h-9.14Z"/>
                <path className="fill-[#0A2540]" d="M244.68,64.31V17.06h8.14v11.46l-1.14-1.48c.59-1.52,1.34-2.91,2.28-4.18.93-1.27,2.01-2.31,3.23-3.13,1.2-.88,2.53-1.55,4.01-2.03,1.47-.48,2.98-.78,4.53-.88,1.55-.1,3.04-.02,4.46.24v8.57c-1.55-.4-3.26-.52-5.14-.34-1.88.18-3.61.77-5.18,1.79-1.48.96-2.66,2.12-3.52,3.49-.86,1.38-1.48,2.9-1.86,4.58-.38,1.68-.57,3.45-.57,5.32v23.84h-9.23Z"/>
                <rect className="fill-[#0A2540]" x="278.85" y="17.06" width="9.15" height="47.25"/>
                <rect className="fill-[#C25B3F]" x="278.85" y=".43" width="9.15" height="8.89"/>
                <polygon className="fill-[#0A2540]" points="295.34 64.31 313.02 40.42 295.73 17.06 306.58 17.06 318.35 33.29 329.99 17.06 340.84 17.06 323.55 40.42 341.28 64.31 330.38 64.31 318.35 47.55 306.23 64.31 295.34 64.31"/>
              </g>
            </svg>
          )}

          <div className="space-y-4 max-w-md">
            <h1 className="text-[#0A2540] text-4xl xl:text-5xl font-bold tracking-tight leading-tight">
              {t("app.tagline")}
            </h1>
            <p className="text-[#0A2540]/60 text-base leading-relaxed">
              {t("auth.signInSubtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2 text-[#0A2540]/50 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C25B3F]" />
            <span>{t("common.copyright", { year: new Date().getFullYear() })}</span>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:px-6 relative" dir={isAr ? "rtl" : "ltr"}>
        <div className="absolute top-4 end-4 flex items-center gap-1">
          <ThemeToggle />
          <LanguageToggle />
        </div>

        {/* Mobile-only icon mark */}
        <div className="flex lg:hidden mb-10">
          <img
            src="/Icon.svg"
            alt={t("app.name")}
            className="h-14 w-auto select-none"
            draggable={false}
          />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">{t("auth.welcome")}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t("auth.signInSubtitle")}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => mutate({ data: v }))} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.email")}</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" placeholder="you@sufrix.com" {...field} />
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
                    <FormLabel>{t("auth.password")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPw ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((s) => !s)}
                          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showPw ? t("auth.hidePassword") : t("auth.showPassword")}
                        >
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" loading={isPending} className="w-full h-11 text-base">
                <LogIn size={16} /> {t("auth.signIn")}
              </Button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-11 text-base border-navy text-navy hover:bg-navy/5"
                onClick={() => navigate("/landing")}
              >
                {isAr ? "استكشف الميزات" : "Explore features"}
              </Button>
            </form>
          </Form>

          <p className="text-center text-xs text-muted-foreground mt-8">{t("common.copyright", { year: new Date().getFullYear() })}</p>
        </div>
      </main>
    </div>
  );
}