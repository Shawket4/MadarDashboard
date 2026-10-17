import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AuthShell } from "@/features/auth/auth-shell";

import { CompactValue, SignupPanelCopy, SignupPanelFooter } from "./value-panel";

/**
 * Sign-up's frame: sign-in's (AuthShell), with the free plan in the brand
 * panel and the showcase above the form at every width. The column is
 * top-anchored, so a taller step grows the page downward and nothing above it
 * moves. On a phone the compact plan card follows the form.
 */
export function SignupShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <AuthShell
      panel={<SignupPanelCopy />}
      panelFooter={<SignupPanelFooter />}
      showcase="above"
      align="top"
      crossLink={
        <>
          {t("signup.haveAccount", "Already have an account?")}{" "}
          <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
            {t("auth.signIn", "Sign in")}
          </Link>
        </>
      }
    >
      {children}
      <CompactValue />
    </AuthShell>
  );
}
