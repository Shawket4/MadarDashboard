import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { PublicOrderingPage } from "@/features/public-ordering/public-ordering-page";

// Public, unauthenticated customer ordering flow.
// Deep-link forms:
//   /order/<orgId>                              — org-level, customer picks branch
//   /order/<orgId>?branch=<id>                  — branch pre-selected
//   /order/<orgId>?branch=<id>&channel=in_mall&place_name=…&floor=…&unit_number=…
//                                               — in-mall QR: channel + location pre-filled
// No beforeLoad — anyone can reach this; public endpoints carry no auth header.
const searchSchema = z.object({
  branch: z.string().optional(),
  channel: z.string().optional(),
  place_name: z.string().optional(),
  floor: z.coerce.string().optional(),
  unit_number: z.coerce.string().optional(),
});

export const Route = createFileRoute("/order/$orgId")({
  validateSearch: searchSchema,
  component: function PublicOrderingRoute() {
    const { orgId } = Route.useParams();
    const { branch, channel, place_name, floor, unit_number } = Route.useSearch();
    return (
      <PublicOrderingPage
        orgId={orgId}
        branch={branch}
        channel={channel}
        prefillPlaceName={place_name}
        prefillFloor={floor}
        prefillUnitNumber={unit_number}
      />
    );
  },
});
