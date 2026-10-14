/**
 * Free sign-up: phone -> WhatsApp code -> the shop, its owner and a password.
 * The server checks the code only when the shop is made (a code is spent by a
 * signup that succeeds), so step two collects it and step three submits it
 * with the rest; a refused code sends the person back to step two.
 *
 * On success the session is stored exactly as sign-in stores it, and the owner
 * lands in onboarding.
 */
import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft, Coffee, Eye, EyeOff, MessageCircle, UtensilsCrossed } from "lucide-react";
import { z } from "zod";

import { PhoneField } from "@/components/inputs/phone-field";
import { latinDigits } from "@/components/inputs/time";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LEGAL_URLS, TERMS_VERSION } from "@/config/legal";
import { useSignup, useSignupOtp } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { useAppStore } from "@/data/stores/app.store";
import { useAuthStore } from "@/data/stores/auth.store";
import { canonicalPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { AuthShell } from "@/features/auth/auth-shell";

import { SIGNUP_CODE_LENGTH, signupProblem, useCountdown, type SignupProblem } from "./util";

type Step = "phone" | "code" | "details";
type Template = "cafe" | "restaurant";

const digitsOnly = (raw: string) => latinDigits(raw).replace(/\D/g, "").slice(0, SIGNUP_CODE_LENGTH);

/** "Sign in instead": the answer to a phone or email that already has an account. */
function SignInInstead({ children }: { children: string }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
      <p>{children}</p>
      <Link to="/login" className="mt-1 inline-block font-medium underline underline-offset-4">
        {t("signup.signInInstead", "Sign in instead")}
      </Link>
    </div>
  );
}

export function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [problem, setProblem] = useState<SignupProblem | null>(null);
  const [showPw, setShowPw] = useState(false);
  const resendIn = useCountdown(resendAt);

  const canonical = canonicalPhone(phone);

  const otp = useSignupOtp({
    mutation: {
      onSuccess: (r) => {
        setProblem(null);
        setStep("code");
        setCode("");
        setResendAt(Date.now() + Math.max(1, r.resend_after_seconds) * 1000);
      },
      onError: (e) => {
        const p = signupProblem(e);
        // A code went out less than a minute ago: it is on its way, so go on to
        // step two and let the timer say when another may be asked for.
        if (p === "cooldown" && step === "phone") {
          setStep("code");
          setResendAt(Date.now() + 60_000);
        }
        if (p === "cooldown" && step === "code") setResendAt(Date.now() + 60_000);
        setProblem(p);
        if (p !== "phone_taken") toast.error(getErrorMessage(e));
      },
    },
  });

  const signup = useSignup({
    mutation: {
      onSuccess: (r) => {
        signIn(r.token, r.user, r.plan);
        useAppStore.getState().setSelectedBranch(r.branch_id);
        void navigate({ to: "/onboarding" });
      },
      onError: (e) => {
        const p = signupProblem(e);
        if (p === "bad_code") {
          setCode("");
          setStep("code");
        }
        setProblem(p);
        if (p !== "phone_taken" && p !== "email_taken") toast.error(getErrorMessage(e));
      },
    },
  });

  const sendCode = () => {
    if (!canonical) return;
    setProblem(null);
    otp.mutate({ data: { phone: canonical } });
  };

  const heading: Record<Step, { title: string; subtitle: string }> = {
    phone: {
      title: t("signup.title", "Open your shop for free"),
      subtitle: t("signup.subtitle", "Sell with Madar POS on one till, free. No card needed."),
    },
    code: {
      title: t("signup.codeTitle", "Enter the code"),
      subtitle: t("signup.codeSubtitle", "We sent a six-digit code to your WhatsApp."),
    },
    details: {
      title: t("signup.detailsTitle", "Set up your shop"),
      subtitle: t("signup.detailsSubtitle", "Last step: your shop, your account and how you start."),
    },
  };

  return (
    <AuthShell title={heading[step].title} subtitle={heading[step].subtitle}>
      <StepDots step={step} />

      {step === "phone" ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            sendCode();
          }}
        >
          <div className="space-y-2">
            <label htmlFor="signup-phone" className="text-sm font-medium">
              {t("signup.phone", "Your mobile number")}
            </label>
            <PhoneField id="signup-phone" value={phone} onChange={(v) => { setPhone(v); setProblem(null); }} />
            <p className="text-xs text-muted-foreground">
              {t("signup.phoneHint", "We send the code to this number on WhatsApp, and it becomes the owner's contact.")}
            </p>
          </div>
          {problem === "phone_taken" ? (
            <SignInInstead>{t("errors.codes.SIGNUP_PHONE_TAKEN", "A shop already uses this number.")}</SignInInstead>
          ) : null}
          <Button type="submit" loading={otp.isPending} disabled={!canonical} className="h-11 w-full text-base">
            <MessageCircle className="size-4" aria-hidden />
            {t("signup.sendCode", "Send the code")}
          </Button>
        </form>
      ) : null}

      {step === "code" ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length === SIGNUP_CODE_LENGTH) {
              setProblem(null);
              setStep("details");
            }
          }}
        >
          <p className="text-sm text-muted-foreground">
            {t("signup.codeSentTo", "Sent to")}{" "}
            <span dir="ltr" className="font-medium text-foreground">{phone.trim()}</span>
          </p>
          <div className="space-y-2">
            <label htmlFor="signup-code" className="text-sm font-medium">
              {t("signup.code", "Code")}
            </label>
            <Input
              id="signup-code"
              dir="ltr"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={SIGNUP_CODE_LENGTH + 4}
              placeholder="000000"
              className="h-12 text-center text-xl tracking-[0.4em]"
              value={code}
              aria-invalid={problem === "bad_code" || undefined}
              onChange={(e) => { setCode(digitsOnly(e.target.value)); if (problem === "bad_code") setProblem(null); }}
              autoFocus
            />
          </div>
          {problem === "bad_code" ? (
            <p role="alert" className="text-sm text-destructive">
              {t("signup.badCode", "That code is wrong or has expired. Check it, or ask for a new one.")}
            </p>
          ) : null}
          {problem === "rate" || problem === "limit" ? (
            <p role="alert" className="text-sm text-destructive">
              {problem === "limit"
                ? t("errors.codes.SIGNUP_OTP_LIMIT", "Too many codes for this number. Try again later.")
                : t("errors.tooManyRequests")}
            </p>
          ) : null}
          <Button type="submit" disabled={code.length !== SIGNUP_CODE_LENGTH} className="h-11 w-full text-base">
            {t("signup.continue", "Continue")}
          </Button>
          <div className="flex items-center justify-between gap-3 text-sm">
            <button
              type="button"
              onClick={() => { setStep("phone"); setProblem(null); }}
              className="inline-flex items-center gap-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
              {t("signup.changeNumber", "Change the number")}
            </button>
            <button
              type="button"
              disabled={resendIn > 0 || otp.isPending}
              onClick={sendCode}
              className="text-foreground underline underline-offset-4 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
            >
              {resendIn > 0
                ? t("signup.resendIn", { seconds: resendIn, defaultValue: "Send again in {{seconds}} s" })
                : t("signup.resend", "Send the code again")}
            </button>
          </div>
        </form>
      ) : null}

      {step === "details" ? (
        <DetailsForm
          showPw={showPw}
          toggleShowPw={() => setShowPw((s) => !s)}
          pending={signup.isPending}
          problem={problem}
          onSubmit={(v) => {
            setProblem(null);
            signup.mutate({ data: { ...v, phone: canonical ?? phone, code, terms_version: TERMS_VERSION } });
          }}
        />
      ) : null}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("signup.haveAccount", "Already have an account?")}{" "}
        <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
          {t("auth.signIn", "Sign in")}
        </Link>
      </p>
    </AuthShell>
  );
}

function StepDots({ step }: { step: Step }) {
  const { t } = useTranslation();
  const order: Step[] = ["phone", "code", "details"];
  const at = order.indexOf(step);
  return (
    <ol
      aria-label={t("signup.steps", "Sign-up steps")}
      className="mb-6 flex items-center gap-2"
    >
      {order.map((s, i) => (
        <li
          key={s}
          aria-current={i === at ? "step" : undefined}
          className={cn("h-1.5 flex-1 rounded-full bg-muted transition-colors motion-reduce:transition-none", i <= at && "bg-brand")}
        >
          <span className="sr-only">
            {t("signup.stepOf", { step: i + 1, total: order.length, defaultValue: "Step {{step}} of {{total}}" })}
          </span>
        </li>
      ))}
    </ol>
  );
}

interface DetailsValues {
  shop_name: string;
  owner_name: string;
  email: string;
  password: string;
  template: Template;
  terms: true;
}

function DetailsForm({
  showPw,
  toggleShowPw,
  pending,
  problem,
  onSubmit,
}: {
  showPw: boolean;
  toggleShowPw: () => void;
  pending: boolean;
  problem: SignupProblem | null;
  onSubmit: (v: Omit<DetailsValues, "terms">) => void;
}) {
  const { t } = useTranslation();
  const required = t("common.requiredField", "This field is required");
  const schema = useMemo(
    () =>
      z.object({
        shop_name: z.string().trim().min(2, t("signup.errors.shopName", "Enter your shop's name (at least 2 letters).")).max(80, t("signup.errors.tooLong", "Keep it under 80 characters.")),
        owner_name: z.string().trim().min(1, required).max(80, t("signup.errors.tooLong", "Keep it under 80 characters.")),
        email: z.string().trim().min(1, required).email(t("auth.errors.invalidEmail", "Enter a valid email")),
        password: z.string().min(8, t("signup.errors.password", "Use at least 8 characters.")),
        template: z.enum(["cafe", "restaurant"]),
        terms: z.literal(true, { error: t("signup.errors.terms", "Accept the terms to continue.") }),
      }),
    [t, required],
  );
  const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { shop_name: "", owner_name: "", email: "", password: "", template: "cafe", terms: false as unknown as true },
  });

  const templates: { id: Template; icon: typeof Coffee; label: string; hint: string }[] = [
    { id: "cafe", icon: Coffee, label: t("signup.templateCafe", "Café"), hint: t("signup.templateCafeHint", "Counter service, takeaway, drinks and pastries") },
    { id: "restaurant", icon: UtensilsCrossed, label: t("signup.templateRestaurant", "Restaurant"), hint: t("signup.templateRestaurantHint", "Meals, a kitchen and a fuller menu") },
  ];

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(({ terms: _terms, ...v }) => onSubmit(v))}
        noValidate
      >
        <FormField
          control={form.control}
          name="shop_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("signup.shopName", "Shop name")}</FormLabel>
              <FormControl><Input autoComplete="organization" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="template"
          render={({ field }) => (
            <FormItem>
              <FormLabel id="signup-template-label">{t("signup.template", "What kind of place is it?")}</FormLabel>
              <div role="radiogroup" aria-labelledby="signup-template-label" className="grid grid-cols-2 gap-2">
                {templates.map((tpl) => {
                  const on = field.value === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => field.onChange(tpl.id)}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-xl border p-3 text-start outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none",
                        on ? "border-brand bg-brand/5" : "border-border hover:bg-muted/50",
                      )}
                    >
                      <tpl.icon className={cn("size-4", on ? "text-brand" : "text-muted-foreground")} aria-hidden />
                      <span className="text-sm font-medium">{tpl.label}</span>
                      <span className="text-xs text-muted-foreground">{tpl.hint}</span>
                    </button>
                  );
                })}
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="owner_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("signup.ownerName", "Your name")}</FormLabel>
              <FormControl><Input autoComplete="name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.email", "Email address")}</FormLabel>
              <FormControl><Input type="email" autoComplete="email" placeholder={t("auth.emailPlaceholder", "you@madar.com")} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {problem === "email_taken" ? (
          <SignInInstead>{t("errors.codes.SIGNUP_EMAIL_TAKEN", "An account with this email already exists.")}</SignInInstead>
        ) : null}
        {problem === "phone_taken" ? (
          <SignInInstead>{t("errors.codes.SIGNUP_PHONE_TAKEN", "A shop already uses this number.")}</SignInInstead>
        ) : null}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.password", "Password")}</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input type={showPw ? "text" : "password"} autoComplete="new-password" className="pe-10" {...field} />
                </FormControl>
                  <button
                      type="button"
                      onClick={toggleShowPw}
                      className="absolute end-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none"
                      aria-label={showPw ? t("auth.hidePassword", "Hide password") : t("auth.showPassword", "Show password")}
                    >
                      {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start gap-2.5">
                <FormControl>
                  <Checkbox
                    id="signup-terms"
                    checked={field.value === true}
                    onCheckedChange={(v) => field.onChange(v === true)}
                    className="mt-0.5"
                  />
                </FormControl>
                <label htmlFor="signup-terms" className="text-sm leading-snug text-muted-foreground">
                  <Trans
                    i18nKey="signup.terms"
                    defaults="I accept the <terms>Terms of Service</terms> and the <privacy>Privacy Policy</privacy>"
                    components={{
                      terms: <a href={LEGAL_URLS.terms} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline underline-offset-4" />,
                      privacy: <a href={LEGAL_URLS.privacy} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline underline-offset-4" />,
                    }}
                  />
                </label>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" loading={pending} className="h-11 w-full text-base">
          {t("signup.create", "Create my shop")}
        </Button>
      </form>
    </Form>
  );
}
