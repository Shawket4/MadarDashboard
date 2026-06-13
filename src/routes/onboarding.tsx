import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth-guard";
import { OnboardingPage } from "@/features/onboarding/onboarding-page";

// Authenticated but full-screen (outside the app shell): guided setup checklist.
export const Route = createFileRoute("/onboarding")({
  beforeLoad: ({ location }) => requireAuth(location.href),
  component: OnboardingPage,
});
