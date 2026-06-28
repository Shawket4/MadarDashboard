import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { PublicOrderingPage } from "@/features/public-ordering/public-ordering-page";

// Public, unauthenticated customer ordering flow.
// Deep-link forms:
//   /order/<orgId>                              — org-level, customer picks branch
//   /order/<orgId>?branch=<id>                  — branch pre-selected
//   /order/<orgId>?branch=<id>&channel=in_mall&place_name=…&floor=…&unit_number=…
//                                               — in-mall QR: channel + location pre-filled
//   /order/<orgId>?branch=<id>&preview=1        — browse the menu read-only (e.g. when closed)
// No beforeLoad — anyone can reach this; public endpoints carry no auth header.
const searchSchema = z.object({
  branch: z.string().optional(),
  channel: z.string().optional(),
  // Browse-only menu preview. Accept a boolean (internal navigation) or "1"/"true"
  // (deep links); normalize to `true | undefined` so the URL stays clean when off.
  preview: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => (v === true || v === "1" || v === "true" ? true : undefined)),
  place_name: z.string().optional(),
  floor: z.coerce.string().optional(),
  unit_number: z.coerce.string().optional(),
});

export const Route = createFileRoute("/order/$orgId")({
  validateSearch: searchSchema,
  component: function PublicOrderingRoute() {
    const { orgId } = Route.useParams();
    const { branch, channel, preview, place_name, floor, unit_number } = Route.useSearch();
    return (
      <PublicOrderingPage
        orgId={orgId}
        branch={branch}
        channel={channel}
        preview={preview}
        prefillPlaceName={place_name}
        prefillFloor={floor}
        prefillUnitNumber={unit_number}
      />
    );
  },
});
