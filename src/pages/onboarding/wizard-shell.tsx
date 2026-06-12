import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import type { OnboardingStatus } from "@/shared/api/generated/models";
import { Stepper } from "./stepper";

/**
 * Full-screen wizard frame — intentionally outside the app shell:
 * no sidebar, no header scope switcher. The footer always carries the
 * "Skip setup →" escape hatch.
 */
export function WizardShell({
  current,
  status,
  onNavigate,
  onBack,
  onContinue,
  continueDisabled,
  continueLabel,
  onSkip,
  skipPending,
  canSkip,
  children,
}: {
  current: number;
  status: OnboardingStatus | undefined;
  onNavigate: (index: number) => void;
  onBack: () => void;
  onContinue: () => void;
  continueDisabled?: boolean;
  continueLabel?: string;
  onSkip: () => void;
  skipPending?: boolean;
  /** Skipping == finishing — only offered once every required step is done. */
  canSkip?: boolean;
  children: ReactNode;
}) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const NextIcon = isRtl ? ArrowLeft : ArrowRight;
  const isFirst = current === 0;
  const isLast = current === 7;

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom">
      <header className="border-b px-4 sm:px-8 py-3 flex items-center justify-between gap-4 shrink-0">
        <span className="font-bold text-primary">Sufrix</span>
        <Stepper current={current} status={status} onNavigate={onNavigate} />
        <span className="w-12 hidden sm:block" />
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">{children}</main>

      <footer className="border-t px-4 sm:px-8 py-3 flex items-center justify-between gap-4 shrink-0">
        <Button type="button" variant="ghost" onClick={onBack} disabled={isFirst} className="gap-1">
          <BackIcon size={15} />
          {t("onboarding.back")}
        </Button>

        {canSkip ? (
          <button
            type="button"
            onClick={onSkip}
            disabled={skipPending}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            {t("onboarding.skipSetup")}
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">{t("onboarding.lockedHint")}</span>
        )}

        {!isLast && (
          <Button type="button" onClick={onContinue} disabled={continueDisabled} className="gap-1">
            {continueLabel ?? t("onboarding.continue")}
            <NextIcon size={15} />
          </Button>
        )}
        {isLast && <span className="w-24" />}
      </footer>
    </div>
  );
}
