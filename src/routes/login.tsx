import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { LoginPage } from "@/features/auth/login-page";
import { useAuthStore } from "@/data/stores/auth.store";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  beforeLoad: () => {
    if (useAuthStore.getState().token) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});
