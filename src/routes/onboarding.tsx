import { createFileRoute, redirect } from "@tanstack/react-router";

// The old full-screen wizard's address: Setup replaced it (links in old emails, bookmarks).
export const Route = createFileRoute("/onboarding")({
  beforeLoad: () => {
    throw redirect({ to: "/setup", replace: true });
  },
});
