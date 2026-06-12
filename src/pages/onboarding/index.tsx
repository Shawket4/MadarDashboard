import { useCallback, useEffect, useRef } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Skeleton } from "@/shared/ui/skeleton";
import { useCurrentContext } from "@/shared/hooks/use-current-context";
import { usePermissions } from "@/shared/hooks/use-permissions";
import { getErrorMessage } from "@/shared/api/errors";
import { WizardShell } from "./wizard-shell";
import { StepWelcome } from "./step-welcome";
import { StepBranch } from "./step-branch";
import { StepPayments } from "./step-payments";
import { StepMenu } from "./step-menu";
import { StepCosts } from "./step-costs";
import { StepAddons } from "./step-addons";
import { StepTeam } from "./step-team";
import { StepReview } from "./step-review";
import {
  WIZARD_STEPS,
  firstIncompleteRequiredStep,
  hasAnyProgress,
  isWizardStepDone,
  useCompleteOnboardingMutation,
  useInvalidateOnboarding,
  useOnboardingStatus,
} from "./use-onboarding";

const LAST_STEP = WIZARD_STEPS.length - 1;

/** Steps that must be done before Continue unlocks (required backend steps). */
const GATED_STEPS = new Set([1, 2, 3]);

export default function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orgId, isReady } = useCurrentContext();
  const { can, isLoading: permsLoading } = usePermissions();
  const { data: status, isLoading } = useOnboardingStatus(orgId);
  const invalidateOnboarding = useInvalidateOnboarding(orgId);
  const complete = useCompleteOnboardingMutation();

  const [searchParams, setSearchParams] = useSearchParams();
  const current = Math.min(LAST_STEP, Math.max(0, Number(searchParams.get("step") ?? "0") || 0));
  const goTo = useCallback(
    (index: number) => setSearchParams({ step: String(index) }, { replace: false }),
    [setSearchParams],
  );

  // Resume: when landing fresh (no ?step=) on an org with partial data,
  // jump straight to the first incomplete required step
  const resumed = useRef(false);
  useEffect(() => {
    if (resumed.current || !status || searchParams.get("step") !== null) return;
    resumed.current = true;
    if (hasAnyProgress(status)) goTo(firstIncompleteRequiredStep(status));
  }, [status, searchParams, goTo]);

  if (!isReady || isLoading || permsLoading) {
    return (
      <div className="min-h-screen p-8 space-y-4">
        <Skeleton className="h-10 w-2/3 mx-auto" />
        <Skeleton className="h-64 max-w-3xl mx-auto rounded-xl" />
      </div>
    );
  }

  if (!orgId) return <Navigate to="/" replace />;
  // Completed orgs never see the wizard again
  if (status?.completed) return <Navigate to="/" replace />;
  // Only org admins set up the org
  if (!can("orgs", "update")) return <Navigate to="/" replace />;

  const finish = () => {
    // ONLY call complete when the backend says every required step is done
    if (!status?.can_complete) return;
    complete.mutate(
      { id: orgId },
      {
        onSuccess: () => {
          invalidateOnboarding();
          // brief beat for the confetti before landing on the overview
          setTimeout(() => navigate("/", { replace: true }), 1200);
        },
        onError: (e) => {
          // 409 = a required step regressed since the last status read
          invalidateOnboarding();
          toast.error(getErrorMessage(e));
        },
      },
    );
  };

  // Setup is locked: the only way out is completing the required steps.
  // "Skip" is just "finish without the optional steps" and the backend
  // refuses completion (409) unless can_complete is true server-side.
  const skip = () => {
    if (!status?.can_complete) return;
    complete.mutate(
      { id: orgId },
      {
        onSuccess: () => {
          invalidateOnboarding();
          navigate("/", { replace: true });
        },
        onError: (e) => {
          // 409 = a required step regressed since the last status read
          invalidateOnboarding();
          toast.error(getErrorMessage(e));
        },
      },
    );
  };

  const continueDisabled = GATED_STEPS.has(current) && !isWizardStepDone(status, current);

  return (
    <WizardShell
      current={current}
      status={status}
      onNavigate={goTo}
      onBack={() => goTo(Math.max(0, current - 1))}
      onContinue={() => goTo(Math.min(LAST_STEP, current + 1))}
      continueDisabled={continueDisabled}
      continueLabel={
        !GATED_STEPS.has(current) && current > 0 && current < LAST_STEP && !isWizardStepDone(status, current)
          ? t("onboarding.skipStep")
          : undefined
      }
      onSkip={skip}
      skipPending={complete.isPending}
      canSkip={!!status?.can_complete}
    >
      {current === 0 && (
        <StepWelcome
          orgId={orgId}
          status={status}
          onJumpToResume={(step) => goTo(hasAnyProgress(status) ? step : 1)}
        />
      )}
      {current === 1 && <StepBranch orgId={orgId} status={status} onMutated={invalidateOnboarding} />}
      {current === 2 && <StepPayments orgId={orgId} status={status} onMutated={invalidateOnboarding} />}
      {current === 3 && <StepMenu orgId={orgId} onMutated={invalidateOnboarding} />}
      {current === 4 && <StepCosts orgId={orgId} status={status} onMutated={invalidateOnboarding} />}
      {current === 5 && <StepAddons orgId={orgId} onMutated={invalidateOnboarding} />}
      {current === 6 && <StepTeam orgId={orgId} onMutated={invalidateOnboarding} />}
      {current === LAST_STEP && (
        <StepReview
          status={status}
          onFinish={finish}
          finishPending={complete.isPending}
          onNavigate={goTo}
        />
      )}
    </WizardShell>
  );
}
