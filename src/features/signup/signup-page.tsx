/**
 * Free sign-up: phone -> WhatsApp code -> the shop, its owner and a password.
 *
 * The server checks the code only when the shop is made (a code is spent by a
 * signup that succeeds), so step two collects it and step three submits it with
 * the rest. A refused code sends the person back to step two with their details
 * kept; typing the right one creates the shop at once.
 *
 * On success the session is stored exactly as sign-in stores it, and the owner
 * lands in onboarding.
 */
import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trans, useTranslation } from "react-i18next";
import { AlertCircle, ArrowLeft, Coffee, Eye, EyeOff, Loader2, MessageCircle, Pencil, UtensilsCrossed } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LEGAL_URLS, TERMS_VERSION } from "@/config/legal";
import { useSignup, useSignupOtp } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { useAppStore } from "@/data/stores/app.store";
import { useAuthStore } from "@/data/stores/auth.store";
import { formatPhoneDisplay } from "@/lib/phone";
import { cn } from "@/lib/utils";

import { OtpInput } from "./otp-input";
import { PhoneInput } from "./phone-input";
import { SignupShell } from "./signup-shell";
import { SIGNUP_STEPS, StepIndicator, type SignupStep } from "./step-indicator";
import {
  clock,
  passwordStrength,
  SIGNUP_CODE_LENGTH,
  signupPhone,
  signupProblem,
  useCountdown,
  type SignupProblem,
} from "./util";

type Template = "cafe" | "restaurant";

/** What the final request carries from the details form. */
interface ShopValues {
  shop_name: string;
  owner_name: string;
  email: string;
  password: string;
  template: Template;
}
interface FormValues extends ShopValues {
  terms: true;
}

const FIELD = "h-11 rounded-xl text-base md:text-base";
const LINK = "font-medium text-foreground underline underline-offset-4 hover:no-underline";

/** A server refusal told in place, `role=alert`, with an optional way on. */
function Notice({ children, tone = "error", action }: { children: string; tone?: "error" | "info"; action?: React.ReactNode }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-xl border p-3 text-sm",
        tone === "error" ? "border-destructive/30 bg-destructive/5" : "border-info/30 bg-info/5",
      )}
    >
      <AlertCircle aria-hidden className={cn("mt-0.5 size-4 shrink-0", tone === "error" ? "text-destructive" : "text-info")} />
      <div className="min-w-0 space-y-1">
        <p>{children}</p>
        {action}
      </div>
    </div>
  );
}

function SignInInstead({ children }: { children: string }) {
  const { t } = useTranslation();
  return (
    <Notice
      action={
        <Link to="/login" className={cn(LINK, "inline-flex min-h-11 items-center")}>
          {t("signup.signInInstead", "Sign in instead")}
        </Link>
      }
    >
      {children}
    </Notice>
  );
}

export function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);

  const [step, setStep] = useState<SignupStep>("phone");
  /** True once the person has moved between steps: the next step takes focus (the first screen does not, so a phone keyboard doesn't cover it). */
  const [moved, setMoved] = useState(false);
  const [national, setNational] = useState("");
  const [code, setCode] = useState("");
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [problem, setProblem] = useState<SignupProblem | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  /** The details a refused code interrupted, to send again with the right one. */
  const pending = useRef<ShopValues | null>(null);
  const resendIn = useCountdown(resendAt);

  const canonical = signupPhone(national);
  const shown = formatPhoneDisplay(canonical ?? `20${national}`);

  const go = (s: SignupStep) => {
    setStep(s);
    setMoved(true);
    setProblem(null);
    setMessage(null);
  };

  const schema = useMemo(() => {
    const required = t("common.requiredField", "This field is required");
    const tooLong = t("signup.errors.tooLong", "Keep it under 80 characters.");
    return z.object({
      shop_name: z.string().trim().min(2, t("signup.errors.shopName", "Enter your shop's name (at least 2 letters).")).max(80, tooLong),
      owner_name: z.string().trim().min(1, required).max(80, tooLong),
      email: z.string().trim().min(1, required).email(t("auth.errors.invalidEmail", "Enter a valid email")),
      password: z.string().min(8, t("signup.errors.password", "Use at least 8 characters.")),
      template: z.enum(["cafe", "restaurant"]),
      terms: z.literal(true, { error: t("signup.errors.terms", "Accept the terms to continue.") }),
    });
  }, [t]);
  const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { shop_name: "", owner_name: "", email: "", password: "", template: "cafe", terms: false as unknown as true },
  });

  const otp = useSignupOtp({
    mutation: {
      onSuccess: (r) => {
        setCode("");
        setResendAt(Date.now() + Math.max(1, r.resend_after_seconds) * 1000);
        go("code");
      },
      onError: (e) => {
        const p = signupProblem(e);
        // A code went out less than a minute ago: it is on its way, so go on to
        // step two and let the timer say when another may be asked for.
        if (p === "cooldown") {
          setResendAt(Date.now() + 60_000);
          if (step === "phone") go("code");
          setProblem(p);
          setMessage(t("signup.cooldownSent", "A code was sent a moment ago. It should arrive on WhatsApp shortly."));
          return;
        }
        setProblem(p);
        setMessage(p === "phone_taken" ? null : p === "rate" ? t("signup.rateLimited", "Too many attempts just now. Wait a moment and try again.") : getErrorMessage(e));
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
          setMoved(true);
          setProblem(p);
          setMessage(null);
          return;
        }
        setProblem(p);
        setMessage(
          p === "phone_taken" || p === "email_taken" ? null
            : p === "rate" ? t("signup.rateLimited", "Too many attempts just now. Wait a moment and try again.")
            : getErrorMessage(e),
        );
      },
    },
  });

  const sendCode = () => {
    if (!canonical || otp.isPending) return;
    setProblem(null);
    setMessage(null);
    otp.mutate({ data: { phone: canonical } });
  };

  const createShop = (values: ShopValues, withCode: string) => {
    if (!canonical) return;
    pending.current = values;
    setProblem(null);
    setMessage(null);
    signup.mutate({ data: { ...values, phone: canonical, code: withCode, terms_version: TERMS_VERSION } });
  };

  /** The sixth digit: on to the details, or, if they were already given, create the shop. */
  const onCodeComplete = (full: string) => {
    if (full.length !== SIGNUP_CODE_LENGTH) return;
    if (pending.current) createShop(pending.current, full);
    else go("details");
  };

  const heading: Record<SignupStep, { title: string; subtitle: string }> = {
    phone: {
      title: t("signup.phoneTitle", "Create your free account"),
      subtitle: t("signup.phoneSubtitle", "Start with your mobile number. We will send a code to your WhatsApp."),
    },
    code: {
      title: t("signup.codeTitle", "Check your WhatsApp"),
      subtitle: t("signup.codeSubtitle", "Enter the six-digit code we just sent you."),
    },
    details: {
      title: t("signup.detailsTitle", "Set up your shop"),
      subtitle: t("signup.detailsSubtitle", "Nearly there. Tell us about your shop and create your login."),
    },
  };
  const at = SIGNUP_STEPS.indexOf(step);

  return (
    <SignupShell>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
        <StepIndicator step={step} />
        <p className="sr-only" role="status">
          {t("signup.stepOf", { step: at + 1, total: SIGNUP_STEPS.length, defaultValue: "Step {{step}} of {{total}}" })}: {heading[step].title}
        </p>

        <div className="mb-6 mt-7">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-balance">{heading[step].title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground text-pretty">{heading[step].subtitle}</p>
        </div>

        {step === "phone" ? (
          <form
            className="space-y-5"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              sendCode();
            }}
          >
            <div className="space-y-2">
              <label htmlFor="signup-phone" className="text-sm font-medium">
                {t("signup.phone", "Mobile number")}
              </label>
              <PhoneInput
                id="signup-phone"
                value={national}
                autoFocus={moved}
                invalid={problem === "phone_taken"}
                aria-describedby="signup-phone-hint"
                onChange={(v) => { setNational(v); if (problem) { setProblem(null); setMessage(null); } }}
              />
              <p id="signup-phone-hint" className="text-xs text-muted-foreground">
                {t("signup.phoneHint", "We send the code on WhatsApp, and this becomes the owner's contact number.")}
              </p>
            </div>
            {problem === "phone_taken" ? (
              <SignInInstead>{t("errors.codes.SIGNUP_PHONE_TAKEN", "A shop already uses this phone number.")}</SignInInstead>
            ) : null}
            {problem === "limit" ? <Notice>{t("errors.codes.SIGNUP_OTP_LIMIT", "Too many codes for this number. Try again in an hour.")}</Notice> : null}
            {(problem === "rate" || problem === "other") && message ? <Notice>{message}</Notice> : null}
            <Button type="submit" loading={otp.isPending} disabled={!canonical} className="h-12 w-full rounded-xl text-base">
              {otp.isPending ? null : <MessageCircle className="size-4" aria-hidden />}
              {t("signup.sendCode", "Send the code")}
            </Button>
          </form>
        ) : null}

        {step === "code" ? (
          <form
            className="space-y-5"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              onCodeComplete(code);
            }}
          >
            <OtpField
              code={code}
              setCode={(v) => { setCode(v); if (problem === "bad_code") setProblem(null); }}
              onComplete={onCodeComplete}
              invalid={problem === "bad_code"}
              disabled={signup.isPending}
              autoFocus={moved}
              shown={shown}
              onChange={() => go("phone")}
            />
            {problem === "bad_code" ? (
              <Notice>{t("signup.badCode", "That code is wrong or has expired. Check it, or ask for a new one.")}</Notice>
            ) : null}
            {problem === "cooldown" && message ? <Notice tone="info">{message}</Notice> : null}
            {problem === "limit" ? <Notice>{t("errors.codes.SIGNUP_OTP_LIMIT", "Too many codes for this number. Try again in an hour.")}</Notice> : null}
            {(problem === "rate" || problem === "other") && message ? <Notice>{message}</Notice> : null}
            {problem === "phone_taken" ? <SignInInstead>{t("errors.codes.SIGNUP_PHONE_TAKEN", "A shop already uses this phone number.")}</SignInInstead> : null}
            {problem === "email_taken" ? <SignInInstead>{t("errors.codes.SIGNUP_EMAIL_TAKEN", "An account with this email already exists.")}</SignInInstead> : null}

            <Button
              type="submit"
              loading={signup.isPending}
              disabled={code.length !== SIGNUP_CODE_LENGTH}
              className="h-12 w-full rounded-xl text-base"
            >
              {signup.isPending ? t("signup.codeChecking", "Creating your shop…") : t("signup.continue", "Continue")}
            </Button>

            <div className="flex min-h-11 items-center justify-center text-sm">
              <button
                type="button"
                disabled={resendIn > 0 || otp.isPending}
                onClick={sendCode}
                className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 font-medium text-foreground underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:font-normal disabled:text-muted-foreground disabled:no-underline"
              >
                {otp.isPending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
                {resendIn > 0
                  ? t("signup.resendIn", { time: clock(resendIn), defaultValue: "Resend the code in {{time}}" })
                  : t("signup.resend", "Send the code again")}
              </button>
            </div>
            <p className="text-center text-xs text-muted-foreground text-pretty">
              {t("signup.codeNote", "We check the code when you create your shop, so keep this WhatsApp chat handy.")}
            </p>
          </form>
        ) : null}

        {step === "details" ? (
          <DetailsForm
            form={form}
            showPw={showPw}
            toggleShowPw={() => setShowPw((s) => !s)}
            pending={signup.isPending}
            problem={problem}
            message={message}
            focus={moved}
            onBack={() => go("code")}
            onEditPhone={() => go("phone")}
            onSubmit={(v) => createShop(v, code)}
          />
        ) : null}
      </div>
    </SignupShell>
  );
}

/** The code boxes with their sentence: where it went, and the way to change it. */
function OtpField({
  code, setCode, onComplete, invalid, disabled, autoFocus, shown, onChange,
}: {
  code: string;
  setCode: (v: string) => void;
  onComplete: (v: string) => void;
  invalid: boolean;
  disabled: boolean;
  autoFocus: boolean;
  shown: string;
  onChange: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <p id="signup-code-sent" className="min-w-0 text-muted-foreground">
          <Trans
            i18nKey="signup.codeSentTo"
            values={{ phone: shown }}
            defaults="Sent to <ph>{{phone}}</ph>"
            components={{ ph: <bdi dir="ltr" className="font-medium tabular-nums text-foreground" /> }}
          />
        </p>
        <button
          type="button"
          onClick={onChange}
          aria-label={t("signup.changeAria", "Change the phone number")}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-2 font-medium text-foreground underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Pencil aria-hidden className="size-3.5" />
          {t("signup.change", "Change")}
        </button>
      </div>
      <OtpInput
        value={code}
        onChange={setCode}
        onComplete={onComplete}
        invalid={invalid}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-describedby="signup-code-sent"
      />
    </div>
  );
}

function StrengthMeter({ password }: { password: string }) {
  const { t } = useTranslation();
  const level = passwordStrength(password);
  const word = t(`signup.strengthLevels.${level}`, "");
  const tone = level <= 1 ? "bg-destructive" : level === 2 ? "bg-warning" : "bg-success";
  return (
    <div className="space-y-1.5" aria-live="polite">
      <div aria-hidden className="grid grid-cols-4 gap-1.5">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={cn("h-1 rounded-full transition-colors motion-reduce:transition-none", password && level >= n ? tone : "bg-muted")} />
        ))}
      </div>
      <p className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{t("signup.passwordHint", "At least 8 characters. A longer phrase is stronger.")}</span>
        {password ? (
          <span className="shrink-0 font-medium text-foreground">
            <span className="sr-only">{t("signup.strength", "Password strength")}: </span>
            {word}
          </span>
        ) : null}
      </p>
    </div>
  );
}

function DetailsForm({
  form, showPw, toggleShowPw, pending, problem, message, focus, onBack, onEditPhone, onSubmit,
}: {
  form: ReturnType<typeof useForm<{ shop_name: string; owner_name: string; email: string; password: string; template: "cafe" | "restaurant"; terms: true }, unknown, FormValues>>;
  showPw: boolean;
  toggleShowPw: () => void;
  pending: boolean;
  problem: SignupProblem | null;
  message: string | null;
  focus: boolean;
  onBack: () => void;
  onEditPhone: () => void;
  onSubmit: (v: ShopValues) => void;
}) {
  const { t } = useTranslation();
  const password = form.watch("password");

  const templates: { id: Template; icon: typeof Coffee; label: string; hint: string }[] = [
    { id: "cafe", icon: Coffee, label: t("signup.templateCafe", "Café"), hint: t("signup.templateCafeHint", "Counter service, takeaway, drinks and pastries") },
    { id: "restaurant", icon: UtensilsCrossed, label: t("signup.templateRestaurant", "Restaurant"), hint: t("signup.templateRestaurantHint", "Meals, a kitchen and a fuller menu") },
  ];

  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={form.handleSubmit(({ terms: _terms, ...v }) => onSubmit(v))} noValidate>
        {problem === "phone_taken" ? (
          <Notice
            action={
              <span className="flex flex-wrap gap-x-5">
                <Link to="/login" className={cn(LINK, "inline-flex min-h-11 items-center")}>{t("signup.signInInstead", "Sign in instead")}</Link>
                <button type="button" onClick={onEditPhone} className={cn(LINK, "inline-flex min-h-11 items-center")}>{t("signup.change", "Change")}</button>
              </span>
            }
          >
            {t("errors.codes.SIGNUP_PHONE_TAKEN", "A shop already uses this phone number.")}
          </Notice>
        ) : null}
        {(problem === "rate" || problem === "other" || problem === "limit") && message ? <Notice>{message}</Notice> : null}

        <FormField
          control={form.control}
          name="shop_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("signup.shopName", "Shop name")}</FormLabel>
              <FormControl>
                <Input className={FIELD} autoComplete="organization" autoFocus={focus} placeholder={t("signup.shopNamePlaceholder", "e.g. Bean There")} {...field} />
              </FormControl>
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
              <div role="radiogroup" aria-labelledby="signup-template-label" className="grid grid-cols-2 gap-3">
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
                        "flex min-h-28 flex-col items-start gap-1.5 rounded-xl border p-3.5 text-start outline-none transition-[border-color,background-color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none",
                        on ? "border-brand bg-brand/5 ring-1 ring-brand" : "border-input bg-card hover:bg-muted/50",
                      )}
                    >
                      <span className={cn("grid size-8 place-items-center rounded-lg", on ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground")}>
                        <tpl.icon className="size-4" aria-hidden />
                      </span>
                      <span className="text-sm font-semibold">{tpl.label}</span>
                      <span className="text-xs leading-snug text-muted-foreground">{tpl.hint}</span>
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
              <FormControl>
                <Input className={FIELD} autoComplete="name" placeholder={t("signup.ownerNamePlaceholder", "Full name")} {...field} />
              </FormControl>
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
              <FormControl>
                <Input
                  className={FIELD}
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  aria-invalid={problem === "email_taken" || undefined}
                  placeholder={t("auth.emailPlaceholder", "you@madar.com")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              {problem === "email_taken" ? (
                <SignInInstead>{t("errors.codes.SIGNUP_EMAIL_TAKEN", "An account with this email already exists.")}</SignInInstead>
              ) : (
                <p className="text-xs text-muted-foreground">{t("signup.emailHint", "You will sign in with this email.")}</p>
              )}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.password", "Password")}</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input className={cn(FIELD, "pe-12")} type={showPw ? "text" : "password"} autoComplete="new-password" {...field} />
                </FormControl>
                <button
                  type="button"
                  onClick={toggleShowPw}
                  aria-pressed={showPw}
                  className="absolute end-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none"
                  aria-label={showPw ? t("signup.hidePassword", "Hide password") : t("signup.showPassword", "Show password")}
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <FormMessage />
              <StrengthMeter password={password ?? ""} />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start gap-3">
                <FormControl>
                  <Checkbox
                    id="signup-terms"
                    checked={field.value === true}
                    onCheckedChange={(v) => field.onChange(v === true)}
                    className="mt-0.5 size-5"
                  />
                </FormControl>
                <label htmlFor="signup-terms" className="text-sm leading-snug text-muted-foreground">
                  <Trans
                    i18nKey="signup.terms"
                    defaults="I accept the <terms>Terms of Service</terms> and the <privacy>Privacy Policy</privacy>"
                    components={{
                      terms: <a href={LEGAL_URLS.terms} target="_blank" rel="noopener noreferrer" className={LINK} />,
                      privacy: <a href={LEGAL_URLS.privacy} target="_blank" rel="noopener noreferrer" className={LINK} />,
                    }}
                  />
                </label>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" loading={pending} className="h-12 w-full rounded-xl text-base">
          {t("signup.create", "Create my shop")}
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="mx-auto flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <ArrowLeft aria-hidden className="size-3.5 rtl:rotate-180" />
          {t("signup.back", "Back")}
        </button>
      </form>
    </Form>
  );
}
