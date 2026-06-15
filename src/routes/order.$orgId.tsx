import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { PublicOrderingPage } from "@/features/public-ordering/public-ordering-page";

// Public, unauthenticated customer ordering flow (deep-link: /order/<orgId>?branch=&channel=).
// No beforeLoad — anyone can reach this; public endpoints carry no auth header.
const searchSchema = z.object({
  branch: z.string().optional(),
  channel: z.string().optional(),
});

export const Route = createFileRoute("/order/$orgId")({
  validateSearch: searchSchema,
  component: function PublicOrderingRoute() {
    const { orgId } = Route.useParams();
    const { branch, channel } = Route.useSearch();
    return <PublicOrderingPage orgId={orgId} branch={branch} channel={channel} />;
  },
});
