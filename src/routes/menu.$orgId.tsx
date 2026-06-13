import { createFileRoute } from "@tanstack/react-router";
import { PublicMenuPage } from "@/features/public-menu/public-menu-page";

// Public, unauthenticated customer menu (QR deep-link: /menu/<orgId>).
export const Route = createFileRoute("/menu/$orgId")({
  component: function PublicMenuRoute() {
    const { orgId } = Route.useParams();
    return <PublicMenuPage orgId={orgId} />;
  },
});
