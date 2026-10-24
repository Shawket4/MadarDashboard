import { useNavigate, useSearch } from "@tanstack/react-router";
import { Link } from "@/components/app/link";
import { useTranslation } from "react-i18next";

import { AuthShell } from "./auth-shell";
import { LoginForm } from "./login-form";

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string };

  return (
    <AuthShell
      title={t("auth.welcome", "Welcome back")}
      subtitle={t("auth.signInSubtitle", "Sign in to your account to continue")}
      crossLink={
        <>
          {t("signup.noAccount", "No account?")}{" "}
          <Link to="/signup" className="font-medium text-foreground underline underline-offset-4">
            {t("signup.signUpFree", "Sign up free")}
          </Link>
        </>
      }
    >
      <LoginForm onSignedIn={() => navigate({ to: search.redirect ?? "/" })} />
    </AuthShell>
  );
}
