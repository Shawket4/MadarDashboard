/**
 * Orval input transformer that repairs two collisions in the backend spec
 * (utoipa registers by bare Rust type name, so same-named types in different
 * modules silently overwrite each other):
 *
 * 1. operationIds `list_transfers` / `create_transfer` are used by BOTH the
 *    floor-transfer and inventory-transfer families; orval drops one side of
 *    an operationId collision, which erased the floor-transfer client.
 *    → rename the floor pair.
 *
 * 2. The schema name `CreateTransferRequest` is used by both
 *    `held_orders::CreateTransferRequest` (floor) and
 *    `inventory::CreateTransferRequest`; the floor shape won, so
 *    `POST /inventory/transfers` misdocuments its body.
 *    → re-inject the real inventory shape as `CreateInventoryTransferRequest`
 *      and point the inventory endpoint at it.
 */

type Operation = { operationId?: string; requestBody?: { content?: Record<string, { schema?: unknown }> } };
type SpecLike = {
  paths?: Record<string, Record<string, Operation | undefined>>;
  components?: { schemas?: Record<string, unknown> };
};

const OPERATION_RENAMES: Record<string, Record<string, string>> = {
  "/floor/transfers": {
    get: "list_floor_transfers",
    post: "create_floor_transfer",
  },
};

/** Mirrors `inventory::CreateTransferRequest` in the backend. */
const INVENTORY_CREATE_TRANSFER_SCHEMA = {
  type: "object",
  required: ["source_branch_id", "destination_branch_id", "org_ingredient_id", "quantity"],
  properties: {
    source_branch_id: { type: "string", format: "uuid" },
    destination_branch_id: { type: "string", format: "uuid" },
    org_ingredient_id: { type: "string", format: "uuid" },
    quantity: { type: "number", format: "double" },
    note: { type: ["string", "null"] },
  },
} as const;

export default <T extends SpecLike>(spec: T): T => {
  for (const [path, methods] of Object.entries(OPERATION_RENAMES)) {
    const item = spec.paths?.[path];
    if (!item) continue;
    for (const [method, operationId] of Object.entries(methods)) {
      const op = item[method];
      if (op) op.operationId = operationId;
    }
  }

  const inventoryCreate = spec.paths?.["/inventory/transfers"]?.post;
  const jsonBody = inventoryCreate?.requestBody?.content?.["application/json"];
  if (jsonBody && spec.components?.schemas) {
    spec.components.schemas.CreateInventoryTransferRequest = INVENTORY_CREATE_TRANSFER_SCHEMA;
    jsonBody.schema = { $ref: "#/components/schemas/CreateInventoryTransferRequest" };
  }

  return spec;
};
