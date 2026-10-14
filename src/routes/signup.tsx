import { createFileRoute, redirect } from "@tanstack/react-router";

import { SignupPage } from "@/features/signup/signup-page";
import { useAuthStore } from "@/data/stores/auth.store";

// Public, like /login.
export const Route = createFileRoute("/signup")({
  beforeLoad: () => {
    if (useAuthStore.getState().token) throw redirect({ to: "/" });
  },
  component: SignupPage,
});
