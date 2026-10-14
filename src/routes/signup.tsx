import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { SignupPage } from "@/features/signup/signup-page";
import { signupOpen } from "@/features/signup/flag";
import { useAuthStore } from "@/data/stores/auth.store";

// Public, like /login. Hidden behind VITE_SIGNUP_ENABLED (features/signup/flag.ts):
// off, a visitor goes to /login unless they hold the preview key.
export const Route = createFileRoute("/signup")({
  validateSearch: z.object({ preview: z.string().optional() }),
  beforeLoad: ({ search }) => {
    if (useAuthStore.getState().token) throw redirect({ to: "/" });
    if (!signupOpen(search.preview)) throw redirect({ to: "/login", search: {} });
  },
  component: SignupPage,
});
