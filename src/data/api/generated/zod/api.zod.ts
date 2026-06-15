/* eslint-disable */
// @ts-nocheck
import * as zod from 'zod';


export const ListAddonItemsQueryParams = zod.object({
  "org_id": zod.string().uuid(),
  "addon_type": zod.string().optional(),
  "branch_id": zod.string().uuid().optional().describe('When set, prices are branch-effective (override replaces default_price) and\naddons disabled at this branch are excluded — the per-branch addon list the\nPOS consumes. Omitted → the plain org list (legacy behaviour).')
})

export const ListAddonItemsResponseItem = zod.object({
  "addon_type": zod.string(),
  "created_at": zod.string().datetime({"offset":true}),
  "default_price": zod.number(),
  "id": zod.string().uuid(),
  "ingredients": zod.array(zod.object({
  "ingredient_name": zod.string(),
  "ingredient_unit": zod.string(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "quantity_used": zod.number()
})).optional(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough(),
  "org_id": zod.string().uuid(),
  "primary_ingredient_id": zod.string().uuid().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
})
export const ListAddonItemsResponse = zod.array(ListAddonItemsResponseItem)


export const CreateAddonItemBody = zod.object({
  "addon_type": zod.string(),
  "default_price": zod.number(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough().nullish(),
  "org_id": zod.string().uuid()
})


export const ListAddonCatalogQueryParams = zod.object({
  "org_id": zod.string().uuid(),
  "addon_type": zod.string().optional(),
  "search": zod.string().optional().describe('Case-insensitive filter on the addon name.'),
  "page": zod.number().optional(),
  "per_page": zod.number().optional(),
  "branch_id": zod.string().uuid().optional().describe('Enables the per-branch override filter\/sort (LEFT JOINs the branch\'s overrides).'),
  "overridden": zod.boolean().optional().describe('With `branch_id`: true → only addons overridden at the branch; false → only\nun-overridden; null → all.'),
  "sort": zod.string().optional().describe('`\"overridden\"` → overridden addons first (needs `branch_id`); otherwise by type\/name.')
})

export const ListAddonCatalogResponse = zod.object({
  "data": zod.array(zod.object({
  "addon_type": zod.string(),
  "created_at": zod.string().datetime({"offset":true}),
  "default_price": zod.number(),
  "id": zod.string().uuid(),
  "ingredients": zod.array(zod.object({
  "ingredient_name": zod.string(),
  "ingredient_unit": zod.string(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "quantity_used": zod.number()
})).optional(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough(),
  "org_id": zod.string().uuid(),
  "primary_ingredient_id": zod.string().uuid().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
})),
  "page": zod.number(),
  "per_page": zod.number(),
  "total": zod.number(),
  "total_pages": zod.number()
})


export const DeleteAddonItemParams = zod.object({
  "id": zod.string().uuid().describe('Addon item ID')
})


export const UpdateAddonItemParams = zod.object({
  "id": zod.string().uuid().describe('Addon item ID')
})

export const UpdateAddonItemBody = zod.object({
  "addon_type": zod.string().nullish(),
  "default_price": zod.number().nullish(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string().nullish(),
  "name_translations": zod.object({

}).passthrough().nullish()
})

export const UpdateAddonItemResponse = zod.object({
  "addon_type": zod.string(),
  "created_at": zod.string().datetime({"offset":true}),
  "default_price": zod.number(),
  "id": zod.string().uuid(),
  "ingredients": zod.array(zod.object({
  "ingredient_name": zod.string(),
  "ingredient_unit": zod.string(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "quantity_used": zod.number()
})).optional(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough(),
  "org_id": zod.string().uuid(),
  "primary_ingredient_id": zod.string().uuid().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
})


export const loginBodyPinMin = 4;
export const loginBodyPinMax = 6;


export const loginBodyPinRegExp = new RegExp('^[0-9]{4,6}$');


export const LoginBody = zod.object({
  "branch_id": zod.string().uuid().nullish().describe('Required for PIN login. The org is derived from this branch server-side.'),
  "email": zod.string().email().nullish(),
  "name": zod.string().nullish().describe('Teller\'s display name (required for PIN login, unused otherwise).'),
  "org_id": zod.string().uuid().nullish(),
  "password": zod.string().nullish(),
  "pin": zod.string().min(loginBodyPinMin).max(loginBodyPinMax).regex(loginBodyPinRegExp).nullish()
}).describe('Login is dual-mode:\n\n- \*\*Email + password\*\* (admins, managers, super-admins): supply\n  `email` and `password`. `org_id` is optional — if provided, the\n  user must belong to that org; if omitted, lookup is by email only.\n- \*\*PIN + name\*\* (tellers): supply `name`, `pin`, and \*\*`branch_id`\*\*\n  (required). The teller must be assigned to that branch. `org_id` is\n  derived server-side from the branch — never trusted from the client.')

export const LoginResponse = zod.object({
  "currency_code": zod.string(),
  "tax_rate": zod.number().describe('Org tax rate as a decimal (e.g. 0.14 = 14% VAT); 0.0 when no org. Mirrors\n\/auth\/me so the POS has it immediately after login.'),
  "token": zod.string().describe('JWT to send as `Authorization: Bearer <token>` on subsequent requests.'),
  "user": zod.object({
  "branch_id": zod.string().uuid().nullish(),
  "email": zod.string().nullish(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.string().uuid().nullish(),
  "phone": zod.string().nullish(),
  "role": zod.enum(['super_admin', 'org_admin', 'branch_manager', 'teller'])
})
})


export const MeResponse = zod.object({
  "currency_code": zod.string().describe('Org currency code (e.g. \"EGP\").'),
  "tax_rate": zod.number().describe('Org tax rate as a decimal (e.g. 0.14 = 14% VAT); 0.0 when the user has no\norg. Exposed so the POS can compute a tax-inclusive cart total client-side.'),
  "user": zod.object({
  "branch_id": zod.string().uuid().nullish(),
  "email": zod.string().nullish(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.string().uuid().nullish(),
  "phone": zod.string().nullish(),
  "role": zod.enum(['super_admin', 'org_admin', 'branch_manager', 'teller'])
})
})


export const GetMyPermissionsResponse = zod.object({
  "permissions": zod.array(zod.object({
  "action": zod.string(),
  "granted": zod.boolean(),
  "resource": zod.string()
}))
})


export const ResolveBranchBody = zod.object({
  "latitude": zod.number().describe('Device GPS latitude (WGS-84).'),
  "longitude": zod.number().describe('Device GPS longitude (WGS-84).'),
  "org_id": zod.string().uuid().describe('Organization to search within.')
})

export const ResolveBranchResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string(),
  "distance_meters": zod.number().describe('Straight-line distance from the supplied coordinates to the branch, in metres.')
})


export const ListBranchAddonOverridesQueryParams = zod.object({
  "branch_id": zod.string().uuid()
})

export const ListBranchAddonOverridesResponseItem = zod.object({
  "addon_item_id": zod.string().uuid(),
  "branch_id": zod.string().uuid(),
  "is_available": zod.boolean().describe('False disables the addon at this branch (excluded from the branch addon list).'),
  "price_override": zod.number().nullish().describe('Branch price in piastres; null inherits the org default_price.'),
  "updated_at": zod.string().datetime({"offset":true})
})
export const ListBranchAddonOverridesResponse = zod.array(ListBranchAddonOverridesResponseItem)


export const UpsertBranchAddonOverrideBody = zod.object({
  "addon_item_id": zod.string().uuid(),
  "branch_id": zod.string().uuid(),
  "is_available": zod.boolean().optional(),
  "price_override": zod.number().nullish().describe('Branch price in piastres; null inherits the org default_price.')
})

export const UpsertBranchAddonOverrideResponse = zod.object({
  "addon_item_id": zod.string().uuid(),
  "branch_id": zod.string().uuid(),
  "is_available": zod.boolean().describe('False disables the addon at this branch (excluded from the branch addon list).'),
  "price_override": zod.number().nullish().describe('Branch price in piastres; null inherits the org default_price.'),
  "updated_at": zod.string().datetime({"offset":true})
})


export const DeleteBranchAddonOverrideQueryParams = zod.object({
  "branch_id": zod.string().uuid(),
  "addon_item_id": zod.string().uuid()
})


export const ListBranchMenuOverridesQueryParams = zod.object({
  "branch_id": zod.string().uuid()
})

export const ListBranchMenuOverridesResponseItem = zod.object({
  "branch_id": zod.string().uuid(),
  "is_available": zod.boolean().describe('False disables the item at this branch (excluded from the branch menu).'),
  "menu_item_id": zod.string().uuid(),
  "price_override": zod.number().nullish().describe('Branch price in piastres; null inherits the org catalog base_price.'),
  "sizes": zod.array(zod.object({
  "price_override": zod.number().describe('Branch price for this size in piastres.'),
  "size_label": zod.string()
})).optional().describe('Per-size branch prices for this item (empty when none). Availability is item-level.'),
  "updated_at": zod.string().datetime({"offset":true})
})
export const ListBranchMenuOverridesResponse = zod.array(ListBranchMenuOverridesResponseItem)


export const UpsertBranchMenuOverrideBody = zod.object({
  "branch_id": zod.string().uuid(),
  "is_available": zod.boolean().optional(),
  "menu_item_id": zod.string().uuid(),
  "price_override": zod.number().nullish().describe('Branch price in piastres; null inherits the org catalog base_price.'),
  "sizes": zod.array(zod.object({
  "price_override": zod.number(),
  "size_label": zod.string()
})).nullish().describe('Per-size branch prices. `null`\/omitted → leave existing size overrides untouched;\na list → REPLACE the item\'s size overrides with exactly that set (empty clears them).')
})

export const UpsertBranchMenuOverrideResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "is_available": zod.boolean().describe('False disables the item at this branch (excluded from the branch menu).'),
  "menu_item_id": zod.string().uuid(),
  "price_override": zod.number().nullish().describe('Branch price in piastres; null inherits the org catalog base_price.'),
  "sizes": zod.array(zod.object({
  "price_override": zod.number().describe('Branch price for this size in piastres.'),
  "size_label": zod.string()
})).optional().describe('Per-size branch prices for this item (empty when none). Availability is item-level.'),
  "updated_at": zod.string().datetime({"offset":true})
})


export const DeleteBranchMenuOverrideQueryParams = zod.object({
  "branch_id": zod.string().uuid(),
  "menu_item_id": zod.string().uuid()
})


export const ListBranchesQueryParams = zod.object({
  "org_id": zod.string().uuid().describe('Organization whose branches to list. Must match the caller\'s JWT org.')
})

export const ListBranchesResponseItem = zod.object({
  "address": zod.string().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "geo_radius_meters": zod.number().nullish().describe('Radius in meters within which this branch is considered a match. Defaults to 200.'),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "latitude": zod.number().nullish().describe('WGS-84 latitude for geofenced branch resolution.'),
  "longitude": zod.number().nullish().describe('WGS-84 longitude for geofenced branch resolution.'),
  "name": zod.string(),
  "org_id": zod.string().uuid(),
  "org_logo_url": zod.string().nullish().describe('Convenience field — populated from the parent org\'s `logo_url`.'),
  "phone": zod.string().nullish(),
  "printer_brand": zod.union([zod.null(),zod.enum(['star', 'epson'])]).optional(),
  "printer_ip": zod.string().nullish(),
  "printer_port": zod.number().nullish(),
  "timezone": zod.string().describe('IANA timezone name. Defaults to `Africa\/Cairo`.'),
  "updated_at": zod.string().datetime({"offset":true})
})
export const ListBranchesResponse = zod.array(ListBranchesResponseItem)


export const CreateBranchBody = zod.object({
  "address": zod.string().nullish(),
  "geo_radius_meters": zod.number().nullish().describe('Geofence radius in meters. Defaults to 200.'),
  "latitude": zod.number().nullish(),
  "longitude": zod.number().nullish(),
  "name": zod.string(),
  "org_id": zod.string().uuid(),
  "phone": zod.string().nullish(),
  "printer_brand": zod.union([zod.null(),zod.enum(['star', 'epson'])]).optional(),
  "printer_ip": zod.string().nullish(),
  "printer_port": zod.number().nullish().describe('TCP port for the receipt printer. Defaults to `9100` if absent.'),
  "timezone": zod.string().nullish().describe('IANA timezone name. Defaults to `Africa\/Cairo` if absent.')
})


export const GetBranchParams = zod.object({
  "id": zod.string().uuid().describe('Branch ID')
})

export const GetBranchResponse = zod.object({
  "address": zod.string().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "geo_radius_meters": zod.number().nullish().describe('Radius in meters within which this branch is considered a match. Defaults to 200.'),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "latitude": zod.number().nullish().describe('WGS-84 latitude for geofenced branch resolution.'),
  "longitude": zod.number().nullish().describe('WGS-84 longitude for geofenced branch resolution.'),
  "name": zod.string(),
  "org_id": zod.string().uuid(),
  "org_logo_url": zod.string().nullish().describe('Convenience field — populated from the parent org\'s `logo_url`.'),
  "phone": zod.string().nullish(),
  "printer_brand": zod.union([zod.null(),zod.enum(['star', 'epson'])]).optional(),
  "printer_ip": zod.string().nullish(),
  "printer_port": zod.number().nullish(),
  "timezone": zod.string().describe('IANA timezone name. Defaults to `Africa\/Cairo`.'),
  "updated_at": zod.string().datetime({"offset":true})
})


export const UpdateBranchParams = zod.object({
  "id": zod.string().uuid().describe('Branch ID')
})

export const UpdateBranchBody = zod.object({
  "address": zod.string().nullish(),
  "geo_radius_meters": zod.number().nullish(),
  "is_active": zod.boolean().nullish(),
  "latitude": zod.number().nullish(),
  "longitude": zod.number().nullish(),
  "name": zod.string().nullish(),
  "phone": zod.string().nullish(),
  "printer_brand": zod.union([zod.null(),zod.enum(['star', 'epson'])]).optional(),
  "printer_ip": zod.string().nullish(),
  "printer_port": zod.number().nullish(),
  "timezone": zod.string().nullish()
}).describe('PATCH-style update. Fields fall into three categories:\n\n- \*\*Absent\*\* from JSON → keep existing value.\n- \*\*Present as `null`\*\* (only the `printer_\*` fields) → clear the column.\n- \*\*Present as a value\*\* → set to that value.\n\nOpenAPI cannot express the absent-vs-null distinction cleanly, so all\nfields are documented as optional and nullable. Clients targeting this\nendpoint should send only the fields they want to change.')

export const UpdateBranchResponse = zod.object({
  "address": zod.string().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "geo_radius_meters": zod.number().nullish().describe('Radius in meters within which this branch is considered a match. Defaults to 200.'),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "latitude": zod.number().nullish().describe('WGS-84 latitude for geofenced branch resolution.'),
  "longitude": zod.number().nullish().describe('WGS-84 longitude for geofenced branch resolution.'),
  "name": zod.string(),
  "org_id": zod.string().uuid(),
  "org_logo_url": zod.string().nullish().describe('Convenience field — populated from the parent org\'s `logo_url`.'),
  "phone": zod.string().nullish(),
  "printer_brand": zod.union([zod.null(),zod.enum(['star', 'epson'])]).optional(),
  "printer_ip": zod.string().nullish(),
  "printer_port": zod.number().nullish(),
  "timezone": zod.string().describe('IANA timezone name. Defaults to `Africa\/Cairo`.'),
  "updated_at": zod.string().datetime({"offset":true})
})


export const DeleteBranchParams = zod.object({
  "id": zod.string().uuid().describe('Branch ID')
})


export const ListBundlesQueryParams = zod.object({
  "org_id": zod.string().uuid().optional(),
  "status": zod.enum(['draft', 'active', 'archived']).optional(),
  "branch_id": zod.string().uuid().optional(),
  "search": zod.string().optional(),
  "page": zod.number().optional(),
  "per_page": zod.number().optional(),
  "sort": zod.string().optional().describe('Sort: name_asc | name_desc | price_asc | price_desc | created_asc |\ncreated_desc (default).')
})

export const ListBundlesResponse = zod.object({
  "data": zod.array(zod.object({
  "available_from_date": zod.string().date().nullish(),
  "available_from_time": zod.string().nullish(),
  "available_until_date": zod.string().date().nullish(),
  "available_until_time": zod.string().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "created_by": zod.string().uuid().nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.unknown(),
  "id": zod.string().uuid(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "org_id": zod.string().uuid(),
  "price": zod.number(),
  "status": zod.enum(['draft', 'active', 'archived']),
  "updated_at": zod.string().datetime({"offset":true})
}).and(zod.object({
  "branch_ids": zod.array(zod.string().uuid()),
  "components": zod.array(zod.object({
  "bundle_id": zod.string().uuid(),
  "id": zod.string().uuid(),
  "item_cost": zod.number(),
  "item_id": zod.string().uuid(),
  "item_name": zod.string(),
  "item_price": zod.number(),
  "position": zod.number(),
  "quantity": zod.number()
})),
  "computed_cost": zod.number()
}))),
  "page": zod.number(),
  "per_page": zod.number(),
  "total": zod.number(),
  "total_pages": zod.number()
})


export const CreateBundleBody = zod.object({
  "available_from_date": zod.string().date().nullish(),
  "available_from_time": zod.string().nullish(),
  "available_until_date": zod.string().date().nullish(),
  "available_until_time": zod.string().nullish(),
  "branch_ids": zod.array(zod.string().uuid()).nullish(),
  "components": zod.array(zod.object({
  "item_id": zod.string().uuid(),
  "position": zod.number().nullish(),
  "quantity": zod.number()
})),
  "description": zod.string().nullish(),
  "description_translations": zod.unknown().optional(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.unknown().optional(),
  "org_id": zod.string().uuid(),
  "price": zod.number()
})


export const AvailableBundlesQueryParams = zod.object({
  "branch_id": zod.string().uuid(),
  "at": zod.string().datetime({"offset":true}).optional()
})

export const AvailableBundlesResponseItem = zod.object({
  "available_from_date": zod.string().date().nullish(),
  "available_from_time": zod.string().nullish(),
  "available_until_date": zod.string().date().nullish(),
  "available_until_time": zod.string().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "created_by": zod.string().uuid().nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.unknown(),
  "id": zod.string().uuid(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "org_id": zod.string().uuid(),
  "price": zod.number(),
  "status": zod.enum(['draft', 'active', 'archived']),
  "updated_at": zod.string().datetime({"offset":true})
}).and(zod.object({
  "branch_ids": zod.array(zod.string().uuid()),
  "components": zod.array(zod.object({
  "bundle_id": zod.string().uuid(),
  "id": zod.string().uuid(),
  "item_cost": zod.number(),
  "item_id": zod.string().uuid(),
  "item_name": zod.string(),
  "item_price": zod.number(),
  "position": zod.number(),
  "quantity": zod.number()
})),
  "computed_cost": zod.number()
}))
export const AvailableBundlesResponse = zod.array(AvailableBundlesResponseItem)


export const GetBundleParams = zod.object({
  "id": zod.string().uuid().describe('Bundle ID')
})

export const GetBundleResponse = zod.object({
  "available_from_date": zod.string().date().nullish(),
  "available_from_time": zod.string().nullish(),
  "available_until_date": zod.string().date().nullish(),
  "available_until_time": zod.string().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "created_by": zod.string().uuid().nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.unknown(),
  "id": zod.string().uuid(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "org_id": zod.string().uuid(),
  "price": zod.number(),
  "status": zod.enum(['draft', 'active', 'archived']),
  "updated_at": zod.string().datetime({"offset":true})
}).and(zod.object({
  "branch_ids": zod.array(zod.string().uuid()),
  "components": zod.array(zod.object({
  "bundle_id": zod.string().uuid(),
  "id": zod.string().uuid(),
  "item_cost": zod.number(),
  "item_id": zod.string().uuid(),
  "item_name": zod.string(),
  "item_price": zod.number(),
  "position": zod.number(),
  "quantity": zod.number()
})),
  "computed_cost": zod.number()
}))


export const DeleteBundleParams = zod.object({
  "id": zod.string().uuid().describe('Bundle ID')
})


export const UpdateBundleParams = zod.object({
  "id": zod.string().uuid().describe('Bundle ID')
})

export const UpdateBundleBody = zod.object({
  "available_from_date": zod.string().date().nullish(),
  "available_from_time": zod.string().nullish().describe('`null`  → clear the field (no start time restriction)\nomitted → keep the existing value\na value → set to that time'),
  "available_until_date": zod.string().date().nullish(),
  "available_until_time": zod.string().nullish(),
  "branch_ids": zod.array(zod.string().uuid()).nullish(),
  "components": zod.array(zod.object({
  "item_id": zod.string().uuid(),
  "position": zod.number().nullish(),
  "quantity": zod.number()
})).nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.unknown().optional(),
  "image_url": zod.string().nullish(),
  "name": zod.string().nullish(),
  "name_translations": zod.unknown().optional(),
  "price": zod.number().nullish()
})

export const UpdateBundleResponse = zod.object({
  "available_from_date": zod.string().date().nullish(),
  "available_from_time": zod.string().nullish(),
  "available_until_date": zod.string().date().nullish(),
  "available_until_time": zod.string().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "created_by": zod.string().uuid().nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.unknown(),
  "id": zod.string().uuid(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "org_id": zod.string().uuid(),
  "price": zod.number(),
  "status": zod.enum(['draft', 'active', 'archived']),
  "updated_at": zod.string().datetime({"offset":true})
}).and(zod.object({
  "branch_ids": zod.array(zod.string().uuid()),
  "components": zod.array(zod.object({
  "bundle_id": zod.string().uuid(),
  "id": zod.string().uuid(),
  "item_cost": zod.number(),
  "item_id": zod.string().uuid(),
  "item_name": zod.string(),
  "item_price": zod.number(),
  "position": zod.number(),
  "quantity": zod.number()
})),
  "computed_cost": zod.number()
}))


export const ActivateBundleParams = zod.object({
  "id": zod.string().uuid().describe('Bundle ID')
})

export const ActivateBundleResponse = zod.object({
  "available_from_date": zod.string().date().nullish(),
  "available_from_time": zod.string().nullish(),
  "available_until_date": zod.string().date().nullish(),
  "available_until_time": zod.string().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "created_by": zod.string().uuid().nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.unknown(),
  "id": zod.string().uuid(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "org_id": zod.string().uuid(),
  "price": zod.number(),
  "status": zod.enum(['draft', 'active', 'archived']),
  "updated_at": zod.string().datetime({"offset":true})
}).and(zod.object({
  "branch_ids": zod.array(zod.string().uuid()),
  "components": zod.array(zod.object({
  "bundle_id": zod.string().uuid(),
  "id": zod.string().uuid(),
  "item_cost": zod.number(),
  "item_id": zod.string().uuid(),
  "item_name": zod.string(),
  "item_price": zod.number(),
  "position": zod.number(),
  "quantity": zod.number()
})),
  "computed_cost": zod.number()
}))


export const ArchiveBundleParams = zod.object({
  "id": zod.string().uuid().describe('Bundle ID')
})

export const ArchiveBundleResponse = zod.object({
  "available_from_date": zod.string().date().nullish(),
  "available_from_time": zod.string().nullish(),
  "available_until_date": zod.string().date().nullish(),
  "available_until_time": zod.string().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "created_by": zod.string().uuid().nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.unknown(),
  "id": zod.string().uuid(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "org_id": zod.string().uuid(),
  "price": zod.number(),
  "status": zod.enum(['draft', 'active', 'archived']),
  "updated_at": zod.string().datetime({"offset":true})
}).and(zod.object({
  "branch_ids": zod.array(zod.string().uuid()),
  "components": zod.array(zod.object({
  "bundle_id": zod.string().uuid(),
  "id": zod.string().uuid(),
  "item_cost": zod.number(),
  "item_id": zod.string().uuid(),
  "item_name": zod.string(),
  "item_price": zod.number(),
  "position": zod.number(),
  "quantity": zod.number()
})),
  "computed_cost": zod.number()
}))


export const BundlePerformanceParams = zod.object({
  "id": zod.string().uuid()
})

export const BundlePerformanceQueryParams = zod.object({
  "start_date": zod.string().datetime({"offset":true}).optional(),
  "end_date": zod.string().datetime({"offset":true}).optional()
})

export const BundlePerformanceResponse = zod.object({
  "component_popularity": zod.array(zod.object({
  "item_id": zod.string().uuid(),
  "item_name": zod.string(),
  "quantity_sold": zod.number()
})),
  "gross_revenue": zod.number(),
  "net_profit": zod.number(),
  "sales_volume": zod.number()
})


export const ListCategoriesQueryParams = zod.object({
  "org_id": zod.string().uuid()
})

export const ListCategoriesResponseItem = zod.object({
  "created_at": zod.string().datetime({"offset":true}),
  "deleted_at": zod.string().datetime({"offset":true}).nullish(),
  "id": zod.string().uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough(),
  "org_id": zod.string().uuid(),
  "updated_at": zod.string().datetime({"offset":true})
})
export const ListCategoriesResponse = zod.array(ListCategoriesResponseItem)


export const CreateCategoryBody = zod.object({
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough().nullish(),
  "org_id": zod.string().uuid()
})


export const DeleteCategoryParams = zod.object({
  "id": zod.string().uuid().describe('Category ID')
})


export const UpdateCategoryParams = zod.object({
  "id": zod.string().uuid().describe('Category ID')
})

export const UpdateCategoryBody = zod.object({
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string().nullish(),
  "name_translations": zod.object({

}).passthrough().nullish()
})

export const UpdateCategoryResponse = zod.object({
  "created_at": zod.string().datetime({"offset":true}),
  "deleted_at": zod.string().datetime({"offset":true}).nullish(),
  "id": zod.string().uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough(),
  "org_id": zod.string().uuid(),
  "updated_at": zod.string().datetime({"offset":true})
})


export const ListAddonCostsQueryParams = zod.object({
  "org_id": zod.string().uuid()
})

export const ListAddonCostsResponseItem = zod.object({
  "addon_item_id": zod.string().uuid(),
  "addon_type": zod.string(),
  "cost": zod.number().nullish().describe('Ingredient cost rollup in piastres. `null` ⟺ unknown.'),
  "cost_missing": zod.boolean(),
  "margin_pct": zod.number().nullish(),
  "name": zod.string(),
  "price": zod.number().describe('Default price in piastres.')
}).describe('Computed cost for one addon item.')
export const ListAddonCostsResponse = zod.array(ListAddonCostsResponseItem)


export const ListMenuCatalogQueryParams = zod.object({
  "org_id": zod.string().uuid(),
  "category_id": zod.string().uuid().optional(),
  "search": zod.string().optional().describe('Case-insensitive filter on the item name.'),
  "page": zod.number().optional().describe('1-based page number (default 1).'),
  "per_page": zod.number().optional().describe('Page size (default 50, max 500).'),
  "branch_id": zod.string().uuid().optional().describe('When set, enables the per-branch override filter\/sort (LEFT JOINs the\nbranch\'s overrides). Prices in the response stay org-level.'),
  "overridden": zod.boolean().optional().describe('With `branch_id`: true → only items overridden at the branch; false →\nonly un-overridden; null → all.'),
  "sort": zod.string().optional().describe('`\"overridden\"` → overridden items first (needs `branch_id`); otherwise A–Z.')
})

export const ListMenuCatalogResponse = zod.object({
  "data": zod.array(zod.object({
  "base_price": zod.number(),
  "category_id": zod.string().uuid().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "default_milk_addon_id": zod.string().nullish(),
  "deleted_at": zod.string().datetime({"offset":true}).nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.object({

}).passthrough(),
  "id": zod.string().uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough(),
  "org_id": zod.string().uuid(),
  "updated_at": zod.string().datetime({"offset":true})
}).and(zod.object({
  "sku_costs": zod.array(zod.object({
  "category_id": zod.string().uuid().nullish(),
  "cost": zod.number().nullish().describe('Recipe cost rollup in piastres. `null` ⟺ unknown (no recipe, or any\ningredient unlinked \/ missing a cost).'),
  "cost_missing": zod.boolean(),
  "food_cost_pct": zod.number().nullish().describe('`cost \/ price` when both known and price > 0.'),
  "item_name": zod.string(),
  "margin_pct": zod.number().nullish().describe('`(price - cost) \/ price` when both known and price > 0.'),
  "menu_item_id": zod.string().uuid(),
  "price": zod.number().describe('Current price in piastres for this SKU.'),
  "size_label": zod.string().describe('`\"one_size\"` when the item has no sizes.')
}).describe('Computed cost for one sellable SKU (menu item × size).'))
})).describe('A menu item with its per-SKU recipe-cost rollup embedded, so the catalog\nlist needs no separate `\/costing\/menu-items` round trip. `sku_costs` is one\nrow per sellable size (or a single `one_size` row); empty when the item is\ninactive or has no recipe.')),
  "page": zod.number(),
  "per_page": zod.number(),
  "total": zod.number(),
  "total_pages": zod.number()
})


export const ListSkuCostsQueryParams = zod.object({
  "org_id": zod.string().uuid()
})

export const ListSkuCostsResponseItem = zod.object({
  "category_id": zod.string().uuid().nullish(),
  "cost": zod.number().nullish().describe('Recipe cost rollup in piastres. `null` ⟺ unknown (no recipe, or any\ningredient unlinked \/ missing a cost).'),
  "cost_missing": zod.boolean(),
  "food_cost_pct": zod.number().nullish().describe('`cost \/ price` when both known and price > 0.'),
  "item_name": zod.string(),
  "margin_pct": zod.number().nullish().describe('`(price - cost) \/ price` when both known and price > 0.'),
  "menu_item_id": zod.string().uuid(),
  "price": zod.number().describe('Current price in piastres for this SKU.'),
  "size_label": zod.string().describe('`\"one_size\"` when the item has no sizes.')
}).describe('Computed cost for one sellable SKU (menu item × size).')
export const ListSkuCostsResponse = zod.array(ListSkuCostsResponseItem)


export const ListDeliveryOrdersQueryParams = zod.object({
  "branch_id": zod.string().uuid(),
  "status": zod.string().nullish().describe('Comma-separated statuses to include (default: all).'),
  "limit": zod.number().nullish()
})

export const ListDeliveryOrdersResponseItem = zod.object({
  "address_line": zod.string().nullish(),
  "branch_id": zod.string().uuid(),
  "cancel_reason": zod.string().nullish(),
  "cancel_restocked": zod.boolean().nullish(),
  "cancelled_at": zod.string().datetime({"offset":true}).nullish(),
  "cart": zod.object({

}).passthrough().describe('The frozen priced line snapshot the POS renders before finalize.'),
  "channel": zod.string(),
  "confirmed_at": zod.string().datetime({"offset":true}).nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "customer_lat": zod.number().nullish(),
  "customer_lng": zod.number().nullish(),
  "customer_name": zod.string(),
  "customer_phone": zod.string(),
  "delivered_at": zod.string().datetime({"offset":true}).nullish(),
  "delivery_fee": zod.number(),
  "delivery_notes": zod.string().nullish(),
  "delivery_ref": zod.string().nullish(),
  "delivery_zone_id": zod.string().uuid().nullish(),
  "extra_prep_minutes": zod.number().describe('Extra prep minutes the teller added on top of the branch base (multiples of 5).'),
  "floor": zod.string().nullish(),
  "id": zod.string().uuid(),
  "landmark": zod.string().nullish(),
  "order_id": zod.string().uuid().nullish(),
  "org_id": zod.string().uuid(),
  "otp_verified": zod.boolean(),
  "out_for_delivery_at": zod.string().datetime({"offset":true}).nullish(),
  "payment_method_hint": zod.string().nullish(),
  "place_name": zod.string().nullish(),
  "preparing_at": zod.string().datetime({"offset":true}).nullish(),
  "ready_at": zod.string().datetime({"offset":true}).nullish(),
  "receipt_printed_at": zod.string().datetime({"offset":true}).nullish(),
  "rejected_at": zod.string().datetime({"offset":true}).nullish(),
  "road_distance_meters": zod.number().nullish(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "total": zod.number(),
  "unit_number": zod.string().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
})
export const ListDeliveryOrdersResponse = zod.array(ListDeliveryOrdersResponseItem)


export const GetDeliveryOrderParams = zod.object({
  "id": zod.string().uuid()
})

export const GetDeliveryOrderResponse = zod.object({
  "address_line": zod.string().nullish(),
  "branch_id": zod.string().uuid(),
  "cancel_reason": zod.string().nullish(),
  "cancel_restocked": zod.boolean().nullish(),
  "cancelled_at": zod.string().datetime({"offset":true}).nullish(),
  "cart": zod.object({

}).passthrough().describe('The frozen priced line snapshot the POS renders before finalize.'),
  "channel": zod.string(),
  "confirmed_at": zod.string().datetime({"offset":true}).nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "customer_lat": zod.number().nullish(),
  "customer_lng": zod.number().nullish(),
  "customer_name": zod.string(),
  "customer_phone": zod.string(),
  "delivered_at": zod.string().datetime({"offset":true}).nullish(),
  "delivery_fee": zod.number(),
  "delivery_notes": zod.string().nullish(),
  "delivery_ref": zod.string().nullish(),
  "delivery_zone_id": zod.string().uuid().nullish(),
  "extra_prep_minutes": zod.number().describe('Extra prep minutes the teller added on top of the branch base (multiples of 5).'),
  "floor": zod.string().nullish(),
  "id": zod.string().uuid(),
  "landmark": zod.string().nullish(),
  "order_id": zod.string().uuid().nullish(),
  "org_id": zod.string().uuid(),
  "otp_verified": zod.boolean(),
  "out_for_delivery_at": zod.string().datetime({"offset":true}).nullish(),
  "payment_method_hint": zod.string().nullish(),
  "place_name": zod.string().nullish(),
  "preparing_at": zod.string().datetime({"offset":true}).nullish(),
  "ready_at": zod.string().datetime({"offset":true}).nullish(),
  "receipt_printed_at": zod.string().datetime({"offset":true}).nullish(),
  "rejected_at": zod.string().datetime({"offset":true}).nullish(),
  "road_distance_meters": zod.number().nullish(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "total": zod.number(),
  "unit_number": zod.string().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
})


export const CancelDeliveryOrderParams = zod.object({
  "id": zod.string().uuid()
})

export const CancelDeliveryOrderBody = zod.object({
  "reason": zod.string().nullish(),
  "restore_inventory": zod.boolean().optional().describe('true (default): ingredients stay available. false: the food was made and is\nwasted — the frozen plan is deducted from stock and logged as `waste`.')
})

export const CancelDeliveryOrderResponse = zod.object({
  "address_line": zod.string().nullish(),
  "branch_id": zod.string().uuid(),
  "cancel_reason": zod.string().nullish(),
  "cancel_restocked": zod.boolean().nullish(),
  "cancelled_at": zod.string().datetime({"offset":true}).nullish(),
  "cart": zod.object({

}).passthrough().describe('The frozen priced line snapshot the POS renders before finalize.'),
  "channel": zod.string(),
  "confirmed_at": zod.string().datetime({"offset":true}).nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "customer_lat": zod.number().nullish(),
  "customer_lng": zod.number().nullish(),
  "customer_name": zod.string(),
  "customer_phone": zod.string(),
  "delivered_at": zod.string().datetime({"offset":true}).nullish(),
  "delivery_fee": zod.number(),
  "delivery_notes": zod.string().nullish(),
  "delivery_ref": zod.string().nullish(),
  "delivery_zone_id": zod.string().uuid().nullish(),
  "extra_prep_minutes": zod.number().describe('Extra prep minutes the teller added on top of the branch base (multiples of 5).'),
  "floor": zod.string().nullish(),
  "id": zod.string().uuid(),
  "landmark": zod.string().nullish(),
  "order_id": zod.string().uuid().nullish(),
  "org_id": zod.string().uuid(),
  "otp_verified": zod.boolean(),
  "out_for_delivery_at": zod.string().datetime({"offset":true}).nullish(),
  "payment_method_hint": zod.string().nullish(),
  "place_name": zod.string().nullish(),
  "preparing_at": zod.string().datetime({"offset":true}).nullish(),
  "ready_at": zod.string().datetime({"offset":true}).nullish(),
  "receipt_printed_at": zod.string().datetime({"offset":true}).nullish(),
  "rejected_at": zod.string().datetime({"offset":true}).nullish(),
  "road_distance_meters": zod.number().nullish(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "total": zod.number(),
  "unit_number": zod.string().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
})


export const FinalizeDeliveryOrderParams = zod.object({
  "id": zod.string().uuid()
})

export const FinalizeDeliveryOrderBody = zod.object({
  "payment_method": zod.string().describe('The actual method the customer paid (overrides the hint). Must be an org method.'),
  "shift_id": zod.string().uuid()
})

export const FinalizeDeliveryOrderResponse = zod.object({
  "delivery_order": zod.object({
  "address_line": zod.string().nullish(),
  "branch_id": zod.string().uuid(),
  "cancel_reason": zod.string().nullish(),
  "cancel_restocked": zod.boolean().nullish(),
  "cancelled_at": zod.string().datetime({"offset":true}).nullish(),
  "cart": zod.object({

}).passthrough().describe('The frozen priced line snapshot the POS renders before finalize.'),
  "channel": zod.string(),
  "confirmed_at": zod.string().datetime({"offset":true}).nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "customer_lat": zod.number().nullish(),
  "customer_lng": zod.number().nullish(),
  "customer_name": zod.string(),
  "customer_phone": zod.string(),
  "delivered_at": zod.string().datetime({"offset":true}).nullish(),
  "delivery_fee": zod.number(),
  "delivery_notes": zod.string().nullish(),
  "delivery_ref": zod.string().nullish(),
  "delivery_zone_id": zod.string().uuid().nullish(),
  "extra_prep_minutes": zod.number().describe('Extra prep minutes the teller added on top of the branch base (multiples of 5).'),
  "floor": zod.string().nullish(),
  "id": zod.string().uuid(),
  "landmark": zod.string().nullish(),
  "order_id": zod.string().uuid().nullish(),
  "org_id": zod.string().uuid(),
  "otp_verified": zod.boolean(),
  "out_for_delivery_at": zod.string().datetime({"offset":true}).nullish(),
  "payment_method_hint": zod.string().nullish(),
  "place_name": zod.string().nullish(),
  "preparing_at": zod.string().datetime({"offset":true}).nullish(),
  "ready_at": zod.string().datetime({"offset":true}).nullish(),
  "receipt_printed_at": zod.string().datetime({"offset":true}).nullish(),
  "rejected_at": zod.string().datetime({"offset":true}).nullish(),
  "road_distance_meters": zod.number().nullish(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "total": zod.number(),
  "unit_number": zod.string().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
}),
  "order_id": zod.string().uuid(),
  "order_ref": zod.string().nullish(),
  "warnings": zod.array(zod.string())
})


export const SetPrepTimeParams = zod.object({
  "id": zod.string().uuid()
})

export const SetPrepTimeBody = zod.object({
  "extra_prep_minutes": zod.number().describe('Minutes the teller adds on top of the branch base prep time. Must be a\nnon-negative multiple of 5.')
})

export const SetPrepTimeResponse = zod.object({
  "address_line": zod.string().nullish(),
  "branch_id": zod.string().uuid(),
  "cancel_reason": zod.string().nullish(),
  "cancel_restocked": zod.boolean().nullish(),
  "cancelled_at": zod.string().datetime({"offset":true}).nullish(),
  "cart": zod.object({

}).passthrough().describe('The frozen priced line snapshot the POS renders before finalize.'),
  "channel": zod.string(),
  "confirmed_at": zod.string().datetime({"offset":true}).nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "customer_lat": zod.number().nullish(),
  "customer_lng": zod.number().nullish(),
  "customer_name": zod.string(),
  "customer_phone": zod.string(),
  "delivered_at": zod.string().datetime({"offset":true}).nullish(),
  "delivery_fee": zod.number(),
  "delivery_notes": zod.string().nullish(),
  "delivery_ref": zod.string().nullish(),
  "delivery_zone_id": zod.string().uuid().nullish(),
  "extra_prep_minutes": zod.number().describe('Extra prep minutes the teller added on top of the branch base (multiples of 5).'),
  "floor": zod.string().nullish(),
  "id": zod.string().uuid(),
  "landmark": zod.string().nullish(),
  "order_id": zod.string().uuid().nullish(),
  "org_id": zod.string().uuid(),
  "otp_verified": zod.boolean(),
  "out_for_delivery_at": zod.string().datetime({"offset":true}).nullish(),
  "payment_method_hint": zod.string().nullish(),
  "place_name": zod.string().nullish(),
  "preparing_at": zod.string().datetime({"offset":true}).nullish(),
  "ready_at": zod.string().datetime({"offset":true}).nullish(),
  "receipt_printed_at": zod.string().datetime({"offset":true}).nullish(),
  "rejected_at": zod.string().datetime({"offset":true}).nullish(),
  "road_distance_meters": zod.number().nullish(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "total": zod.number(),
  "unit_number": zod.string().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
})


export const SetStatusParams = zod.object({
  "id": zod.string().uuid()
})

export const SetStatusBody = zod.object({
  "status": zod.string().describe('\"confirmed\" | \"preparing\" | \"ready\" | \"out_for_delivery\"')
})

export const SetStatusResponse = zod.object({
  "address_line": zod.string().nullish(),
  "branch_id": zod.string().uuid(),
  "cancel_reason": zod.string().nullish(),
  "cancel_restocked": zod.boolean().nullish(),
  "cancelled_at": zod.string().datetime({"offset":true}).nullish(),
  "cart": zod.object({

}).passthrough().describe('The frozen priced line snapshot the POS renders before finalize.'),
  "channel": zod.string(),
  "confirmed_at": zod.string().datetime({"offset":true}).nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "customer_lat": zod.number().nullish(),
  "customer_lng": zod.number().nullish(),
  "customer_name": zod.string(),
  "customer_phone": zod.string(),
  "delivered_at": zod.string().datetime({"offset":true}).nullish(),
  "delivery_fee": zod.number(),
  "delivery_notes": zod.string().nullish(),
  "delivery_ref": zod.string().nullish(),
  "delivery_zone_id": zod.string().uuid().nullish(),
  "extra_prep_minutes": zod.number().describe('Extra prep minutes the teller added on top of the branch base (multiples of 5).'),
  "floor": zod.string().nullish(),
  "id": zod.string().uuid(),
  "landmark": zod.string().nullish(),
  "order_id": zod.string().uuid().nullish(),
  "org_id": zod.string().uuid(),
  "otp_verified": zod.boolean(),
  "out_for_delivery_at": zod.string().datetime({"offset":true}).nullish(),
  "payment_method_hint": zod.string().nullish(),
  "place_name": zod.string().nullish(),
  "preparing_at": zod.string().datetime({"offset":true}).nullish(),
  "ready_at": zod.string().datetime({"offset":true}).nullish(),
  "receipt_printed_at": zod.string().datetime({"offset":true}).nullish(),
  "rejected_at": zod.string().datetime({"offset":true}).nullish(),
  "road_distance_meters": zod.number().nullish(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "total": zod.number(),
  "unit_number": zod.string().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
})


export const SetAcceptingBody = zod.object({
  "branch_id": zod.string().uuid(),
  "channel": zod.string().describe('\"in_mall\" | \"outside\"'),
  "override": zod.string().describe('\"auto\" | \"open\" | \"closed\"')
})

export const SetAcceptingResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "in_mall_close_time": zod.string().nullish(),
  "in_mall_enabled": zod.boolean(),
  "in_mall_fee": zod.number(),
  "in_mall_open_time": zod.string().nullish(),
  "in_mall_override": zod.string(),
  "max_road_distance_meters": zod.number().nullish(),
  "outside_close_time": zod.string().nullish(),
  "outside_enabled": zod.boolean(),
  "outside_open_time": zod.string().nullish(),
  "outside_override": zod.string(),
  "prep_time_minutes": zod.number()
})


export const ListChannelAddonOverridesQueryParams = zod.object({
  "branch_id": zod.string().uuid(),
  "channel": zod.string()
})

export const ListChannelAddonOverridesResponseItem = zod.object({
  "addon_item_id": zod.string().uuid(),
  "branch_id": zod.string().uuid(),
  "channel": zod.string(),
  "is_available": zod.boolean().nullish(),
  "price_override": zod.number().nullish()
})
export const ListChannelAddonOverridesResponse = zod.array(ListChannelAddonOverridesResponseItem)


export const UpsertChannelAddonOverrideBody = zod.object({
  "addon_item_id": zod.string().uuid(),
  "branch_id": zod.string().uuid(),
  "channel": zod.string(),
  "is_available": zod.boolean().nullish(),
  "price_override": zod.number().nullish()
})

export const UpsertChannelAddonOverrideResponse = zod.object({
  "addon_item_id": zod.string().uuid(),
  "branch_id": zod.string().uuid(),
  "channel": zod.string(),
  "is_available": zod.boolean().nullish(),
  "price_override": zod.number().nullish()
})


export const DeleteChannelAddonOverrideQueryParams = zod.object({
  "branch_id": zod.string().uuid(),
  "addon_item_id": zod.string().uuid(),
  "channel": zod.string()
})


export const ListChannelOverridesQueryParams = zod.object({
  "branch_id": zod.string().uuid(),
  "channel": zod.string()
})

export const ListChannelOverridesResponseItem = zod.object({
  "branch_id": zod.string().uuid(),
  "channel": zod.string(),
  "is_available": zod.boolean().nullish(),
  "menu_item_id": zod.string().uuid(),
  "price_override": zod.number().nullish()
})
export const ListChannelOverridesResponse = zod.array(ListChannelOverridesResponseItem)


export const UpsertChannelOverrideBody = zod.object({
  "branch_id": zod.string().uuid(),
  "channel": zod.string(),
  "is_available": zod.boolean().nullish(),
  "menu_item_id": zod.string().uuid(),
  "price_override": zod.number().nullish()
})

export const UpsertChannelOverrideResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "channel": zod.string(),
  "is_available": zod.boolean().nullish(),
  "menu_item_id": zod.string().uuid(),
  "price_override": zod.number().nullish()
})


export const DeleteChannelOverrideQueryParams = zod.object({
  "branch_id": zod.string().uuid(),
  "menu_item_id": zod.string().uuid(),
  "channel": zod.string()
})


export const GetBranchSettingsQueryParams = zod.object({
  "branch_id": zod.string().uuid()
})

export const GetBranchSettingsResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "in_mall_close_time": zod.string().nullish(),
  "in_mall_enabled": zod.boolean(),
  "in_mall_fee": zod.number(),
  "in_mall_open_time": zod.string().nullish(),
  "in_mall_override": zod.string(),
  "max_road_distance_meters": zod.number().nullish(),
  "outside_close_time": zod.string().nullish(),
  "outside_enabled": zod.boolean(),
  "outside_open_time": zod.string().nullish(),
  "outside_override": zod.string(),
  "prep_time_minutes": zod.number()
})


export const PutBranchSettingsBody = zod.object({
  "branch_id": zod.string().uuid(),
  "in_mall_close_time": zod.string().nullish(),
  "in_mall_enabled": zod.boolean(),
  "in_mall_fee": zod.number(),
  "in_mall_open_time": zod.string().nullish(),
  "max_road_distance_meters": zod.number().nullish(),
  "outside_close_time": zod.string().nullish(),
  "outside_enabled": zod.boolean(),
  "outside_open_time": zod.string().nullish(),
  "prep_time_minutes": zod.number()
})

export const PutBranchSettingsResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "in_mall_close_time": zod.string().nullish(),
  "in_mall_enabled": zod.boolean(),
  "in_mall_fee": zod.number(),
  "in_mall_open_time": zod.string().nullish(),
  "in_mall_override": zod.string(),
  "max_road_distance_meters": zod.number().nullish(),
  "outside_close_time": zod.string().nullish(),
  "outside_enabled": zod.boolean(),
  "outside_open_time": zod.string().nullish(),
  "outside_override": zod.string(),
  "prep_time_minutes": zod.number()
})


export const ListZonesQueryParams = zod.object({
  "branch_id": zod.string().uuid()
})

export const ListZonesResponseItem = zod.object({
  "branch_id": zod.string().uuid(),
  "fee": zod.number(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "max_road_distance_meters": zod.number(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough()
})
export const ListZonesResponse = zod.array(ListZonesResponseItem)


export const CreateZoneBody = zod.object({
  "branch_id": zod.string().uuid(),
  "fee": zod.number(),
  "is_active": zod.boolean().optional(),
  "max_road_distance_meters": zod.number(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough().optional()
})


export const DeleteZoneParams = zod.object({
  "id": zod.string().uuid()
})

export const DeleteZoneQueryParams = zod.object({
  "branch_id": zod.string().uuid()
})


export const UpdateZoneParams = zod.object({
  "id": zod.string().uuid()
})

export const UpdateZoneBody = zod.object({
  "branch_id": zod.string().uuid(),
  "fee": zod.number(),
  "is_active": zod.boolean().optional(),
  "max_road_distance_meters": zod.number(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough().optional()
})

export const UpdateZoneResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "fee": zod.number(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "max_road_distance_meters": zod.number(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough()
})


export const ListDiscountsQueryParams = zod.object({
  "org_id": zod.string().uuid()
})

export const ListDiscountsResponseItem = zod.object({
  "created_at": zod.string().datetime({"offset":true}),
  "dtype": zod.string(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough(),
  "org_id": zod.string().uuid(),
  "updated_at": zod.string().datetime({"offset":true}),
  "value": zod.number()
})
export const ListDiscountsResponse = zod.array(ListDiscountsResponseItem)


export const CreateDiscountBody = zod.object({
  "dtype": zod.string(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough().nullish(),
  "org_id": zod.string().uuid(),
  "value": zod.number()
})


export const DeleteDiscountParams = zod.object({
  "id": zod.string().uuid().describe('Discount ID')
})


export const UpdateDiscountParams = zod.object({
  "id": zod.string().uuid().describe('Discount ID')
})

export const UpdateDiscountBody = zod.object({
  "dtype": zod.string().nullish(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string().nullish(),
  "name_translations": zod.object({

}).passthrough().nullish(),
  "value": zod.number().nullish()
})

export const UpdateDiscountResponse = zod.object({
  "created_at": zod.string().datetime({"offset":true}),
  "dtype": zod.string(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough(),
  "org_id": zod.string().uuid(),
  "updated_at": zod.string().datetime({"offset":true}),
  "value": zod.number()
})


export const ListAdjustmentsParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const ListAdjustmentsResponseItem = zod.object({
  "adjusted_by": zod.string().uuid(),
  "adjusted_by_name": zod.string(),
  "adjustment_type": zod.string(),
  "branch_id": zod.string().uuid(),
  "branch_inventory_id": zod.string().uuid(),
  "created_at": zod.string().datetime({"offset":true}),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string(),
  "note": zod.string(),
  "quantity": zod.number(),
  "transfer_id": zod.string().uuid().nullish(),
  "unit": zod.string()
})
export const ListAdjustmentsResponse = zod.array(ListAdjustmentsResponseItem)


export const CreateAdjustmentParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const CreateAdjustmentBody = zod.object({
  "adjustment_type": zod.string(),
  "branch_inventory_id": zod.string().uuid(),
  "note": zod.string(),
  "quantity": zod.number()
})


export const ListMovementsParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const ListMovementsQueryParams = zod.object({
  "org_ingredient_id": zod.string().uuid().optional(),
  "type": zod.string().optional(),
  "from": zod.string().datetime({"offset":true}).optional(),
  "to": zod.string().datetime({"offset":true}).optional(),
  "page": zod.number().optional(),
  "per_page": zod.number().optional()
})

export const ListMovementsResponseItem = zod.object({
  "balance_after": zod.number().nullish(),
  "below_zero": zod.boolean(),
  "branch_id": zod.string().uuid(),
  "branch_inventory_id": zod.string().uuid().nullish(),
  "branch_name": zod.string().nullish().describe('Branch name; only populated by the all-branches waste roll-up (nil\n{branch_id}). `None` for single-branch queries that do not select it.'),
  "created_at": zod.string().datetime({"offset":true}),
  "created_by": zod.string().uuid().nullish(),
  "created_by_name": zod.string().nullish(),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string(),
  "movement_type": zod.string().describe('inventory_movement_type: sale | void_restock | adjustment_add |\nadjustment_remove | waste | transfer_out | transfer_in | purchase_in | stock_count'),
  "note": zod.string().nullish(),
  "org_ingredient_id": zod.string().uuid(),
  "quantity": zod.number().describe('Signed delta applied to stock (consumption negative, replenishment positive).'),
  "reason": zod.string().nullish(),
  "source_id": zod.string().uuid().nullish(),
  "source_type": zod.string().nullish(),
  "unit": zod.string(),
  "unit_cost": zod.number().nullish().describe('Piastres per unit at movement time; `null` ⟺ unknown.')
})
export const ListMovementsResponse = zod.array(ListMovementsResponseItem)


export const ListBranchStockParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const ListBranchStockResponseItem = zod.object({
  "below_reorder": zod.boolean(),
  "branch_id": zod.string().uuid(),
  "cost_per_unit": zod.number().nullish().describe('Piastres per unit; `null` ⟺ cost never entered.'),
  "created_at": zod.string().datetime({"offset":true}),
  "current_stock": zod.number(),
  "description": zod.string().nullish(),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string(),
  "last_counted_at": zod.string().datetime({"offset":true}).nullish().describe('When this item was last reconciled by a finalized stock count; `null` =\nnever counted. Drives the \"count due\" signal on the inventory home.'),
  "org_ingredient_id": zod.string().uuid(),
  "reorder_threshold": zod.number(),
  "unit": zod.string(),
  "updated_at": zod.string().datetime({"offset":true})
})
export const ListBranchStockResponse = zod.array(ListBranchStockResponseItem)


export const AddToBranchStockParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const AddToBranchStockBody = zod.object({
  "current_stock": zod.number().nullish(),
  "org_ingredient_id": zod.string().uuid(),
  "reorder_threshold": zod.number().nullish()
})


export const RemoveFromBranchStockParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID'),
  "id": zod.string().uuid().describe('Stock ID')
})


export const UpdateBranchStockParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID'),
  "id": zod.string().uuid().describe('Stock ID')
})

export const UpdateBranchStockBody = zod.object({
  "current_stock": zod.number().nullish(),
  "reorder_threshold": zod.number().nullish()
})

export const UpdateBranchStockResponse = zod.object({
  "below_reorder": zod.boolean(),
  "branch_id": zod.string().uuid(),
  "cost_per_unit": zod.number().nullish().describe('Piastres per unit; `null` ⟺ cost never entered.'),
  "created_at": zod.string().datetime({"offset":true}),
  "current_stock": zod.number(),
  "description": zod.string().nullish(),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string(),
  "last_counted_at": zod.string().datetime({"offset":true}).nullish().describe('When this item was last reconciled by a finalized stock count; `null` =\nnever counted. Drives the \"count due\" signal on the inventory home.'),
  "org_ingredient_id": zod.string().uuid(),
  "reorder_threshold": zod.number(),
  "unit": zod.string(),
  "updated_at": zod.string().datetime({"offset":true})
})


export const ListTransfersParams = zod.object({
  "branch_id": zod.string().uuid()
})

export const ListTransfersQueryParams = zod.object({
  "direction": zod.string().optional()
})

export const ListTransfersResponseItem = zod.object({
  "destination_branch_id": zod.string().uuid(),
  "destination_branch_name": zod.string(),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string(),
  "initiated_at": zod.string().datetime({"offset":true}),
  "initiated_by": zod.string().uuid(),
  "initiated_by_name": zod.string(),
  "note": zod.string().nullish(),
  "org_id": zod.string().uuid(),
  "org_ingredient_id": zod.string().uuid(),
  "quantity": zod.number(),
  "source_branch_id": zod.string().uuid(),
  "source_branch_name": zod.string(),
  "unit": zod.string()
})
export const ListTransfersResponse = zod.array(ListTransfersResponseItem)


export const ListWasteParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const ListWasteResponseItem = zod.object({
  "balance_after": zod.number().nullish(),
  "below_zero": zod.boolean(),
  "branch_id": zod.string().uuid(),
  "branch_inventory_id": zod.string().uuid().nullish(),
  "branch_name": zod.string().nullish().describe('Branch name; only populated by the all-branches waste roll-up (nil\n{branch_id}). `None` for single-branch queries that do not select it.'),
  "created_at": zod.string().datetime({"offset":true}),
  "created_by": zod.string().uuid().nullish(),
  "created_by_name": zod.string().nullish(),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string(),
  "movement_type": zod.string().describe('inventory_movement_type: sale | void_restock | adjustment_add |\nadjustment_remove | waste | transfer_out | transfer_in | purchase_in | stock_count'),
  "note": zod.string().nullish(),
  "org_ingredient_id": zod.string().uuid(),
  "quantity": zod.number().describe('Signed delta applied to stock (consumption negative, replenishment positive).'),
  "reason": zod.string().nullish(),
  "source_id": zod.string().uuid().nullish(),
  "source_type": zod.string().nullish(),
  "unit": zod.string(),
  "unit_cost": zod.number().nullish().describe('Piastres per unit at movement time; `null` ⟺ unknown.')
})
export const ListWasteResponse = zod.array(ListWasteResponseItem)


export const CreateWasteParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const CreateWasteBody = zod.object({
  "note": zod.string().nullish(),
  "org_ingredient_id": zod.string().uuid(),
  "quantity": zod.number(),
  "reason": zod.string().describe('expired | spoiled | damaged | overproduction | theft | other')
})


export const ListCatalogParams = zod.object({
  "org_id": zod.string().uuid().describe('Organization ID')
})

export const ListCatalogResponseItem = zod.object({
  "category": zod.string(),
  "cost_per_unit": zod.number().nullish().describe('Piastres per unit. `null` ⟺ never entered (unknown, NOT free) —\nrecipes using this ingredient are cost-missing everywhere.'),
  "created_at": zod.string().datetime({"offset":true}),
  "description": zod.string().nullish(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.string().uuid(),
  "supplier_id": zod.string().uuid().nullish().describe('Default supplier for reordering this ingredient; `null` = none set.'),
  "supplier_name": zod.string().nullish(),
  "unit": zod.string(),
  "updated_at": zod.string().datetime({"offset":true})
})
export const ListCatalogResponse = zod.array(ListCatalogResponseItem)


export const CreateCatalogItemParams = zod.object({
  "org_id": zod.string().uuid().describe('Organization ID')
})

export const CreateCatalogItemBody = zod.object({
  "category": zod.string(),
  "cost_per_unit": zod.number().nullish(),
  "description": zod.string().nullish(),
  "name": zod.string(),
  "supplier_id": zod.string().uuid().nullish().describe('Optional default supplier for reordering.'),
  "unit": zod.string()
})


export const DeleteCatalogItemParams = zod.object({
  "org_id": zod.string().uuid().describe('Organization ID'),
  "id": zod.string().uuid().describe('Ingredient ID')
})


export const UpdateCatalogItemParams = zod.object({
  "org_id": zod.string().uuid().describe('Organization ID'),
  "id": zod.string().uuid().describe('Ingredient ID')
})

export const UpdateCatalogItemBody = zod.object({
  "category": zod.string().nullish(),
  "cost_per_unit": zod.number().nullish(),
  "description": zod.string().nullish(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string().nullish(),
  "supplier_id": zod.string().uuid().nullish().describe('Set\/replace the default supplier. (Omitted = unchanged; clearing to\nnone is not supported via this field.)'),
  "unit": zod.string().nullish()
})

export const UpdateCatalogItemResponse = zod.object({
  "category": zod.string(),
  "cost_per_unit": zod.number().nullish().describe('Piastres per unit. `null` ⟺ never entered (unknown, NOT free) —\nrecipes using this ingredient are cost-missing everywhere.'),
  "created_at": zod.string().datetime({"offset":true}),
  "description": zod.string().nullish(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.string().uuid(),
  "supplier_id": zod.string().uuid().nullish().describe('Default supplier for reordering this ingredient; `null` = none set.'),
  "supplier_name": zod.string().nullish(),
  "unit": zod.string(),
  "updated_at": zod.string().datetime({"offset":true})
})


export const GetInventorySettingsParams = zod.object({
  "org_id": zod.string().uuid().describe('Organization ID')
})

export const GetInventorySettingsResponse = zod.object({
  "stocktake_variance_threshold_pct": zod.number().describe('Stock-count variance tolerance (percent). A counted row whose |difference|\nis at least this percent of expected is flagged and needs a reason.')
})


export const UpdateInventorySettingsParams = zod.object({
  "org_id": zod.string().uuid().describe('Organization ID')
})

export const UpdateInventorySettingsBody = zod.object({
  "stocktake_variance_threshold_pct": zod.number()
})

export const UpdateInventorySettingsResponse = zod.object({
  "stocktake_variance_threshold_pct": zod.number().describe('Stock-count variance tolerance (percent). A counted row whose |difference|\nis at least this percent of expected is flagged and needs a reason.')
})


export const CreateTransferBody = zod.object({
  "destination_branch_id": zod.string().uuid(),
  "note": zod.string().nullish(),
  "org_ingredient_id": zod.string().uuid(),
  "quantity": zod.number(),
  "source_branch_id": zod.string().uuid()
})


export const DeleteTransferParams = zod.object({
  "id": zod.string().uuid().describe('Transfer ID')
})


export const UpdateTransferParams = zod.object({
  "id": zod.string().uuid().describe('Transfer ID')
})

export const UpdateTransferBody = zod.object({
  "note": zod.string().nullish()
})

export const UpdateTransferResponse = zod.object({
  "destination_branch_id": zod.string().uuid(),
  "destination_branch_name": zod.string(),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string(),
  "initiated_at": zod.string().datetime({"offset":true}),
  "initiated_by": zod.string().uuid(),
  "initiated_by_name": zod.string(),
  "note": zod.string().nullish(),
  "org_id": zod.string().uuid(),
  "org_ingredient_id": zod.string().uuid(),
  "quantity": zod.number(),
  "source_branch_id": zod.string().uuid(),
  "source_branch_name": zod.string(),
  "unit": zod.string()
})


export const GetCalibrationHandlerParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const GetCalibrationHandlerQueryParams = zod.object({
  "since": zod.string().datetime({"offset":true}).optional().describe('Only decisions made at or after this instant.')
})

export const GetCalibrationHandlerResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "cm_in_range_pct": zod.number().nullish().describe('Fraction of accepted CM suggestions whose realized price landed\nwithin ±2% of the suggested price. `None` below 10 samples.'),
  "points_cm": zod.array(zod.object({
  "classification_mode": zod.string().describe('Classification at suggestion time: \"cm\" or \"revenue\"'),
  "decided_at": zod.string().datetime({"offset":true}),
  "item_name": zod.string(),
  "menu_item_id": zod.string().uuid(),
  "predicted_delta_pct": zod.number(),
  "previous_price": zod.number(),
  "realized_at": zod.string().datetime({"offset":true}),
  "realized_delta_pct": zod.number(),
  "realized_price": zod.number(),
  "size_label": zod.string(),
  "suggested_price": zod.number(),
  "suggestion_id": zod.string().uuid()
})),
  "points_revenue": zod.array(zod.object({
  "classification_mode": zod.string().describe('Classification at suggestion time: \"cm\" or \"revenue\"'),
  "decided_at": zod.string().datetime({"offset":true}),
  "item_name": zod.string(),
  "menu_item_id": zod.string().uuid(),
  "predicted_delta_pct": zod.number(),
  "previous_price": zod.number(),
  "realized_at": zod.string().datetime({"offset":true}),
  "realized_delta_pct": zod.number(),
  "realized_price": zod.number(),
  "size_label": zod.string(),
  "suggested_price": zod.number(),
  "suggestion_id": zod.string().uuid()
})),
  "revenue_in_range_pct": zod.number().nullish(),
  "since": zod.string().datetime({"offset":true}).nullish()
})


export const ListDecisionsHandlerParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const ListDecisionsHandlerQueryParams = zod.object({
  "since": zod.string().datetime({"offset":true}).optional().describe('Only decisions made at or after this instant.')
})

export const ListDecisionsHandlerResponseItem = zod.object({
  "branch_id": zod.string().uuid(),
  "decided_at": zod.string().datetime({"offset":true}),
  "decided_by": zod.string().uuid(),
  "decision": zod.enum(['accepted', 'rejected', 'ignored']),
  "id": zod.string().uuid(),
  "notes": zod.string().nullish(),
  "suggestion_id": zod.string().uuid(),
  "suggestion_kind": zod.enum(['price', 'bundle', 'removal'])
})
export const ListDecisionsHandlerResponse = zod.array(ListDecisionsHandlerResponseItem)


export const GetLatestItemKpiHandlerParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID'),
  "menu_item_id": zod.string().uuid().describe('Menu item ID'),
  "size_label": zod.string().describe('Size label, e.g. one_size')
})

export const getLatestItemKpiHandlerResponseOnePeerComparisonTwoSameCategoryCountMin = 0;



export const GetLatestItemKpiHandlerResponse = zod.object({
  "action": zod.enum(['hold', 'raise_price', 'lower_price', 'bundle', 'remove', 'reformulate', 'monitor']),
  "anchors": zod.object({
  "cost_plus": zod.number().nullish(),
  "peer_median": zod.number(),
  "status_quo": zod.number()
}).describe('Two anchors are universal; the cost-plus anchor is only meaningful with\ncost data, so it\'s optional.'),
  "classification": zod.union([zod.object({
  "mode": zod.enum(['cm']),
  "quadrant": zod.enum(['star', 'plowhorse', 'puzzle', 'dog'])
}),zod.object({
  "class": zod.enum(['hero', 'steady', 'slow', 'quiet']),
  "mode": zod.enum(['revenue'])
}),zod.object({
  "mode": zod.enum(['insufficient'])
})]).describe('Wire shape: `{\"mode\":\"cm\",\"quadrant\":\"star\"}` \/ `{\"mode\":\"revenue\",\"class\":\"hero\"}`\n\/ `{\"mode\":\"insufficient\"}`. By construction `Cm` only ever describes\ncost-tracked items and `Revenue` only cost-missing ones.'),
  "cm_per_unit": zod.number().nullish(),
  "confidence": zod.enum(['low', 'medium', 'high']),
  "cost_missing": zod.boolean().describe('True when cost data is unavailable for this item. Mirrors\n`classification` mode, exposed flat for UI badge rendering.'),
  "cost_reduction_whatif_margin": zod.number().nullish().describe('Only computed for CM-tracked Plowhorses.'),
  "current_price": zod.number(),
  "effective_price": zod.number(),
  "explanation": zod.string(),
  "food_cost_pct": zod.number().nullish(),
  "guard_clips": zod.array(zod.enum(['margin_floor', 'change_cap', 'cultural_rounding'])),
  "item_name": zod.string(),
  "key": zod.object({
  "menu_item_id": zod.string().uuid(),
  "size_label": zod.string()
}).describe('One sellable SKU: a (menu_item_id, size_label) pair.\n`size_label = \"one_size\"` for items without sizes.'),
  "margin_pct": zod.number().nullish(),
  "peer_comparison": zod.union([zod.null(),zod.object({
  "median_cm_per_unit_peers": zod.number().nullish(),
  "median_effective_price_peers": zod.number(),
  "median_margin_pct_peers": zod.number().nullish().describe('Only set when this item is CM-tracked AND peers are CM-tracked too.'),
  "same_category_count": zod.number().min(getLatestItemKpiHandlerResponseOnePeerComparisonTwoSameCategoryCountMin),
  "your_position": zod.enum(['above', 'at', 'below'])
})]).optional(),
  "popularity_share": zod.number(),
  "price_changed_in_window": zod.boolean(),
  "suggested_delta_abs": zod.number().nullish(),
  "suggested_delta_pct": zod.number().nullish(),
  "suggested_price": zod.number().nullish(),
  "units_sold_raw": zod.number()
}).and(zod.object({
  "branch_id": zod.string().uuid(),
  "created_at": zod.string().datetime({"offset":true}),
  "decision": zod.union([zod.null(),zod.object({
  "branch_id": zod.string().uuid(),
  "decided_at": zod.string().datetime({"offset":true}),
  "decided_by": zod.string().uuid(),
  "decision": zod.enum(['accepted', 'rejected', 'ignored']),
  "id": zod.string().uuid(),
  "notes": zod.string().nullish(),
  "suggestion_id": zod.string().uuid(),
  "suggestion_kind": zod.enum(['price', 'bundle', 'removal'])
})]).optional(),
  "id": zod.string().uuid(),
  "run_id": zod.string().uuid()
}))


export const ListRunsHandlerParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const ListRunsHandlerQueryParams = zod.object({
  "limit": zod.number().optional().describe('Page size, clamped to [1, 100]. Default 20.'),
  "before": zod.string().datetime({"offset":true}).optional().describe('Return runs started strictly before this instant (pagination cursor).')
})

export const listRunsHandlerResponseConfigAnalysisWindowDaysDefault = 30;
export const listRunsHandlerResponseConfigBundleDiscountPctRangeDefault = [0.1, 0.25];
export const listRunsHandlerResponseConfigBundleMaxSizeDefault = 3;
export const listRunsHandlerResponseConfigBundleMaxSizeMin = 0;

export const listRunsHandlerResponseConfigBundleTopKPartnersDefault = 5;
export const listRunsHandlerResponseConfigBundleTopKPartnersMin = 0;

export const listRunsHandlerResponseConfigBundleTopNPerFocusDefault = 3;
export const listRunsHandlerResponseConfigBundleTopNPerFocusMin = 0;

export const listRunsHandlerResponseConfigHaloRepeatRateDefault = 0.15;
export const listRunsHandlerResponseConfigMaxPriceChangePctPerCycleDefault = 0.15;
export const listRunsHandlerResponseConfigMinCooccurrencesForBundleDefault = 8;
export const listRunsHandlerResponseConfigMinGrossMarginPctDefault = 0.55;
export const listRunsHandlerResponseConfigMinLiftForBundleDefault = 1.2;
export const listRunsHandlerResponseConfigMinUnitsForClassificationDefault = 20;
export const listRunsHandlerResponseConfigPriceRoundingRuleDefault = `EgyptianCafe`;
export const listRunsHandlerResponseConfigPromotionLiftPriorDefault = 1.25;
export const listRunsHandlerResponseConfigRecencyHalfLifeDaysDefault = 14;
export const listRunsHandlerResponseConfigRevenueModeMaxRaisePctDefault = 0.05;
export const listRunsHandlerResponseConfigTargetFoodCostPctDefault = 0.3;
export const listRunsHandlerResponseModeSummaryItemsCmTrackedMin = 0;

export const listRunsHandlerResponseModeSummaryItemsInsufficientMin = 0;

export const listRunsHandlerResponseModeSummaryItemsRevenueOnlyMin = 0;

export const listRunsHandlerResponseModeSummaryItemsTotalMin = 0;



export const ListRunsHandlerResponseItem = zod.object({
  "branch_id": zod.string().uuid(),
  "completed_at": zod.string().datetime({"offset":true}).nullish(),
  "config": zod.object({
  "analysis_window_days": zod.number().default(listRunsHandlerResponseConfigAnalysisWindowDaysDefault),
  "bundle_discount_pct_range": zod.tuple([zod.number(),
zod.number()]).default(listRunsHandlerResponseConfigBundleDiscountPctRangeDefault),
  "bundle_max_size": zod.number().min(listRunsHandlerResponseConfigBundleMaxSizeMin).default(listRunsHandlerResponseConfigBundleMaxSizeDefault),
  "bundle_top_k_partners": zod.number().min(listRunsHandlerResponseConfigBundleTopKPartnersMin).default(listRunsHandlerResponseConfigBundleTopKPartnersDefault),
  "bundle_top_n_per_focus": zod.number().min(listRunsHandlerResponseConfigBundleTopNPerFocusMin).default(listRunsHandlerResponseConfigBundleTopNPerFocusDefault),
  "halo_repeat_rate": zod.number().default(listRunsHandlerResponseConfigHaloRepeatRateDefault),
  "max_price_change_pct_per_cycle": zod.number().default(listRunsHandlerResponseConfigMaxPriceChangePctPerCycleDefault),
  "min_cooccurrences_for_bundle": zod.number().default(listRunsHandlerResponseConfigMinCooccurrencesForBundleDefault),
  "min_gross_margin_pct": zod.number().default(listRunsHandlerResponseConfigMinGrossMarginPctDefault),
  "min_lift_for_bundle": zod.number().default(listRunsHandlerResponseConfigMinLiftForBundleDefault),
  "min_units_for_classification": zod.number().default(listRunsHandlerResponseConfigMinUnitsForClassificationDefault),
  "price_rounding_rule": zod.enum(['EgyptianCafe', 'NearestUnit']).describe('Serializes as `\"EgyptianCafe\"` \/ `\"NearestUnit\"` — PascalCase on the wire\n(no `rename_all`); existing clients depend on it.').default(listRunsHandlerResponseConfigPriceRoundingRuleDefault),
  "promotion_lift_prior": zod.number().default(listRunsHandlerResponseConfigPromotionLiftPriorDefault),
  "recency_half_life_days": zod.number().default(listRunsHandlerResponseConfigRecencyHalfLifeDaysDefault),
  "revenue_mode_max_raise_pct": zod.number().default(listRunsHandlerResponseConfigRevenueModeMaxRaisePctDefault).describe('Conservative max-raise cap for revenue-only items (no margin floor to\nguard against).'),
  "target_food_cost_pct": zod.number().default(listRunsHandlerResponseConfigTargetFoodCostPctDefault)
}).describe('`#[serde(default)]` lets clients send partial configs; missing fields\ntake the values below. Output serialization is unaffected.'),
  "error_message": zod.string().nullish(),
  "id": zod.string().uuid(),
  "mode_summary": zod.object({
  "items_cm_tracked": zod.number().min(listRunsHandlerResponseModeSummaryItemsCmTrackedMin),
  "items_insufficient": zod.number().min(listRunsHandlerResponseModeSummaryItemsInsufficientMin),
  "items_revenue_only": zod.number().min(listRunsHandlerResponseModeSummaryItemsRevenueOnlyMin),
  "items_total": zod.number().min(listRunsHandlerResponseModeSummaryItemsTotalMin)
}),
  "org_id": zod.string().uuid(),
  "started_at": zod.string().datetime({"offset":true}),
  "status": zod.enum(['in_progress', 'completed', 'failed']),
  "window_days": zod.number()
})
export const ListRunsHandlerResponse = zod.array(ListRunsHandlerResponseItem)


export const CreateRunHandlerParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const createRunHandlerBodyConfigTwoAnalysisWindowDaysDefault = 30;
export const createRunHandlerBodyConfigTwoBundleDiscountPctRangeDefault = [0.1, 0.25];
export const createRunHandlerBodyConfigTwoBundleMaxSizeDefault = 3;
export const createRunHandlerBodyConfigTwoBundleMaxSizeMin = 0;

export const createRunHandlerBodyConfigTwoBundleTopKPartnersDefault = 5;
export const createRunHandlerBodyConfigTwoBundleTopKPartnersMin = 0;

export const createRunHandlerBodyConfigTwoBundleTopNPerFocusDefault = 3;
export const createRunHandlerBodyConfigTwoBundleTopNPerFocusMin = 0;

export const createRunHandlerBodyConfigTwoHaloRepeatRateDefault = 0.15;
export const createRunHandlerBodyConfigTwoMaxPriceChangePctPerCycleDefault = 0.15;
export const createRunHandlerBodyConfigTwoMinCooccurrencesForBundleDefault = 8;
export const createRunHandlerBodyConfigTwoMinGrossMarginPctDefault = 0.55;
export const createRunHandlerBodyConfigTwoMinLiftForBundleDefault = 1.2;
export const createRunHandlerBodyConfigTwoMinUnitsForClassificationDefault = 20;
export const createRunHandlerBodyConfigTwoPriceRoundingRuleDefault = `EgyptianCafe`;
export const createRunHandlerBodyConfigTwoPromotionLiftPriorDefault = 1.25;
export const createRunHandlerBodyConfigTwoRecencyHalfLifeDaysDefault = 14;
export const createRunHandlerBodyConfigTwoRevenueModeMaxRaisePctDefault = 0.05;
export const createRunHandlerBodyConfigTwoTargetFoodCostPctDefault = 0.3;

export const CreateRunHandlerBody = zod.object({
  "config": zod.union([zod.null(),zod.object({
  "analysis_window_days": zod.number().default(createRunHandlerBodyConfigTwoAnalysisWindowDaysDefault),
  "bundle_discount_pct_range": zod.tuple([zod.number(),
zod.number()]).default(createRunHandlerBodyConfigTwoBundleDiscountPctRangeDefault),
  "bundle_max_size": zod.number().min(createRunHandlerBodyConfigTwoBundleMaxSizeMin).default(createRunHandlerBodyConfigTwoBundleMaxSizeDefault),
  "bundle_top_k_partners": zod.number().min(createRunHandlerBodyConfigTwoBundleTopKPartnersMin).default(createRunHandlerBodyConfigTwoBundleTopKPartnersDefault),
  "bundle_top_n_per_focus": zod.number().min(createRunHandlerBodyConfigTwoBundleTopNPerFocusMin).default(createRunHandlerBodyConfigTwoBundleTopNPerFocusDefault),
  "halo_repeat_rate": zod.number().default(createRunHandlerBodyConfigTwoHaloRepeatRateDefault),
  "max_price_change_pct_per_cycle": zod.number().default(createRunHandlerBodyConfigTwoMaxPriceChangePctPerCycleDefault),
  "min_cooccurrences_for_bundle": zod.number().default(createRunHandlerBodyConfigTwoMinCooccurrencesForBundleDefault),
  "min_gross_margin_pct": zod.number().default(createRunHandlerBodyConfigTwoMinGrossMarginPctDefault),
  "min_lift_for_bundle": zod.number().default(createRunHandlerBodyConfigTwoMinLiftForBundleDefault),
  "min_units_for_classification": zod.number().default(createRunHandlerBodyConfigTwoMinUnitsForClassificationDefault),
  "price_rounding_rule": zod.enum(['EgyptianCafe', 'NearestUnit']).describe('Serializes as `\"EgyptianCafe\"` \/ `\"NearestUnit\"` — PascalCase on the wire\n(no `rename_all`); existing clients depend on it.').default(createRunHandlerBodyConfigTwoPriceRoundingRuleDefault),
  "promotion_lift_prior": zod.number().default(createRunHandlerBodyConfigTwoPromotionLiftPriorDefault),
  "recency_half_life_days": zod.number().default(createRunHandlerBodyConfigTwoRecencyHalfLifeDaysDefault),
  "revenue_mode_max_raise_pct": zod.number().default(createRunHandlerBodyConfigTwoRevenueModeMaxRaisePctDefault).describe('Conservative max-raise cap for revenue-only items (no margin floor to\nguard against).'),
  "target_food_cost_pct": zod.number().default(createRunHandlerBodyConfigTwoTargetFoodCostPctDefault)
}).describe('`#[serde(default)]` lets clients send partial configs; missing fields\ntake the values below. Output serialization is unaffected.')]).optional()
})


export const GetActiveRunHandlerParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const getActiveRunHandlerResponseConfigAnalysisWindowDaysDefault = 30;
export const getActiveRunHandlerResponseConfigBundleDiscountPctRangeDefault = [0.1, 0.25];
export const getActiveRunHandlerResponseConfigBundleMaxSizeDefault = 3;
export const getActiveRunHandlerResponseConfigBundleMaxSizeMin = 0;

export const getActiveRunHandlerResponseConfigBundleTopKPartnersDefault = 5;
export const getActiveRunHandlerResponseConfigBundleTopKPartnersMin = 0;

export const getActiveRunHandlerResponseConfigBundleTopNPerFocusDefault = 3;
export const getActiveRunHandlerResponseConfigBundleTopNPerFocusMin = 0;

export const getActiveRunHandlerResponseConfigHaloRepeatRateDefault = 0.15;
export const getActiveRunHandlerResponseConfigMaxPriceChangePctPerCycleDefault = 0.15;
export const getActiveRunHandlerResponseConfigMinCooccurrencesForBundleDefault = 8;
export const getActiveRunHandlerResponseConfigMinGrossMarginPctDefault = 0.55;
export const getActiveRunHandlerResponseConfigMinLiftForBundleDefault = 1.2;
export const getActiveRunHandlerResponseConfigMinUnitsForClassificationDefault = 20;
export const getActiveRunHandlerResponseConfigPriceRoundingRuleDefault = `EgyptianCafe`;
export const getActiveRunHandlerResponseConfigPromotionLiftPriorDefault = 1.25;
export const getActiveRunHandlerResponseConfigRecencyHalfLifeDaysDefault = 14;
export const getActiveRunHandlerResponseConfigRevenueModeMaxRaisePctDefault = 0.05;
export const getActiveRunHandlerResponseConfigTargetFoodCostPctDefault = 0.3;
export const getActiveRunHandlerResponseModeSummaryItemsCmTrackedMin = 0;

export const getActiveRunHandlerResponseModeSummaryItemsInsufficientMin = 0;

export const getActiveRunHandlerResponseModeSummaryItemsRevenueOnlyMin = 0;

export const getActiveRunHandlerResponseModeSummaryItemsTotalMin = 0;



export const GetActiveRunHandlerResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "completed_at": zod.string().datetime({"offset":true}).nullish(),
  "config": zod.object({
  "analysis_window_days": zod.number().default(getActiveRunHandlerResponseConfigAnalysisWindowDaysDefault),
  "bundle_discount_pct_range": zod.tuple([zod.number(),
zod.number()]).default(getActiveRunHandlerResponseConfigBundleDiscountPctRangeDefault),
  "bundle_max_size": zod.number().min(getActiveRunHandlerResponseConfigBundleMaxSizeMin).default(getActiveRunHandlerResponseConfigBundleMaxSizeDefault),
  "bundle_top_k_partners": zod.number().min(getActiveRunHandlerResponseConfigBundleTopKPartnersMin).default(getActiveRunHandlerResponseConfigBundleTopKPartnersDefault),
  "bundle_top_n_per_focus": zod.number().min(getActiveRunHandlerResponseConfigBundleTopNPerFocusMin).default(getActiveRunHandlerResponseConfigBundleTopNPerFocusDefault),
  "halo_repeat_rate": zod.number().default(getActiveRunHandlerResponseConfigHaloRepeatRateDefault),
  "max_price_change_pct_per_cycle": zod.number().default(getActiveRunHandlerResponseConfigMaxPriceChangePctPerCycleDefault),
  "min_cooccurrences_for_bundle": zod.number().default(getActiveRunHandlerResponseConfigMinCooccurrencesForBundleDefault),
  "min_gross_margin_pct": zod.number().default(getActiveRunHandlerResponseConfigMinGrossMarginPctDefault),
  "min_lift_for_bundle": zod.number().default(getActiveRunHandlerResponseConfigMinLiftForBundleDefault),
  "min_units_for_classification": zod.number().default(getActiveRunHandlerResponseConfigMinUnitsForClassificationDefault),
  "price_rounding_rule": zod.enum(['EgyptianCafe', 'NearestUnit']).describe('Serializes as `\"EgyptianCafe\"` \/ `\"NearestUnit\"` — PascalCase on the wire\n(no `rename_all`); existing clients depend on it.').default(getActiveRunHandlerResponseConfigPriceRoundingRuleDefault),
  "promotion_lift_prior": zod.number().default(getActiveRunHandlerResponseConfigPromotionLiftPriorDefault),
  "recency_half_life_days": zod.number().default(getActiveRunHandlerResponseConfigRecencyHalfLifeDaysDefault),
  "revenue_mode_max_raise_pct": zod.number().default(getActiveRunHandlerResponseConfigRevenueModeMaxRaisePctDefault).describe('Conservative max-raise cap for revenue-only items (no margin floor to\nguard against).'),
  "target_food_cost_pct": zod.number().default(getActiveRunHandlerResponseConfigTargetFoodCostPctDefault)
}).describe('`#[serde(default)]` lets clients send partial configs; missing fields\ntake the values below. Output serialization is unaffected.'),
  "error_message": zod.string().nullish(),
  "id": zod.string().uuid(),
  "mode_summary": zod.object({
  "items_cm_tracked": zod.number().min(getActiveRunHandlerResponseModeSummaryItemsCmTrackedMin),
  "items_insufficient": zod.number().min(getActiveRunHandlerResponseModeSummaryItemsInsufficientMin),
  "items_revenue_only": zod.number().min(getActiveRunHandlerResponseModeSummaryItemsRevenueOnlyMin),
  "items_total": zod.number().min(getActiveRunHandlerResponseModeSummaryItemsTotalMin)
}),
  "org_id": zod.string().uuid(),
  "started_at": zod.string().datetime({"offset":true}),
  "status": zod.enum(['in_progress', 'completed', 'failed']),
  "window_days": zod.number()
})


export const GetLatestRunHandlerParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const GetLatestRunHandlerQueryParams = zod.object({
  "any_status": zod.boolean().optional().describe('When true, return the latest run regardless of status so the client\ncan show failed runs (error_message) instead of an empty state.')
})

export const getLatestRunHandlerResponseConfigAnalysisWindowDaysDefault = 30;
export const getLatestRunHandlerResponseConfigBundleDiscountPctRangeDefault = [0.1, 0.25];
export const getLatestRunHandlerResponseConfigBundleMaxSizeDefault = 3;
export const getLatestRunHandlerResponseConfigBundleMaxSizeMin = 0;

export const getLatestRunHandlerResponseConfigBundleTopKPartnersDefault = 5;
export const getLatestRunHandlerResponseConfigBundleTopKPartnersMin = 0;

export const getLatestRunHandlerResponseConfigBundleTopNPerFocusDefault = 3;
export const getLatestRunHandlerResponseConfigBundleTopNPerFocusMin = 0;

export const getLatestRunHandlerResponseConfigHaloRepeatRateDefault = 0.15;
export const getLatestRunHandlerResponseConfigMaxPriceChangePctPerCycleDefault = 0.15;
export const getLatestRunHandlerResponseConfigMinCooccurrencesForBundleDefault = 8;
export const getLatestRunHandlerResponseConfigMinGrossMarginPctDefault = 0.55;
export const getLatestRunHandlerResponseConfigMinLiftForBundleDefault = 1.2;
export const getLatestRunHandlerResponseConfigMinUnitsForClassificationDefault = 20;
export const getLatestRunHandlerResponseConfigPriceRoundingRuleDefault = `EgyptianCafe`;
export const getLatestRunHandlerResponseConfigPromotionLiftPriorDefault = 1.25;
export const getLatestRunHandlerResponseConfigRecencyHalfLifeDaysDefault = 14;
export const getLatestRunHandlerResponseConfigRevenueModeMaxRaisePctDefault = 0.05;
export const getLatestRunHandlerResponseConfigTargetFoodCostPctDefault = 0.3;
export const getLatestRunHandlerResponseModeSummaryItemsCmTrackedMin = 0;

export const getLatestRunHandlerResponseModeSummaryItemsInsufficientMin = 0;

export const getLatestRunHandlerResponseModeSummaryItemsRevenueOnlyMin = 0;

export const getLatestRunHandlerResponseModeSummaryItemsTotalMin = 0;



export const GetLatestRunHandlerResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "completed_at": zod.string().datetime({"offset":true}).nullish(),
  "config": zod.object({
  "analysis_window_days": zod.number().default(getLatestRunHandlerResponseConfigAnalysisWindowDaysDefault),
  "bundle_discount_pct_range": zod.tuple([zod.number(),
zod.number()]).default(getLatestRunHandlerResponseConfigBundleDiscountPctRangeDefault),
  "bundle_max_size": zod.number().min(getLatestRunHandlerResponseConfigBundleMaxSizeMin).default(getLatestRunHandlerResponseConfigBundleMaxSizeDefault),
  "bundle_top_k_partners": zod.number().min(getLatestRunHandlerResponseConfigBundleTopKPartnersMin).default(getLatestRunHandlerResponseConfigBundleTopKPartnersDefault),
  "bundle_top_n_per_focus": zod.number().min(getLatestRunHandlerResponseConfigBundleTopNPerFocusMin).default(getLatestRunHandlerResponseConfigBundleTopNPerFocusDefault),
  "halo_repeat_rate": zod.number().default(getLatestRunHandlerResponseConfigHaloRepeatRateDefault),
  "max_price_change_pct_per_cycle": zod.number().default(getLatestRunHandlerResponseConfigMaxPriceChangePctPerCycleDefault),
  "min_cooccurrences_for_bundle": zod.number().default(getLatestRunHandlerResponseConfigMinCooccurrencesForBundleDefault),
  "min_gross_margin_pct": zod.number().default(getLatestRunHandlerResponseConfigMinGrossMarginPctDefault),
  "min_lift_for_bundle": zod.number().default(getLatestRunHandlerResponseConfigMinLiftForBundleDefault),
  "min_units_for_classification": zod.number().default(getLatestRunHandlerResponseConfigMinUnitsForClassificationDefault),
  "price_rounding_rule": zod.enum(['EgyptianCafe', 'NearestUnit']).describe('Serializes as `\"EgyptianCafe\"` \/ `\"NearestUnit\"` — PascalCase on the wire\n(no `rename_all`); existing clients depend on it.').default(getLatestRunHandlerResponseConfigPriceRoundingRuleDefault),
  "promotion_lift_prior": zod.number().default(getLatestRunHandlerResponseConfigPromotionLiftPriorDefault),
  "recency_half_life_days": zod.number().default(getLatestRunHandlerResponseConfigRecencyHalfLifeDaysDefault),
  "revenue_mode_max_raise_pct": zod.number().default(getLatestRunHandlerResponseConfigRevenueModeMaxRaisePctDefault).describe('Conservative max-raise cap for revenue-only items (no margin floor to\nguard against).'),
  "target_food_cost_pct": zod.number().default(getLatestRunHandlerResponseConfigTargetFoodCostPctDefault)
}).describe('`#[serde(default)]` lets clients send partial configs; missing fields\ntake the values below. Output serialization is unaffected.'),
  "error_message": zod.string().nullish(),
  "id": zod.string().uuid(),
  "mode_summary": zod.object({
  "items_cm_tracked": zod.number().min(getLatestRunHandlerResponseModeSummaryItemsCmTrackedMin),
  "items_insufficient": zod.number().min(getLatestRunHandlerResponseModeSummaryItemsInsufficientMin),
  "items_revenue_only": zod.number().min(getLatestRunHandlerResponseModeSummaryItemsRevenueOnlyMin),
  "items_total": zod.number().min(getLatestRunHandlerResponseModeSummaryItemsTotalMin)
}),
  "org_id": zod.string().uuid(),
  "started_at": zod.string().datetime({"offset":true}),
  "status": zod.enum(['in_progress', 'completed', 'failed']),
  "window_days": zod.number()
})


export const GetBundleSuggestionHandlerParams = zod.object({
  "id": zod.string().uuid().describe('Bundle suggestion ID')
})

export const GetBundleSuggestionHandlerResponse = zod.object({
  "association": zod.object({
  "composite_score": zod.number(),
  "pair_lifts": zod.array(zod.object({
  "confidence_ab": zod.number().describe('Directional: P(item_b in basket | item_a in basket), item_a = focus.'),
  "item_a": zod.object({
  "menu_item_id": zod.string().uuid(),
  "size_label": zod.string()
}).describe('One sellable SKU: a (menu_item_id, size_label) pair.\n`size_label = \"one_size\"` for items without sizes.'),
  "item_b": zod.object({
  "menu_item_id": zod.string().uuid(),
  "size_label": zod.string()
}).describe('One sellable SKU: a (menu_item_id, size_label) pair.\n`size_label = \"one_size\"` for items without sizes.'),
  "lift": zod.number(),
  "support": zod.number()
}))
}),
  "bundle_cm": zod.number().nullish(),
  "bundle_cost": zod.number().nullish().describe('All cost-derived fields are `None` when any component lacks cost data.'),
  "bundle_discount_pct": zod.number(),
  "bundle_items": zod.array(zod.object({
  "menu_item_id": zod.string().uuid(),
  "size_label": zod.string()
}).describe('One sellable SKU: a (menu_item_id, size_label) pair.\n`size_label = \"one_size\"` for items without sizes.')),
  "bundle_list_price": zod.number(),
  "bundle_margin_pct": zod.number().nullish(),
  "bundle_suggested_price": zod.number(),
  "explanation": zod.string(),
  "focus_item": zod.object({
  "menu_item_id": zod.string().uuid(),
  "size_label": zod.string()
}).describe('One sellable SKU: a (menu_item_id, size_label) pair.\n`size_label = \"one_size\"` for items without sizes.'),
  "forecast": zod.object({
  "expected_velocity": zod.object({
  "hi": zod.number(),
  "lo": zod.number(),
  "mid": zod.number()
}),
  "halo_units_x": zod.number(),
  "incremental_cm": zod.union([zod.null(),zod.object({
  "hi": zod.number(),
  "lo": zod.number(),
  "mid": zod.number()
}).describe('`None` when any component is cost-missing — CM math is impossible.')]).optional(),
  "inside_bundle_units_x": zod.number(),
  "total_units_uplift_x": zod.number()
}),
  "guard_clips": zod.array(zod.enum(['margin_floor', 'change_cap', 'cultural_rounding'])),
  "missing_costs": zod.boolean().describe('True ⟺ at least one component is cost-missing.')
}).and(zod.object({
  "branch_id": zod.string().uuid(),
  "created_at": zod.string().datetime({"offset":true}),
  "decision": zod.union([zod.null(),zod.object({
  "branch_id": zod.string().uuid(),
  "decided_at": zod.string().datetime({"offset":true}),
  "decided_by": zod.string().uuid(),
  "decision": zod.enum(['accepted', 'rejected', 'ignored']),
  "id": zod.string().uuid(),
  "notes": zod.string().nullish(),
  "suggestion_id": zod.string().uuid(),
  "suggestion_kind": zod.enum(['price', 'bundle', 'removal'])
})]).optional(),
  "id": zod.string().uuid(),
  "promoted_bundle_id": zod.string().uuid().nullish(),
  "run_id": zod.string().uuid()
}))


export const SetBundlePromotedHandlerParams = zod.object({
  "id": zod.string().uuid().describe('Bundle suggestion ID')
})

export const SetBundlePromotedHandlerBody = zod.object({
  "bundle_id": zod.string().uuid()
})


export const RecordDecisionHandlerBody = zod.object({
  "branch_id": zod.string().uuid(),
  "decision": zod.string().describe('accepted | rejected | ignored — kept as a string so invalid values\nyield a 400 instead of a deserialization error.'),
  "notes": zod.string().nullish(),
  "suggestion_id": zod.string().uuid(),
  "suggestion_kind": zod.enum(['price', 'bundle', 'removal'])
})

export const RecordDecisionHandlerResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "decided_at": zod.string().datetime({"offset":true}),
  "decided_by": zod.string().uuid(),
  "decision": zod.enum(['accepted', 'rejected', 'ignored']),
  "id": zod.string().uuid(),
  "notes": zod.string().nullish(),
  "suggestion_id": zod.string().uuid(),
  "suggestion_kind": zod.enum(['price', 'bundle', 'removal'])
})


export const GetPriceSuggestionHandlerParams = zod.object({
  "id": zod.string().uuid().describe('Price suggestion ID')
})

export const getPriceSuggestionHandlerResponseOnePeerComparisonTwoSameCategoryCountMin = 0;



export const GetPriceSuggestionHandlerResponse = zod.object({
  "action": zod.enum(['hold', 'raise_price', 'lower_price', 'bundle', 'remove', 'reformulate', 'monitor']),
  "anchors": zod.object({
  "cost_plus": zod.number().nullish(),
  "peer_median": zod.number(),
  "status_quo": zod.number()
}).describe('Two anchors are universal; the cost-plus anchor is only meaningful with\ncost data, so it\'s optional.'),
  "classification": zod.union([zod.object({
  "mode": zod.enum(['cm']),
  "quadrant": zod.enum(['star', 'plowhorse', 'puzzle', 'dog'])
}),zod.object({
  "class": zod.enum(['hero', 'steady', 'slow', 'quiet']),
  "mode": zod.enum(['revenue'])
}),zod.object({
  "mode": zod.enum(['insufficient'])
})]).describe('Wire shape: `{\"mode\":\"cm\",\"quadrant\":\"star\"}` \/ `{\"mode\":\"revenue\",\"class\":\"hero\"}`\n\/ `{\"mode\":\"insufficient\"}`. By construction `Cm` only ever describes\ncost-tracked items and `Revenue` only cost-missing ones.'),
  "cm_per_unit": zod.number().nullish(),
  "confidence": zod.enum(['low', 'medium', 'high']),
  "cost_missing": zod.boolean().describe('True when cost data is unavailable for this item. Mirrors\n`classification` mode, exposed flat for UI badge rendering.'),
  "cost_reduction_whatif_margin": zod.number().nullish().describe('Only computed for CM-tracked Plowhorses.'),
  "current_price": zod.number(),
  "effective_price": zod.number(),
  "explanation": zod.string(),
  "food_cost_pct": zod.number().nullish(),
  "guard_clips": zod.array(zod.enum(['margin_floor', 'change_cap', 'cultural_rounding'])),
  "item_name": zod.string(),
  "key": zod.object({
  "menu_item_id": zod.string().uuid(),
  "size_label": zod.string()
}).describe('One sellable SKU: a (menu_item_id, size_label) pair.\n`size_label = \"one_size\"` for items without sizes.'),
  "margin_pct": zod.number().nullish(),
  "peer_comparison": zod.union([zod.null(),zod.object({
  "median_cm_per_unit_peers": zod.number().nullish(),
  "median_effective_price_peers": zod.number(),
  "median_margin_pct_peers": zod.number().nullish().describe('Only set when this item is CM-tracked AND peers are CM-tracked too.'),
  "same_category_count": zod.number().min(getPriceSuggestionHandlerResponseOnePeerComparisonTwoSameCategoryCountMin),
  "your_position": zod.enum(['above', 'at', 'below'])
})]).optional(),
  "popularity_share": zod.number(),
  "price_changed_in_window": zod.boolean(),
  "suggested_delta_abs": zod.number().nullish(),
  "suggested_delta_pct": zod.number().nullish(),
  "suggested_price": zod.number().nullish(),
  "units_sold_raw": zod.number()
}).and(zod.object({
  "branch_id": zod.string().uuid(),
  "created_at": zod.string().datetime({"offset":true}),
  "decision": zod.union([zod.null(),zod.object({
  "branch_id": zod.string().uuid(),
  "decided_at": zod.string().datetime({"offset":true}),
  "decided_by": zod.string().uuid(),
  "decision": zod.enum(['accepted', 'rejected', 'ignored']),
  "id": zod.string().uuid(),
  "notes": zod.string().nullish(),
  "suggestion_id": zod.string().uuid(),
  "suggestion_kind": zod.enum(['price', 'bundle', 'removal'])
})]).optional(),
  "id": zod.string().uuid(),
  "run_id": zod.string().uuid()
}))


export const GetRemovalScenarioHandlerParams = zod.object({
  "id": zod.string().uuid().describe('Removal scenario ID')
})

export const GetRemovalScenarioHandlerResponse = zod.object({
  "absorbed_by": zod.array(zod.object({
  "absorbed_cm": zod.number(),
  "absorbed_units": zod.number(),
  "key": zod.object({
  "menu_item_id": zod.string().uuid(),
  "size_label": zod.string()
}).describe('One sellable SKU: a (menu_item_id, size_label) pair.\n`size_label = \"one_size\"` for items without sizes.')
})),
  "baseline_cm": zod.number(),
  "complementary_losses": zod.array(zod.object({
  "key": zod.object({
  "menu_item_id": zod.string().uuid(),
  "size_label": zod.string()
}).describe('One sellable SKU: a (menu_item_id, size_label) pair.\n`size_label = \"one_size\"` for items without sizes.'),
  "lost_cm": zod.number(),
  "lost_units": zod.number()
})),
  "explanation": zod.string(),
  "item_name": zod.string(),
  "key": zod.object({
  "menu_item_id": zod.string().uuid(),
  "size_label": zod.string()
}).describe('One sellable SKU: a (menu_item_id, size_label) pair.\n`size_label = \"one_size\"` for items without sizes.'),
  "net_cm_change": zod.number(),
  "net_cm_change_hi": zod.number(),
  "net_cm_change_lo": zod.number(),
  "recommendation": zod.enum(['remove', 'keep_and_bundle', 'keep_and_reformulate', 'no_strong_signal'])
}).and(zod.object({
  "branch_id": zod.string().uuid(),
  "created_at": zod.string().datetime({"offset":true}),
  "decision": zod.union([zod.null(),zod.object({
  "branch_id": zod.string().uuid(),
  "decided_at": zod.string().datetime({"offset":true}),
  "decided_by": zod.string().uuid(),
  "decision": zod.enum(['accepted', 'rejected', 'ignored']),
  "id": zod.string().uuid(),
  "notes": zod.string().nullish(),
  "suggestion_id": zod.string().uuid(),
  "suggestion_kind": zod.enum(['price', 'bundle', 'removal'])
})]).optional(),
  "id": zod.string().uuid(),
  "run_id": zod.string().uuid()
}))


export const GetRunHandlerParams = zod.object({
  "id": zod.string().uuid().describe('Run ID')
})

export const getRunHandlerResponseConfigAnalysisWindowDaysDefault = 30;
export const getRunHandlerResponseConfigBundleDiscountPctRangeDefault = [0.1, 0.25];
export const getRunHandlerResponseConfigBundleMaxSizeDefault = 3;
export const getRunHandlerResponseConfigBundleMaxSizeMin = 0;

export const getRunHandlerResponseConfigBundleTopKPartnersDefault = 5;
export const getRunHandlerResponseConfigBundleTopKPartnersMin = 0;

export const getRunHandlerResponseConfigBundleTopNPerFocusDefault = 3;
export const getRunHandlerResponseConfigBundleTopNPerFocusMin = 0;

export const getRunHandlerResponseConfigHaloRepeatRateDefault = 0.15;
export const getRunHandlerResponseConfigMaxPriceChangePctPerCycleDefault = 0.15;
export const getRunHandlerResponseConfigMinCooccurrencesForBundleDefault = 8;
export const getRunHandlerResponseConfigMinGrossMarginPctDefault = 0.55;
export const getRunHandlerResponseConfigMinLiftForBundleDefault = 1.2;
export const getRunHandlerResponseConfigMinUnitsForClassificationDefault = 20;
export const getRunHandlerResponseConfigPriceRoundingRuleDefault = `EgyptianCafe`;
export const getRunHandlerResponseConfigPromotionLiftPriorDefault = 1.25;
export const getRunHandlerResponseConfigRecencyHalfLifeDaysDefault = 14;
export const getRunHandlerResponseConfigRevenueModeMaxRaisePctDefault = 0.05;
export const getRunHandlerResponseConfigTargetFoodCostPctDefault = 0.3;
export const getRunHandlerResponseModeSummaryItemsCmTrackedMin = 0;

export const getRunHandlerResponseModeSummaryItemsInsufficientMin = 0;

export const getRunHandlerResponseModeSummaryItemsRevenueOnlyMin = 0;

export const getRunHandlerResponseModeSummaryItemsTotalMin = 0;



export const GetRunHandlerResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "completed_at": zod.string().datetime({"offset":true}).nullish(),
  "config": zod.object({
  "analysis_window_days": zod.number().default(getRunHandlerResponseConfigAnalysisWindowDaysDefault),
  "bundle_discount_pct_range": zod.tuple([zod.number(),
zod.number()]).default(getRunHandlerResponseConfigBundleDiscountPctRangeDefault),
  "bundle_max_size": zod.number().min(getRunHandlerResponseConfigBundleMaxSizeMin).default(getRunHandlerResponseConfigBundleMaxSizeDefault),
  "bundle_top_k_partners": zod.number().min(getRunHandlerResponseConfigBundleTopKPartnersMin).default(getRunHandlerResponseConfigBundleTopKPartnersDefault),
  "bundle_top_n_per_focus": zod.number().min(getRunHandlerResponseConfigBundleTopNPerFocusMin).default(getRunHandlerResponseConfigBundleTopNPerFocusDefault),
  "halo_repeat_rate": zod.number().default(getRunHandlerResponseConfigHaloRepeatRateDefault),
  "max_price_change_pct_per_cycle": zod.number().default(getRunHandlerResponseConfigMaxPriceChangePctPerCycleDefault),
  "min_cooccurrences_for_bundle": zod.number().default(getRunHandlerResponseConfigMinCooccurrencesForBundleDefault),
  "min_gross_margin_pct": zod.number().default(getRunHandlerResponseConfigMinGrossMarginPctDefault),
  "min_lift_for_bundle": zod.number().default(getRunHandlerResponseConfigMinLiftForBundleDefault),
  "min_units_for_classification": zod.number().default(getRunHandlerResponseConfigMinUnitsForClassificationDefault),
  "price_rounding_rule": zod.enum(['EgyptianCafe', 'NearestUnit']).describe('Serializes as `\"EgyptianCafe\"` \/ `\"NearestUnit\"` — PascalCase on the wire\n(no `rename_all`); existing clients depend on it.').default(getRunHandlerResponseConfigPriceRoundingRuleDefault),
  "promotion_lift_prior": zod.number().default(getRunHandlerResponseConfigPromotionLiftPriorDefault),
  "recency_half_life_days": zod.number().default(getRunHandlerResponseConfigRecencyHalfLifeDaysDefault),
  "revenue_mode_max_raise_pct": zod.number().default(getRunHandlerResponseConfigRevenueModeMaxRaisePctDefault).describe('Conservative max-raise cap for revenue-only items (no margin floor to\nguard against).'),
  "target_food_cost_pct": zod.number().default(getRunHandlerResponseConfigTargetFoodCostPctDefault)
}).describe('`#[serde(default)]` lets clients send partial configs; missing fields\ntake the values below. Output serialization is unaffected.'),
  "error_message": zod.string().nullish(),
  "id": zod.string().uuid(),
  "mode_summary": zod.object({
  "items_cm_tracked": zod.number().min(getRunHandlerResponseModeSummaryItemsCmTrackedMin),
  "items_insufficient": zod.number().min(getRunHandlerResponseModeSummaryItemsInsufficientMin),
  "items_revenue_only": zod.number().min(getRunHandlerResponseModeSummaryItemsRevenueOnlyMin),
  "items_total": zod.number().min(getRunHandlerResponseModeSummaryItemsTotalMin)
}),
  "org_id": zod.string().uuid(),
  "started_at": zod.string().datetime({"offset":true}),
  "status": zod.enum(['in_progress', 'completed', 'failed']),
  "window_days": zod.number()
})


export const ListBundleSuggestionsHandlerParams = zod.object({
  "id": zod.string().uuid().describe('Run ID')
})

export const ListBundleSuggestionsHandlerQueryParams = zod.object({
  "missing_costs": zod.boolean().optional(),
  "focus_menu_item_id": zod.string().uuid().optional(),
  "decision_status": zod.string().optional().describe('accepted | rejected | ignored | pending')
})

export const ListBundleSuggestionsHandlerResponseItem = zod.object({
  "association": zod.object({
  "composite_score": zod.number(),
  "pair_lifts": zod.array(zod.object({
  "confidence_ab": zod.number().describe('Directional: P(item_b in basket | item_a in basket), item_a = focus.'),
  "item_a": zod.object({
  "menu_item_id": zod.string().uuid(),
  "size_label": zod.string()
}).describe('One sellable SKU: a (menu_item_id, size_label) pair.\n`size_label = \"one_size\"` for items without sizes.'),
  "item_b": zod.object({
  "menu_item_id": zod.string().uuid(),
  "size_label": zod.string()
}).describe('One sellable SKU: a (menu_item_id, size_label) pair.\n`size_label = \"one_size\"` for items without sizes.'),
  "lift": zod.number(),
  "support": zod.number()
}))
}),
  "bundle_cm": zod.number().nullish(),
  "bundle_cost": zod.number().nullish().describe('All cost-derived fields are `None` when any component lacks cost data.'),
  "bundle_discount_pct": zod.number(),
  "bundle_items": zod.array(zod.object({
  "menu_item_id": zod.string().uuid(),
  "size_label": zod.string()
}).describe('One sellable SKU: a (menu_item_id, size_label) pair.\n`size_label = \"one_size\"` for items without sizes.')),
  "bundle_list_price": zod.number(),
  "bundle_margin_pct": zod.number().nullish(),
  "bundle_suggested_price": zod.number(),
  "explanation": zod.string(),
  "focus_item": zod.object({
  "menu_item_id": zod.string().uuid(),
  "size_label": zod.string()
}).describe('One sellable SKU: a (menu_item_id, size_label) pair.\n`size_label = \"one_size\"` for items without sizes.'),
  "forecast": zod.object({
  "expected_velocity": zod.object({
  "hi": zod.number(),
  "lo": zod.number(),
  "mid": zod.number()
}),
  "halo_units_x": zod.number(),
  "incremental_cm": zod.union([zod.null(),zod.object({
  "hi": zod.number(),
  "lo": zod.number(),
  "mid": zod.number()
}).describe('`None` when any component is cost-missing — CM math is impossible.')]).optional(),
  "inside_bundle_units_x": zod.number(),
  "total_units_uplift_x": zod.number()
}),
  "guard_clips": zod.array(zod.enum(['margin_floor', 'change_cap', 'cultural_rounding'])),
  "missing_costs": zod.boolean().describe('True ⟺ at least one component is cost-missing.')
}).and(zod.object({
  "branch_id": zod.string().uuid(),
  "created_at": zod.string().datetime({"offset":true}),
  "decision": zod.union([zod.null(),zod.object({
  "branch_id": zod.string().uuid(),
  "decided_at": zod.string().datetime({"offset":true}),
  "decided_by": zod.string().uuid(),
  "decision": zod.enum(['accepted', 'rejected', 'ignored']),
  "id": zod.string().uuid(),
  "notes": zod.string().nullish(),
  "suggestion_id": zod.string().uuid(),
  "suggestion_kind": zod.enum(['price', 'bundle', 'removal'])
})]).optional(),
  "id": zod.string().uuid(),
  "promoted_bundle_id": zod.string().uuid().nullish(),
  "run_id": zod.string().uuid()
}))
export const ListBundleSuggestionsHandlerResponse = zod.array(ListBundleSuggestionsHandlerResponseItem)


export const ListPriceSuggestionsHandlerParams = zod.object({
  "id": zod.string().uuid().describe('Run ID')
})

export const ListPriceSuggestionsHandlerQueryParams = zod.object({
  "classification_mode": zod.string().optional().describe('cm | revenue | insufficient'),
  "cm_quadrant": zod.string().optional().describe('star | plowhorse | puzzle | dog'),
  "revenue_class": zod.string().optional().describe('hero | steady | slow | quiet'),
  "action": zod.string().optional().describe('hold | raise_price | lower_price | bundle | remove | reformulate | monitor'),
  "confidence": zod.string().optional().describe('low | medium | high'),
  "category_id": zod.string().uuid().optional(),
  "decision_status": zod.string().optional().describe('accepted | rejected | ignored | pending'),
  "search": zod.string().optional().describe('Case-insensitive substring match on item name.')
})

export const listPriceSuggestionsHandlerResponseOnePeerComparisonTwoSameCategoryCountMin = 0;



export const ListPriceSuggestionsHandlerResponseItem = zod.object({
  "action": zod.enum(['hold', 'raise_price', 'lower_price', 'bundle', 'remove', 'reformulate', 'monitor']),
  "anchors": zod.object({
  "cost_plus": zod.number().nullish(),
  "peer_median": zod.number(),
  "status_quo": zod.number()
}).describe('Two anchors are universal; the cost-plus anchor is only meaningful with\ncost data, so it\'s optional.'),
  "classification": zod.union([zod.object({
  "mode": zod.enum(['cm']),
  "quadrant": zod.enum(['star', 'plowhorse', 'puzzle', 'dog'])
}),zod.object({
  "class": zod.enum(['hero', 'steady', 'slow', 'quiet']),
  "mode": zod.enum(['revenue'])
}),zod.object({
  "mode": zod.enum(['insufficient'])
})]).describe('Wire shape: `{\"mode\":\"cm\",\"quadrant\":\"star\"}` \/ `{\"mode\":\"revenue\",\"class\":\"hero\"}`\n\/ `{\"mode\":\"insufficient\"}`. By construction `Cm` only ever describes\ncost-tracked items and `Revenue` only cost-missing ones.'),
  "cm_per_unit": zod.number().nullish(),
  "confidence": zod.enum(['low', 'medium', 'high']),
  "cost_missing": zod.boolean().describe('True when cost data is unavailable for this item. Mirrors\n`classification` mode, exposed flat for UI badge rendering.'),
  "cost_reduction_whatif_margin": zod.number().nullish().describe('Only computed for CM-tracked Plowhorses.'),
  "current_price": zod.number(),
  "effective_price": zod.number(),
  "explanation": zod.string(),
  "food_cost_pct": zod.number().nullish(),
  "guard_clips": zod.array(zod.enum(['margin_floor', 'change_cap', 'cultural_rounding'])),
  "item_name": zod.string(),
  "key": zod.object({
  "menu_item_id": zod.string().uuid(),
  "size_label": zod.string()
}).describe('One sellable SKU: a (menu_item_id, size_label) pair.\n`size_label = \"one_size\"` for items without sizes.'),
  "margin_pct": zod.number().nullish(),
  "peer_comparison": zod.union([zod.null(),zod.object({
  "median_cm_per_unit_peers": zod.number().nullish(),
  "median_effective_price_peers": zod.number(),
  "median_margin_pct_peers": zod.number().nullish().describe('Only set when this item is CM-tracked AND peers are CM-tracked too.'),
  "same_category_count": zod.number().min(listPriceSuggestionsHandlerResponseOnePeerComparisonTwoSameCategoryCountMin),
  "your_position": zod.enum(['above', 'at', 'below'])
})]).optional(),
  "popularity_share": zod.number(),
  "price_changed_in_window": zod.boolean(),
  "suggested_delta_abs": zod.number().nullish(),
  "suggested_delta_pct": zod.number().nullish(),
  "suggested_price": zod.number().nullish(),
  "units_sold_raw": zod.number()
}).and(zod.object({
  "branch_id": zod.string().uuid(),
  "created_at": zod.string().datetime({"offset":true}),
  "decision": zod.union([zod.null(),zod.object({
  "branch_id": zod.string().uuid(),
  "decided_at": zod.string().datetime({"offset":true}),
  "decided_by": zod.string().uuid(),
  "decision": zod.enum(['accepted', 'rejected', 'ignored']),
  "id": zod.string().uuid(),
  "notes": zod.string().nullish(),
  "suggestion_id": zod.string().uuid(),
  "suggestion_kind": zod.enum(['price', 'bundle', 'removal'])
})]).optional(),
  "id": zod.string().uuid(),
  "run_id": zod.string().uuid()
}))
export const ListPriceSuggestionsHandlerResponse = zod.array(ListPriceSuggestionsHandlerResponseItem)


export const ListRemovalScenariosHandlerParams = zod.object({
  "id": zod.string().uuid().describe('Run ID')
})

export const ListRemovalScenariosHandlerQueryParams = zod.object({
  "recommendation": zod.string().optional().describe('remove | keep_and_bundle | keep_and_reformulate | no_strong_signal'),
  "decision_status": zod.string().optional().describe('accepted | rejected | ignored | pending')
})

export const ListRemovalScenariosHandlerResponseItem = zod.object({
  "absorbed_by": zod.array(zod.object({
  "absorbed_cm": zod.number(),
  "absorbed_units": zod.number(),
  "key": zod.object({
  "menu_item_id": zod.string().uuid(),
  "size_label": zod.string()
}).describe('One sellable SKU: a (menu_item_id, size_label) pair.\n`size_label = \"one_size\"` for items without sizes.')
})),
  "baseline_cm": zod.number(),
  "complementary_losses": zod.array(zod.object({
  "key": zod.object({
  "menu_item_id": zod.string().uuid(),
  "size_label": zod.string()
}).describe('One sellable SKU: a (menu_item_id, size_label) pair.\n`size_label = \"one_size\"` for items without sizes.'),
  "lost_cm": zod.number(),
  "lost_units": zod.number()
})),
  "explanation": zod.string(),
  "item_name": zod.string(),
  "key": zod.object({
  "menu_item_id": zod.string().uuid(),
  "size_label": zod.string()
}).describe('One sellable SKU: a (menu_item_id, size_label) pair.\n`size_label = \"one_size\"` for items without sizes.'),
  "net_cm_change": zod.number(),
  "net_cm_change_hi": zod.number(),
  "net_cm_change_lo": zod.number(),
  "recommendation": zod.enum(['remove', 'keep_and_bundle', 'keep_and_reformulate', 'no_strong_signal'])
}).and(zod.object({
  "branch_id": zod.string().uuid(),
  "created_at": zod.string().datetime({"offset":true}),
  "decision": zod.union([zod.null(),zod.object({
  "branch_id": zod.string().uuid(),
  "decided_at": zod.string().datetime({"offset":true}),
  "decided_by": zod.string().uuid(),
  "decision": zod.enum(['accepted', 'rejected', 'ignored']),
  "id": zod.string().uuid(),
  "notes": zod.string().nullish(),
  "suggestion_id": zod.string().uuid(),
  "suggestion_kind": zod.enum(['price', 'bundle', 'removal'])
})]).optional(),
  "id": zod.string().uuid(),
  "run_id": zod.string().uuid()
}))
export const ListRemovalScenariosHandlerResponse = zod.array(ListRemovalScenariosHandlerResponseItem)


export const ListMenuItemsQueryParams = zod.object({
  "org_id": zod.string().uuid(),
  "category_id": zod.string().uuid().optional(),
  "full": zod.boolean().optional().describe('When true, embed sizes + addon slots + optionals + recipes per item\n(the shape the POS\/teller consumes). Always returns a plain, unpaginated\narray — the POS depends on this contract.'),
  "branch_id": zod.string().uuid().optional().describe('When set, prices are branch-effective (branch override replaces base_price)\nand items disabled at this branch are excluded — the per-branch menu the POS\nconsumes. Omitted → the plain org catalog (legacy behaviour).')
})

export const ListMenuItemsResponseItem = zod.object({
  "base_price": zod.number(),
  "category_id": zod.string().uuid().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "default_milk_addon_id": zod.string().nullish(),
  "deleted_at": zod.string().datetime({"offset":true}).nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.object({

}).passthrough(),
  "id": zod.string().uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough(),
  "org_id": zod.string().uuid(),
  "updated_at": zod.string().datetime({"offset":true})
})
export const ListMenuItemsResponse = zod.array(ListMenuItemsResponseItem)


export const CreateMenuItemBody = zod.object({
  "base_price": zod.number(),
  "category_id": zod.string().uuid(),
  "description": zod.string().nullish(),
  "description_translations": zod.object({

}).passthrough().nullish(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough().nullish(),
  "org_id": zod.string().uuid()
})


export const GetMenuItemParams = zod.object({
  "id": zod.string().uuid().describe('Menu item ID')
})

export const GetMenuItemResponse = zod.object({
  "base_price": zod.number(),
  "category_id": zod.string().uuid().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "default_milk_addon_id": zod.string().nullish(),
  "deleted_at": zod.string().datetime({"offset":true}).nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.object({

}).passthrough(),
  "id": zod.string().uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough(),
  "org_id": zod.string().uuid(),
  "updated_at": zod.string().datetime({"offset":true})
}).and(zod.object({
  "addon_slots": zod.array(zod.object({
  "addon_type": zod.string(),
  "created_at": zod.string().datetime({"offset":true}),
  "id": zod.string().uuid(),
  "is_required": zod.boolean(),
  "label": zod.string().nullish(),
  "label_translations": zod.object({

}).passthrough(),
  "max_selections": zod.number().nullish(),
  "menu_item_id": zod.string().uuid(),
  "min_selections": zod.number()
})),
  "optional_fields": zod.array(zod.object({
  "created_at": zod.string().datetime({"offset":true}),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "is_active": zod.boolean(),
  "menu_item_id": zod.string().uuid(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "price": zod.number(),
  "quantity_used": zod.number().nullish(),
  "size_label": zod.string().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
})),
  "recipes": zod.array(zod.object({
  "category": zod.string(),
  "ingredient_name": zod.string(),
  "ingredient_unit": zod.string(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "quantity_used": zod.number(),
  "size_label": zod.string()
})),
  "sizes": zod.array(zod.object({
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "label": zod.string(),
  "menu_item_id": zod.string().uuid(),
  "price_override": zod.number()
}))
}))


export const DeleteMenuItemParams = zod.object({
  "id": zod.string().uuid().describe('Menu item ID')
})


export const UpdateMenuItemParams = zod.object({
  "id": zod.string().uuid().describe('Menu item ID')
})

export const UpdateMenuItemBody = zod.object({
  "base_price": zod.number().nullish(),
  "category_id": zod.string().uuid().nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.object({

}).passthrough().nullish(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string().nullish(),
  "name_translations": zod.object({

}).passthrough().nullish()
})

export const UpdateMenuItemResponse = zod.object({
  "base_price": zod.number(),
  "category_id": zod.string().uuid().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "default_milk_addon_id": zod.string().nullish(),
  "deleted_at": zod.string().datetime({"offset":true}).nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.object({

}).passthrough(),
  "id": zod.string().uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough(),
  "org_id": zod.string().uuid(),
  "updated_at": zod.string().datetime({"offset":true})
})


export const ListAddonSlotsParams = zod.object({
  "id": zod.string().uuid().describe('Menu item ID')
})

export const ListAddonSlotsResponseItem = zod.object({
  "addon_type": zod.string(),
  "created_at": zod.string().datetime({"offset":true}),
  "id": zod.string().uuid(),
  "is_required": zod.boolean(),
  "label": zod.string().nullish(),
  "label_translations": zod.object({

}).passthrough(),
  "max_selections": zod.number().nullish(),
  "menu_item_id": zod.string().uuid(),
  "min_selections": zod.number()
})
export const ListAddonSlotsResponse = zod.array(ListAddonSlotsResponseItem)


export const CreateAddonSlotParams = zod.object({
  "id": zod.string().uuid().describe('Menu item ID')
})

export const CreateAddonSlotBody = zod.object({
  "addon_type": zod.string().nullish(),
  "is_required": zod.boolean().nullish(),
  "label": zod.string().nullish(),
  "label_translations": zod.object({

}).passthrough().nullish(),
  "max_selections": zod.number().nullish(),
  "min_selections": zod.number().nullish()
})


export const DeleteAddonSlotParams = zod.object({
  "id": zod.string().uuid().describe('Menu item ID'),
  "slot_id": zod.string().uuid().describe('Addon slot ID')
})


export const UpdateAddonSlotParams = zod.object({
  "id": zod.string().uuid().describe('Menu item ID'),
  "slot_id": zod.string().uuid().describe('Addon slot ID')
})

export const UpdateAddonSlotBody = zod.object({
  "is_required": zod.boolean().nullish(),
  "label": zod.string().nullish(),
  "label_translations": zod.object({

}).passthrough().nullish(),
  "max_selections": zod.number().nullish(),
  "min_selections": zod.number().nullish()
})

export const UpdateAddonSlotResponse = zod.object({
  "addon_type": zod.string(),
  "created_at": zod.string().datetime({"offset":true}),
  "id": zod.string().uuid(),
  "is_required": zod.boolean(),
  "label": zod.string().nullish(),
  "label_translations": zod.object({

}).passthrough(),
  "max_selections": zod.number().nullish(),
  "menu_item_id": zod.string().uuid(),
  "min_selections": zod.number()
})


export const ListOptionalFieldsParams = zod.object({
  "id": zod.string().uuid().describe('Menu item ID')
})

export const ListOptionalFieldsResponseItem = zod.object({
  "created_at": zod.string().datetime({"offset":true}),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "is_active": zod.boolean(),
  "menu_item_id": zod.string().uuid(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "price": zod.number(),
  "quantity_used": zod.number().nullish(),
  "size_label": zod.string().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
})
export const ListOptionalFieldsResponse = zod.array(ListOptionalFieldsResponseItem)


export const CreateOptionalFieldParams = zod.object({
  "id": zod.string().uuid().describe('Menu item ID')
})

export const CreateOptionalFieldBody = zod.object({
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough().nullish(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "price": zod.number().nullish(),
  "quantity_used": zod.number().nullish(),
  "size_label": zod.string().nullish()
})


export const DeleteOptionalFieldParams = zod.object({
  "id": zod.string().uuid().describe('Menu item ID'),
  "field_id": zod.string().uuid().describe('Field ID')
})


export const UpdateOptionalFieldParams = zod.object({
  "id": zod.string().uuid().describe('Menu item ID'),
  "field_id": zod.string().uuid().describe('Field ID')
})

export const UpdateOptionalFieldBody = zod.object({
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string().nullish(),
  "name_translations": zod.object({

}).passthrough().nullish(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "price": zod.number().nullish(),
  "quantity_used": zod.number().nullish(),
  "size_label": zod.string().nullish()
})

export const UpdateOptionalFieldResponse = zod.object({
  "created_at": zod.string().datetime({"offset":true}),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "is_active": zod.boolean(),
  "menu_item_id": zod.string().uuid(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "price": zod.number(),
  "quantity_used": zod.number().nullish(),
  "size_label": zod.string().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
})


export const ListAddonOverridesParams = zod.object({
  "id": zod.string().uuid().describe('Menu item ID')
})

export const ListAddonOverridesResponseItem = zod.object({
  "addon_item_id": zod.string().uuid(),
  "addon_item_name": zod.string(),
  "combo_addon_item_id": zod.string().uuid().nullish(),
  "combo_addon_item_name": zod.string().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string(),
  "ingredient_unit": zod.string(),
  "menu_item_id": zod.string().uuid(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "quantity_used": zod.number(),
  "replaces_ingredient_name": zod.string().nullish(),
  "replaces_org_ingredient_id": zod.string().uuid().nullish(),
  "size_label": zod.string().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
})
export const ListAddonOverridesResponse = zod.array(ListAddonOverridesResponseItem)


export const UpsertAddonOverrideParams = zod.object({
  "id": zod.string().uuid().describe('Menu item ID')
})

export const UpsertAddonOverrideBody = zod.object({
  "addon_item_id": zod.string().uuid(),
  "combo_addon_item_id": zod.string().uuid().nullish(),
  "ingredient_name": zod.string(),
  "ingredient_unit": zod.string(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "quantity_used": zod.number(),
  "replaces_org_ingredient_id": zod.string().uuid().nullish(),
  "size_label": zod.string().nullish()
})

export const UpsertAddonOverrideResponse = zod.object({
  "addon_item_id": zod.string().uuid(),
  "addon_item_name": zod.string(),
  "combo_addon_item_id": zod.string().uuid().nullish(),
  "combo_addon_item_name": zod.string().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string(),
  "ingredient_unit": zod.string(),
  "menu_item_id": zod.string().uuid(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "quantity_used": zod.number(),
  "replaces_ingredient_name": zod.string().nullish(),
  "replaces_org_ingredient_id": zod.string().uuid().nullish(),
  "size_label": zod.string().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
})


export const DeleteAddonOverrideParams = zod.object({
  "id": zod.string().uuid().describe('Menu item ID'),
  "override_id": zod.string().uuid().describe('Override ID')
})


export const UpsertSizeParams = zod.object({
  "id": zod.string().uuid().describe('Menu item ID')
})

export const UpsertSizeBody = zod.object({
  "label": zod.string(),
  "price_override": zod.number()
})

export const UpsertSizeResponse = zod.object({
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "label": zod.string(),
  "menu_item_id": zod.string().uuid(),
  "price_override": zod.number()
})


export const DeleteSizeParams = zod.object({
  "id": zod.string().uuid().describe('Menu item ID'),
  "sid": zod.string().uuid().describe('Size ID')
})


export const ListOrdersQueryParams = zod.object({
  "branch_id": zod.string().uuid().optional(),
  "shift_id": zod.string().uuid().optional(),
  "updated_after": zod.string().datetime({"offset":true}).optional(),
  "page": zod.number().optional(),
  "per_page": zod.number().optional(),
  "teller_name": zod.string().optional(),
  "payment_method": zod.string().optional(),
  "status": zod.string().optional(),
  "from": zod.string().datetime({"offset":true}).optional(),
  "to": zod.string().datetime({"offset":true}).optional(),
  "include_items": zod.boolean().optional().describe('When true, each order in `data` embeds its full line items\n(addons\/optionals\/bundle components) — the response shape becomes\n[PaginatedOrdersFull]. Lets offline-first clients cache complete\norders in one round trip instead of fetching each order separately.')
})

export const ListOrdersResponse = zod.object({
  "data": zod.array(zod.object({
  "amount_tendered": zod.number().nullish(),
  "branch_id": zod.string().uuid(),
  "change_given": zod.number().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "customer_name": zod.string().nullish(),
  "discount_amount": zod.number(),
  "discount_id": zod.string().uuid().nullish(),
  "discount_type": zod.string().nullish(),
  "discount_value": zod.number(),
  "id": zod.string().uuid(),
  "notes": zod.string().nullish(),
  "order_number": zod.number(),
  "order_ref": zod.string().nullish().describe('Human-readable, org-unique reference (e.g. \"DT-260614-0042\"). Additive\nalongside the per-shift order_number. Optional only during the rollout\nwindow before the historical backfill runs; never null afterwards.'),
  "payment_method": zod.string(),
  "shift_id": zod.string().uuid(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "tax_amount": zod.number(),
  "teller_id": zod.string().uuid(),
  "teller_name": zod.string(),
  "tip_amount": zod.number().nullish(),
  "tip_payment_method": zod.string().nullish(),
  "total_amount": zod.number(),
  "void_note": zod.string().nullish(),
  "void_reason": zod.string().nullish(),
  "voided_at": zod.string().datetime({"offset":true}).nullish(),
  "voided_by": zod.string().uuid().nullish()
})),
  "page": zod.number(),
  "per_page": zod.number(),
  "summary": zod.object({
  "completed": zod.number(),
  "discounts": zod.number(),
  "revenue": zod.number(),
  "tips": zod.number(),
  "voided": zod.number()
}),
  "total": zod.number(),
  "total_pages": zod.number()
})


export const CreateOrderBody = zod.object({
  "amount_tendered": zod.number().nullish(),
  "branch_id": zod.string().uuid(),
  "change_given": zod.number().nullish(),
  "created_at": zod.string().datetime({"offset":true}).nullish(),
  "customer_name": zod.string().nullish(),
  "discount_amount": zod.number().nullish(),
  "discount_id": zod.string().uuid().nullish(),
  "discount_type": zod.string().nullish(),
  "discount_value": zod.number().nullish(),
  "items": zod.array(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.string().uuid(),
  "quantity": zod.number().optional(),
  "unit_price": zod.number().nullish().describe('Charged unit price (piastres) the POS applied for this addon. When present\nit is RECORDED as the addon\'s unit_price; absent → the server\'s expected\n(catalog) price is used. Bundle-component addons ignore this (server-priced).')
})),
  "bundle_components": zod.array(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.string().uuid(),
  "quantity": zod.number().optional(),
  "unit_price": zod.number().nullish().describe('Charged unit price (piastres) the POS applied for this addon. When present\nit is RECORDED as the addon\'s unit_price; absent → the server\'s expected\n(catalog) price is used. Bundle-component addons ignore this (server-priced).')
})).optional(),
  "item_id": zod.string().uuid(),
  "optional_field_ids": zod.array(zod.string().uuid()).optional(),
  "quantity": zod.number(),
  "size_label": zod.string().nullish()
})).optional(),
  "bundle_id": zod.string().uuid().nullish(),
  "menu_item_id": zod.string().uuid().nullish(),
  "notes": zod.string().nullish(),
  "optional_field_ids": zod.array(zod.string().uuid()),
  "quantity": zod.number(),
  "size_label": zod.string().nullish(),
  "unit_price": zod.number().nullish().describe('Charged unit price (piastres) the POS applied for this item\/bundle line. When\npresent it is RECORDED as the line\'s unit_price; absent → the server\'s expected\n(catalog + branch override) price is used. Recording what the customer was\nactually charged keeps the DB equal to the printed receipt even when the POS\'s\nsynced menu\/override prices are stale or it was offline at sale time.')
})),
  "notes": zod.string().nullish(),
  "payment_method": zod.string(),
  "payment_splits": zod.array(zod.object({
  "amount": zod.number(),
  "method": zod.string(),
  "reference": zod.string().nullish()
})).nullish(),
  "shift_id": zod.string().uuid(),
  "subtotal": zod.number().nullish(),
  "tax_amount": zod.number().nullish(),
  "tip_amount": zod.number().nullish(),
  "tip_payment_method": zod.string().nullish(),
  "total_amount": zod.number().nullish()
})


export const ExportOrdersQueryParams = zod.object({
  "branch_id": zod.string().uuid().optional(),
  "shift_id": zod.string().uuid().optional(),
  "teller_name": zod.string().optional(),
  "payment_method": zod.string().optional(),
  "status": zod.string().optional(),
  "from": zod.string().datetime({"offset":true}).optional(),
  "to": zod.string().datetime({"offset":true}).optional()
})

export const ExportOrdersResponse = zod.object({
  "data": zod.array(zod.object({
  "amount_tendered": zod.number().nullish(),
  "branch_id": zod.string().uuid(),
  "change_given": zod.number().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "customer_name": zod.string().nullish(),
  "discount_amount": zod.number(),
  "discount_id": zod.string().uuid().nullish(),
  "discount_type": zod.string().nullish(),
  "discount_value": zod.number(),
  "id": zod.string().uuid(),
  "notes": zod.string().nullish(),
  "order_number": zod.number(),
  "order_ref": zod.string().nullish().describe('Human-readable, org-unique reference (e.g. \"DT-260614-0042\"). Additive\nalongside the per-shift order_number. Optional only during the rollout\nwindow before the historical backfill runs; never null afterwards.'),
  "payment_method": zod.string(),
  "shift_id": zod.string().uuid(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "tax_amount": zod.number(),
  "teller_id": zod.string().uuid(),
  "teller_name": zod.string(),
  "tip_amount": zod.number().nullish(),
  "tip_payment_method": zod.string().nullish(),
  "total_amount": zod.number(),
  "void_note": zod.string().nullish(),
  "void_reason": zod.string().nullish(),
  "voided_at": zod.string().datetime({"offset":true}).nullish(),
  "voided_by": zod.string().uuid().nullish()
}).and(zod.object({
  "items": zod.array(zod.object({
  "bundle_id": zod.string().uuid().nullish(),
  "bundle_unit_price": zod.number().nullish(),
  "cost_missing": zod.boolean().describe('True when any cost component could not be resolved.'),
  "deductions_snapshot": zod.unknown(),
  "id": zod.string().uuid(),
  "item_name": zod.string(),
  "line_cost": zod.number().nullish().describe('Full line COGS in piastres (recipe + addons + optionals + components).\n`null` ⟺ unknown.'),
  "line_total": zod.number(),
  "menu_item_id": zod.string().uuid().nullish(),
  "name_translations": zod.object({

}).passthrough(),
  "notes": zod.string().nullish(),
  "order_id": zod.string().uuid(),
  "quantity": zod.number(),
  "size_label": zod.string().nullish(),
  "unit_cost": zod.number().nullish().describe('Recipe-only cost per unit in piastres (incl. swaps). `null` ⟺ unknown\nor bundle line.'),
  "unit_price": zod.number()
}).and(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.string().uuid(),
  "addon_name": zod.string(),
  "id": zod.string().uuid(),
  "line_cost": zod.number().nullish().describe('Ingredient cost of this addon line in piastres. `null` ⟺ unknown, or\na swap addon (its cost lives in the item\'s recipe cost).'),
  "line_total": zod.number(),
  "name_translations": zod.object({

}).passthrough(),
  "order_item_id": zod.string().uuid(),
  "quantity": zod.number(),
  "unit_price": zod.number()
})),
  "bundle_components": zod.array(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.string().uuid(),
  "addon_name": zod.string(),
  "component_item_id": zod.string().uuid(),
  "id": zod.string().uuid(),
  "line_total": zod.number(),
  "name_translations": zod.object({

}).passthrough(),
  "order_line_id": zod.string().uuid(),
  "quantity": zod.number(),
  "unit_price": zod.number()
})),
  "item_id": zod.string().uuid(),
  "item_name": zod.string(),
  "name_translations": zod.object({

}).passthrough(),
  "optionals": zod.array(zod.object({
  "component_item_id": zod.string().uuid(),
  "field_name": zod.string(),
  "id": zod.string().uuid(),
  "name_translations": zod.object({

}).passthrough(),
  "optional_field_id": zod.string().uuid().nullish(),
  "order_line_id": zod.string().uuid(),
  "price": zod.number()
})),
  "quantity": zod.number(),
  "size_label": zod.string().nullish()
})).optional(),
  "optionals": zod.array(zod.object({
  "cost": zod.number().nullish().describe('Ingredient cost per parent-item unit in piastres. `null` ⟺ unknown or\nno ingredient linked.'),
  "field_name": zod.string(),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "name_translations": zod.object({

}).passthrough(),
  "optional_field_id": zod.string().uuid().nullish(),
  "order_item_id": zod.string().uuid(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "price": zod.number(),
  "quantity_deducted": zod.number().nullish()
}))
}))),
  "payments": zod.array(zod.object({
  "amount": zod.number(),
  "id": zod.string().uuid(),
  "method": zod.string(),
  "order_id": zod.string().uuid(),
  "reference": zod.string().nullish()
}))
}))),
  "generated_at": zod.string().datetime({"offset":true}),
  "ingredient_costs": zod.record(zod.string(), zod.number()),
  "summary": zod.object({
  "completed": zod.number(),
  "discounts": zod.number(),
  "revenue": zod.number(),
  "tips": zod.number(),
  "voided": zod.number()
}),
  "total": zod.number()
})


export const PreviewRecipeBody = zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.string().uuid(),
  "quantity": zod.number().optional()
})),
  "menu_item_id": zod.string().uuid(),
  "optional_field_ids": zod.array(zod.string().uuid()),
  "size_label": zod.string().nullish()
})

export const PreviewRecipeResponseItem = zod.object({
  "category": zod.string(),
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "quantity": zod.number(),
  "source": zod.string(),
  "unit": zod.string()
})
export const PreviewRecipeResponse = zod.array(PreviewRecipeResponseItem)


export const GetOrderParams = zod.object({
  "order_id": zod.string().uuid().describe('Order ID')
})

export const GetOrderResponse = zod.object({
  "amount_tendered": zod.number().nullish(),
  "branch_id": zod.string().uuid(),
  "change_given": zod.number().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "customer_name": zod.string().nullish(),
  "discount_amount": zod.number(),
  "discount_id": zod.string().uuid().nullish(),
  "discount_type": zod.string().nullish(),
  "discount_value": zod.number(),
  "id": zod.string().uuid(),
  "notes": zod.string().nullish(),
  "order_number": zod.number(),
  "order_ref": zod.string().nullish().describe('Human-readable, org-unique reference (e.g. \"DT-260614-0042\"). Additive\nalongside the per-shift order_number. Optional only during the rollout\nwindow before the historical backfill runs; never null afterwards.'),
  "payment_method": zod.string(),
  "shift_id": zod.string().uuid(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "tax_amount": zod.number(),
  "teller_id": zod.string().uuid(),
  "teller_name": zod.string(),
  "tip_amount": zod.number().nullish(),
  "tip_payment_method": zod.string().nullish(),
  "total_amount": zod.number(),
  "void_note": zod.string().nullish(),
  "void_reason": zod.string().nullish(),
  "voided_at": zod.string().datetime({"offset":true}).nullish(),
  "voided_by": zod.string().uuid().nullish()
}).and(zod.object({
  "items": zod.array(zod.object({
  "bundle_id": zod.string().uuid().nullish(),
  "bundle_unit_price": zod.number().nullish(),
  "cost_missing": zod.boolean().describe('True when any cost component could not be resolved.'),
  "deductions_snapshot": zod.unknown(),
  "id": zod.string().uuid(),
  "item_name": zod.string(),
  "line_cost": zod.number().nullish().describe('Full line COGS in piastres (recipe + addons + optionals + components).\n`null` ⟺ unknown.'),
  "line_total": zod.number(),
  "menu_item_id": zod.string().uuid().nullish(),
  "name_translations": zod.object({

}).passthrough(),
  "notes": zod.string().nullish(),
  "order_id": zod.string().uuid(),
  "quantity": zod.number(),
  "size_label": zod.string().nullish(),
  "unit_cost": zod.number().nullish().describe('Recipe-only cost per unit in piastres (incl. swaps). `null` ⟺ unknown\nor bundle line.'),
  "unit_price": zod.number()
}).and(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.string().uuid(),
  "addon_name": zod.string(),
  "id": zod.string().uuid(),
  "line_cost": zod.number().nullish().describe('Ingredient cost of this addon line in piastres. `null` ⟺ unknown, or\na swap addon (its cost lives in the item\'s recipe cost).'),
  "line_total": zod.number(),
  "name_translations": zod.object({

}).passthrough(),
  "order_item_id": zod.string().uuid(),
  "quantity": zod.number(),
  "unit_price": zod.number()
})),
  "bundle_components": zod.array(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.string().uuid(),
  "addon_name": zod.string(),
  "component_item_id": zod.string().uuid(),
  "id": zod.string().uuid(),
  "line_total": zod.number(),
  "name_translations": zod.object({

}).passthrough(),
  "order_line_id": zod.string().uuid(),
  "quantity": zod.number(),
  "unit_price": zod.number()
})),
  "item_id": zod.string().uuid(),
  "item_name": zod.string(),
  "name_translations": zod.object({

}).passthrough(),
  "optionals": zod.array(zod.object({
  "component_item_id": zod.string().uuid(),
  "field_name": zod.string(),
  "id": zod.string().uuid(),
  "name_translations": zod.object({

}).passthrough(),
  "optional_field_id": zod.string().uuid().nullish(),
  "order_line_id": zod.string().uuid(),
  "price": zod.number()
})),
  "quantity": zod.number(),
  "size_label": zod.string().nullish()
})).optional(),
  "optionals": zod.array(zod.object({
  "cost": zod.number().nullish().describe('Ingredient cost per parent-item unit in piastres. `null` ⟺ unknown or\nno ingredient linked.'),
  "field_name": zod.string(),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "name_translations": zod.object({

}).passthrough(),
  "optional_field_id": zod.string().uuid().nullish(),
  "order_item_id": zod.string().uuid(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "price": zod.number(),
  "quantity_deducted": zod.number().nullish()
}))
}))),
  "warnings": zod.array(zod.string()).optional().describe('Non-fatal warnings raised while placing the order — currently used to\nflag ingredients that were oversold (stock driven below zero). Empty\nfor reads\/refunds.')
}))


export const VoidOrderParams = zod.object({
  "order_id": zod.string().uuid().describe('Order ID')
})

export const VoidOrderBody = zod.object({
  "note": zod.string().nullish().describe('Free-text explanation. Required when `reason` is \"other\".'),
  "reason": zod.string(),
  "restore_inventory": zod.boolean().nullish(),
  "voided_at": zod.string().datetime({"offset":true}).nullish()
})

export const VoidOrderResponse = zod.object({
  "amount_tendered": zod.number().nullish(),
  "branch_id": zod.string().uuid(),
  "change_given": zod.number().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "customer_name": zod.string().nullish(),
  "discount_amount": zod.number(),
  "discount_id": zod.string().uuid().nullish(),
  "discount_type": zod.string().nullish(),
  "discount_value": zod.number(),
  "id": zod.string().uuid(),
  "notes": zod.string().nullish(),
  "order_number": zod.number(),
  "order_ref": zod.string().nullish().describe('Human-readable, org-unique reference (e.g. \"DT-260614-0042\"). Additive\nalongside the per-shift order_number. Optional only during the rollout\nwindow before the historical backfill runs; never null afterwards.'),
  "payment_method": zod.string(),
  "shift_id": zod.string().uuid(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "tax_amount": zod.number(),
  "teller_id": zod.string().uuid(),
  "teller_name": zod.string(),
  "tip_amount": zod.number().nullish(),
  "tip_payment_method": zod.string().nullish(),
  "total_amount": zod.number(),
  "void_note": zod.string().nullish(),
  "void_reason": zod.string().nullish(),
  "voided_at": zod.string().datetime({"offset":true}).nullish(),
  "voided_by": zod.string().uuid().nullish()
})


export const ListOrgsResponseItem = zod.object({
  "currency_code": zod.string(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "logo_url": zod.string().nullish(),
  "name": zod.string(),
  "receipt_footer": zod.string().nullish(),
  "slug": zod.string(),
  "tax_rate": zod.number().describe('Tax rate as a decimal (e.g. `0.14` for 14% VAT).\nStored as `BigDecimal` internally; transmitted as a JSON number.')
})
export const ListOrgsResponse = zod.array(ListOrgsResponseItem)


export const CreateOrgBody = zod.object({
  "currency_code": zod.string().nullish(),
  "logo": zod.instanceof(File).nullish().describe('Logo image file. PNG, JPEG, or WebP. Optional — omit the field\nentirely to create the org without a logo.'),
  "name": zod.string(),
  "receipt_footer": zod.string().nullish(),
  "slug": zod.string(),
  "tax_rate": zod.number().nullish()
})


export const GetOrgParams = zod.object({
  "id": zod.string().uuid().describe('Organization ID')
})

export const GetOrgResponse = zod.object({
  "currency_code": zod.string(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "logo_url": zod.string().nullish(),
  "name": zod.string(),
  "receipt_footer": zod.string().nullish(),
  "slug": zod.string(),
  "tax_rate": zod.number().describe('Tax rate as a decimal (e.g. `0.14` for 14% VAT).\nStored as `BigDecimal` internally; transmitted as a JSON number.')
})


export const DeleteOrgParams = zod.object({
  "id": zod.string().uuid().describe('Organization ID')
})


export const UpdateOrgParams = zod.object({
  "id": zod.string().uuid().describe('Organization ID')
})

export const UpdateOrgBody = zod.object({
  "currency_code": zod.string().nullish(),
  "is_active": zod.boolean().nullish(),
  "logo_url": zod.string().nullish().describe('`null` clears the logo; absent leaves it unchanged. To set a new\nlogo, use `PUT \/orgs\/{id}\/logo` (multipart) instead — JSON updates\nonly accept the clear-to-null case here.'),
  "name": zod.string().nullish(),
  "receipt_footer": zod.string().nullish(),
  "slug": zod.string().nullish(),
  "tax_rate": zod.number().nullish()
})

export const UpdateOrgResponse = zod.object({
  "currency_code": zod.string(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "logo_url": zod.string().nullish(),
  "name": zod.string(),
  "receipt_footer": zod.string().nullish(),
  "slug": zod.string(),
  "tax_rate": zod.number().describe('Tax rate as a decimal (e.g. `0.14` for 14% VAT).\nStored as `BigDecimal` internally; transmitted as a JSON number.')
})


export const UploadOrgLogoParams = zod.object({
  "id": zod.string().uuid().describe('Organization ID')
})

export const UploadOrgLogoBody = zod.object({
  "logo": zod.instanceof(File)
})

export const UploadOrgLogoResponse = zod.object({
  "currency_code": zod.string(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "logo_url": zod.string().nullish(),
  "name": zod.string(),
  "receipt_footer": zod.string().nullish(),
  "slug": zod.string(),
  "tax_rate": zod.number().describe('Tax rate as a decimal (e.g. `0.14` for 14% VAT).\nStored as `BigDecimal` internally; transmitted as a JSON number.')
})


export const GetOnboardingParams = zod.object({
  "id": zod.string().uuid().describe('Organization ID')
})

export const GetOnboardingResponse = zod.object({
  "can_complete": zod.boolean().describe('True when every `required` step is done (the Finish button enabler).'),
  "completed": zod.boolean().describe('Persisted terminal flag — the dashboard routes into the wizard\nwhen this is false.'),
  "completed_at": zod.string().datetime({"offset":true}).nullish(),
  "org_id": zod.string().uuid(),
  "recipe_coverage": zod.number().describe('Recipe coverage across active menu items (0..1) — drives the cost\nengine; surfaced separately because it\'s a percentage, not a bool.'),
  "steps": zod.array(zod.object({
  "count": zod.number().describe('Supporting count (branches created, items added, …).'),
  "done": zod.boolean().describe('True when the underlying data exists.'),
  "key": zod.string().describe('Stable key the dashboard switches on — never localized.'),
  "required": zod.boolean().describe('Steps that are encouraged but not blocking (`required = false`\nnever gates `can_complete`).')
}).describe('One derived setup step.'))
})


export const CompleteOnboardingParams = zod.object({
  "id": zod.string().uuid().describe('Organization ID')
})

export const CompleteOnboardingResponse = zod.object({
  "can_complete": zod.boolean().describe('True when every `required` step is done (the Finish button enabler).'),
  "completed": zod.boolean().describe('Persisted terminal flag — the dashboard routes into the wizard\nwhen this is false.'),
  "completed_at": zod.string().datetime({"offset":true}).nullish(),
  "org_id": zod.string().uuid(),
  "recipe_coverage": zod.number().describe('Recipe coverage across active menu items (0..1) — drives the cost\nengine; surfaced separately because it\'s a percentage, not a bool.'),
  "steps": zod.array(zod.object({
  "count": zod.number().describe('Supporting count (branches created, items added, …).'),
  "done": zod.boolean().describe('True when the underlying data exists.'),
  "key": zod.string().describe('Stable key the dashboard switches on — never localized.'),
  "required": zod.boolean().describe('Steps that are encouraged but not blocking (`required = false`\nnever gates `can_complete`).')
}).describe('One derived setup step.'))
})


export const ListPaymentMethodsResponseItem = zod.object({
  "color": zod.string(),
  "created_at": zod.string().datetime({"offset":true}),
  "icon": zod.string(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "is_cash": zod.boolean(),
  "label_translations": zod.unknown(),
  "name": zod.string(),
  "org_id": zod.string().uuid(),
  "updated_at": zod.string().datetime({"offset":true})
})
export const ListPaymentMethodsResponse = zod.array(ListPaymentMethodsResponseItem)


export const CreatePaymentMethodBody = zod.object({
  "color": zod.string(),
  "icon": zod.string(),
  "is_active": zod.boolean().nullish(),
  "is_cash": zod.boolean(),
  "label_translations": zod.record(zod.string(), zod.string()),
  "name": zod.string()
})


export const UpdatePaymentMethodParams = zod.object({
  "id": zod.string().uuid().describe('Payment Method ID')
})

export const UpdatePaymentMethodBody = zod.object({
  "color": zod.string().nullish(),
  "icon": zod.string().nullish(),
  "is_active": zod.boolean().nullish(),
  "is_cash": zod.boolean().nullish(),
  "label_translations": zod.record(zod.string(), zod.string()).nullish(),
  "name": zod.string().nullish()
})

export const UpdatePaymentMethodResponse = zod.object({
  "color": zod.string(),
  "created_at": zod.string().datetime({"offset":true}),
  "icon": zod.string(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "is_cash": zod.boolean(),
  "label_translations": zod.unknown(),
  "name": zod.string(),
  "org_id": zod.string().uuid(),
  "updated_at": zod.string().datetime({"offset":true})
})


export const ActivatePaymentMethodParams = zod.object({
  "id": zod.string().uuid().describe('Payment Method ID')
})

export const ActivatePaymentMethodResponse = zod.object({
  "color": zod.string(),
  "created_at": zod.string().datetime({"offset":true}),
  "icon": zod.string(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "is_cash": zod.boolean(),
  "label_translations": zod.unknown(),
  "name": zod.string(),
  "org_id": zod.string().uuid(),
  "updated_at": zod.string().datetime({"offset":true})
})


export const DeactivatePaymentMethodParams = zod.object({
  "id": zod.string().uuid().describe('Payment Method ID')
})

export const DeactivatePaymentMethodResponse = zod.object({
  "color": zod.string(),
  "created_at": zod.string().datetime({"offset":true}),
  "icon": zod.string(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "is_cash": zod.boolean(),
  "label_translations": zod.unknown(),
  "name": zod.string(),
  "org_id": zod.string().uuid(),
  "updated_at": zod.string().datetime({"offset":true})
})


export const GetPermissionMatrixParams = zod.object({
  "user_id": zod.string().uuid().describe('User ID')
})

export const GetPermissionMatrixResponseItem = zod.object({
  "action": zod.string(),
  "effective": zod.boolean(),
  "resource": zod.string(),
  "role_default": zod.boolean().nullish(),
  "user_override": zod.boolean().nullish()
}).describe('One cell of the resolved permission matrix for a user.\n`effective` = `user_override` if present, else `role_default`, else false.')
export const GetPermissionMatrixResponse = zod.array(GetPermissionMatrixResponseItem)


export const GetRolePermissionsResponseItem = zod.object({
  "action": zod.string(),
  "granted": zod.boolean(),
  "resource": zod.string(),
  "role": zod.string()
})
export const GetRolePermissionsResponse = zod.array(GetRolePermissionsResponseItem)


export const UpsertRolePermissionBody = zod.object({
  "action": zod.string(),
  "granted": zod.boolean(),
  "resource": zod.string(),
  "role": zod.string()
})

export const UpsertRolePermissionResponse = zod.object({
  "action": zod.string(),
  "granted": zod.boolean(),
  "resource": zod.string(),
  "role": zod.string()
})


export const GetUserPermissionsParams = zod.object({
  "user_id": zod.string().uuid().describe('User ID')
})

export const GetUserPermissionsResponseItem = zod.object({
  "action": zod.string(),
  "granted": zod.boolean(),
  "id": zod.string().uuid(),
  "resource": zod.string(),
  "user_id": zod.string().uuid()
})
export const GetUserPermissionsResponse = zod.array(GetUserPermissionsResponseItem)


export const UpsertUserPermissionParams = zod.object({
  "user_id": zod.string().uuid().describe('User ID')
})

export const UpsertUserPermissionBody = zod.object({
  "action": zod.string(),
  "granted": zod.boolean(),
  "resource": zod.string()
})

export const UpsertUserPermissionResponse = zod.object({
  "action": zod.string(),
  "granted": zod.boolean(),
  "id": zod.string().uuid(),
  "resource": zod.string(),
  "user_id": zod.string().uuid()
})


export const DeleteUserPermissionParams = zod.object({
  "user_id": zod.string().uuid().describe('User ID'),
  "resource": zod.string().describe('Resource name (e.g. menu_items, orders)'),
  "action": zod.string().describe('Action (create | read | update | delete)')
})


export const PublicBranchesQueryParams = zod.object({
  "org_id": zod.string().uuid()
})

export const PublicBranchesResponseItem = zod.object({
  "code": zod.string(),
  "id": zod.string().uuid(),
  "in_mall_enabled": zod.boolean(),
  "in_mall_open_now": zod.boolean().describe('Effective-open right now (enabled + open shift + override + window).'),
  "name": zod.string(),
  "outside_enabled": zod.boolean(),
  "outside_open_now": zod.boolean()
})
export const PublicBranchesResponse = zod.array(PublicBranchesResponseItem)


export const DeliveryQuoteParams = zod.object({
  "id": zod.string().uuid()
})

export const DeliveryQuoteQueryParams = zod.object({
  "lat": zod.number(),
  "lng": zod.number(),
  "channel": zod.string()
})

export const DeliveryQuoteResponse = zod.object({
  "distance_meters": zod.number().nullish(),
  "fee": zod.number().nullish(),
  "status": zod.string().describe('\"ok\" | \"out_of_range\" | \"unavailable\"'),
  "zone_id": zod.string().uuid().nullish(),
  "zone_name": zod.string().nullish()
})


export const PublicMenuParams = zod.object({
  "id": zod.string().uuid()
})

export const PublicMenuQueryParams = zod.object({
  "channel": zod.string()
})

export const PublicMenuResponse = zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.string().uuid(),
  "is_available": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough(),
  "price": zod.number().describe('Channel-effective surcharge (piastres). Always present (resolved here).'),
  "type": zod.string().describe('`milk_type` | `coffee_type` | `extra` — the option\'s category.')
}).describe('One option in the org-wide addon catalog. The catalog is global (the POS\nmodel): every item can use any addon; swap-vs-additive is decided server-side\nfrom the addon `type` + the item recipe at order time. `price` is the\nchannel-effective surcharge in piastres (branch_channel → branch → catalog\ndefault). Channel-unavailable options are excluded from the catalog entirely.')).describe('Org-wide addon catalog (global, POS model): channel-effective, grouped by\n`type`, applicable to every item. Channel-unavailable options are excluded.'),
  "categories": zod.array(zod.object({
  "id": zod.string().uuid(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough()
})),
  "items": zod.array(zod.object({
  "category_id": zod.string().uuid().nullish(),
  "default_milk_addon_id": zod.string().uuid().nullish().describe('The item\'s base\/default milk: the `milk_type` addon whose ingredient\nmatches the item recipe\'s milk ingredient. The online customizer\npre-selects it (mirrors the POS default-milk selection). `None` when the\nitem has no milk in its recipe or no matching milk addon exists.'),
  "description": zod.string().nullish(),
  "id": zod.string().uuid(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough(),
  "optionals": zod.array(zod.object({
  "id": zod.string().uuid(),
  "name": zod.string(),
  "name_translations": zod.object({

}).passthrough(),
  "price": zod.number(),
  "size_label": zod.string().nullish()
}).describe('A per-item optional toggle (e.g. \"Extra hot\", \"No sugar\"). `price` is the\npiastres surcharge; `size_label` is set when the optional only applies to a\nspecific size.')),
  "price": zod.number(),
  "sizes": zod.array(zod.object({
  "label": zod.string(),
  "price": zod.number()
}))
}))
})


export const CreateDeliveryOrderBody = zod.object({
  "address_line": zod.string().nullish(),
  "branch_id": zod.string().uuid(),
  "channel": zod.string(),
  "customer_lat": zod.number().nullish(),
  "customer_lng": zod.number().nullish(),
  "customer_name": zod.string(),
  "customer_phone": zod.string(),
  "delivery_notes": zod.string().nullish(),
  "device_token": zod.string().describe('Device-trust token from OTP verify (proves the phone).'),
  "floor": zod.string().nullish(),
  "items": zod.array(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.string().uuid(),
  "quantity": zod.number().optional(),
  "unit_price": zod.number().nullish().describe('Charged unit price (piastres) the POS applied for this addon. When present\nit is RECORDED as the addon\'s unit_price; absent → the server\'s expected\n(catalog) price is used. Bundle-component addons ignore this (server-priced).')
})).optional(),
  "menu_item_id": zod.string().uuid(),
  "notes": zod.string().nullish(),
  "optional_field_ids": zod.array(zod.string().uuid()).optional(),
  "quantity": zod.number(),
  "size_label": zod.string().nullish()
}).describe('One line of a public cart. Prices are NOT taken from the client — the server\nresolves them. `addons` reuses [`AddonInput`] but its `unit_price` is ignored.')),
  "landmark": zod.string().nullish(),
  "payment_method_hint": zod.string().describe('\"cash\" | \"card\" — a hint the teller can change at finalize.'),
  "place_name": zod.string().nullish(),
  "unit_number": zod.string().nullish()
})


export const ListPublicOrgsResponseItem = zod.object({
  "address": zod.string().nullish(),
  "branch_count": zod.number().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "logo_url": zod.string().nullish(),
  "name": zod.string()
})
export const ListPublicOrgsResponse = zod.array(ListPublicOrgsResponseItem)


export const OtpRequestBody = zod.object({
  "phone": zod.string()
})

export const OtpRequestResponse = zod.object({
  "debug_code": zod.string().nullish().describe('Only populated when SUFRIX_OTP_DEBUG=1 (dev\/test). Never set in prod.'),
  "sent": zod.boolean()
})


export const OtpVerifyBody = zod.object({
  "code": zod.string(),
  "phone": zod.string()
})

export const OtpVerifyResponse = zod.object({
  "device_token": zod.string()
})


export const ListPurchaseOrdersParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const ListPurchaseOrdersQueryParams = zod.object({
  "status": zod.string().optional().describe('Filter by status: draft | ordered | partially_received | received | cancelled.'),
  "expected_before": zod.string().datetime({"offset":true}).optional().describe('Only orders expected on or before this instant (for \"arriving by\" views).')
})

export const ListPurchaseOrdersResponseItem = zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — populated by the order lists so the \"All branches\" view\ncan show which branch each PO belongs to; other endpoints leave it null.'),
  "created_at": zod.string().datetime({"offset":true}),
  "created_by": zod.string().uuid(),
  "expected_at": zod.string().datetime({"offset":true}).nullish(),
  "id": zod.string().uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.string().uuid(),
  "received_at": zod.string().datetime({"offset":true}).nullish(),
  "received_by": zod.string().uuid().nullish(),
  "reference": zod.string().nullish(),
  "status": zod.string(),
  "supplier_id": zod.string().uuid().nullish(),
  "supplier_name": zod.string().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
})
export const ListPurchaseOrdersResponse = zod.array(ListPurchaseOrdersResponseItem)


export const CreatePurchaseOrderParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const CreatePurchaseOrderBody = zod.object({
  "expected_at": zod.string().datetime({"offset":true}).nullish(),
  "lines": zod.array(zod.object({
  "org_ingredient_id": zod.string().uuid(),
  "purchase_unit": zod.string(),
  "quantity_ordered": zod.number(),
  "unit_cost": zod.number().describe('Piastres per purchase unit.'),
  "units_per_purchase_unit": zod.number().nullish().describe('Stock units per purchase unit. Ignored when `purchase_unit` is a known\ninventory unit (the factor is derived from the ingredient\'s base unit).')
})),
  "note": zod.string().nullish(),
  "reference": zod.string().nullish(),
  "supplier_id": zod.string().uuid().nullish()
})


export const GetPurchaseOrderParams = zod.object({
  "id": zod.string().uuid().describe('Purchase order ID')
})

export const GetPurchaseOrderResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — populated by the order lists so the \"All branches\" view\ncan show which branch each PO belongs to; other endpoints leave it null.'),
  "created_at": zod.string().datetime({"offset":true}),
  "created_by": zod.string().uuid(),
  "expected_at": zod.string().datetime({"offset":true}).nullish(),
  "id": zod.string().uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.string().uuid(),
  "received_at": zod.string().datetime({"offset":true}).nullish(),
  "received_by": zod.string().uuid().nullish(),
  "reference": zod.string().nullish(),
  "status": zod.string(),
  "supplier_id": zod.string().uuid().nullish(),
  "supplier_name": zod.string().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
}).and(zod.object({
  "lines": zod.array(zod.object({
  "id": zod.string().uuid(),
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.string().uuid(),
  "purchase_order_id": zod.string().uuid(),
  "purchase_unit": zod.string(),
  "quantity_ordered": zod.number(),
  "quantity_received": zod.number(),
  "unit": zod.string().describe('Ingredient\'s base stock unit.'),
  "unit_cost": zod.number().describe('Piastres per PURCHASE unit.'),
  "units_per_purchase_unit": zod.number()
}))
}))


export const CancelPurchaseOrderParams = zod.object({
  "id": zod.string().uuid().describe('Purchase order ID')
})

export const CancelPurchaseOrderResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — populated by the order lists so the \"All branches\" view\ncan show which branch each PO belongs to; other endpoints leave it null.'),
  "created_at": zod.string().datetime({"offset":true}),
  "created_by": zod.string().uuid(),
  "expected_at": zod.string().datetime({"offset":true}).nullish(),
  "id": zod.string().uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.string().uuid(),
  "received_at": zod.string().datetime({"offset":true}).nullish(),
  "received_by": zod.string().uuid().nullish(),
  "reference": zod.string().nullish(),
  "status": zod.string(),
  "supplier_id": zod.string().uuid().nullish(),
  "supplier_name": zod.string().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
})


export const ReceivePurchaseOrderParams = zod.object({
  "id": zod.string().uuid().describe('Purchase order ID')
})

export const ReceivePurchaseOrderBody = zod.object({
  "lines": zod.array(zod.object({
  "line_id": zod.string().uuid(),
  "quantity_received": zod.number()
}))
})

export const ReceivePurchaseOrderResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — populated by the order lists so the \"All branches\" view\ncan show which branch each PO belongs to; other endpoints leave it null.'),
  "created_at": zod.string().datetime({"offset":true}),
  "created_by": zod.string().uuid(),
  "expected_at": zod.string().datetime({"offset":true}).nullish(),
  "id": zod.string().uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.string().uuid(),
  "received_at": zod.string().datetime({"offset":true}).nullish(),
  "received_by": zod.string().uuid().nullish(),
  "reference": zod.string().nullish(),
  "status": zod.string(),
  "supplier_id": zod.string().uuid().nullish(),
  "supplier_name": zod.string().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
}).and(zod.object({
  "lines": zod.array(zod.object({
  "id": zod.string().uuid(),
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.string().uuid(),
  "purchase_order_id": zod.string().uuid(),
  "purchase_unit": zod.string(),
  "quantity_ordered": zod.number(),
  "quantity_received": zod.number(),
  "unit": zod.string().describe('Ingredient\'s base stock unit.'),
  "unit_cost": zod.number().describe('Piastres per PURCHASE unit.'),
  "units_per_purchase_unit": zod.number()
}))
}))


export const ListOrgPurchaseOrdersParams = zod.object({
  "org_id": zod.string().uuid().describe('Organization ID')
})

export const ListOrgPurchaseOrdersQueryParams = zod.object({
  "status": zod.string().optional().describe('Filter by status: draft | ordered | partially_received | received | cancelled.'),
  "expected_before": zod.string().datetime({"offset":true}).optional().describe('Only orders expected on or before this instant (for \"arriving by\" views).')
})

export const ListOrgPurchaseOrdersResponseItem = zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — populated by the order lists so the \"All branches\" view\ncan show which branch each PO belongs to; other endpoints leave it null.'),
  "created_at": zod.string().datetime({"offset":true}),
  "created_by": zod.string().uuid(),
  "expected_at": zod.string().datetime({"offset":true}).nullish(),
  "id": zod.string().uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.string().uuid(),
  "received_at": zod.string().datetime({"offset":true}).nullish(),
  "received_by": zod.string().uuid().nullish(),
  "reference": zod.string().nullish(),
  "status": zod.string(),
  "supplier_id": zod.string().uuid().nullish(),
  "supplier_name": zod.string().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
})
export const ListOrgPurchaseOrdersResponse = zod.array(ListOrgPurchaseOrdersResponseItem)


export const ListSuppliersParams = zod.object({
  "org_id": zod.string().uuid().describe('Organization ID')
})

export const ListSuppliersResponseItem = zod.object({
  "contact_name": zod.string().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "email": zod.string().nullish(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.string().uuid(),
  "phone": zod.string().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
})
export const ListSuppliersResponse = zod.array(ListSuppliersResponseItem)


export const CreateSupplierParams = zod.object({
  "org_id": zod.string().uuid().describe('Organization ID')
})

export const CreateSupplierBody = zod.object({
  "contact_name": zod.string().nullish(),
  "email": zod.string().nullish(),
  "name": zod.string(),
  "phone": zod.string().nullish()
})


export const DeleteSupplierParams = zod.object({
  "id": zod.string().uuid().describe('Supplier ID')
})


export const UpdateSupplierParams = zod.object({
  "id": zod.string().uuid().describe('Supplier ID')
})

export const UpdateSupplierBody = zod.object({
  "contact_name": zod.string().nullish(),
  "email": zod.string().nullish(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string().nullish(),
  "phone": zod.string().nullish()
})

export const UpdateSupplierResponse = zod.object({
  "contact_name": zod.string().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "email": zod.string().nullish(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.string().uuid(),
  "phone": zod.string().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
})


export const ListAddonIngredientsParams = zod.object({
  "addon_item_id": zod.string().uuid().describe('Addon item ID')
})

export const ListAddonIngredientsResponseItem = zod.object({
  "addon_item_id": zod.string().uuid(),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "quantity_used": zod.number(),
  "unit": zod.string()
})
export const ListAddonIngredientsResponse = zod.array(ListAddonIngredientsResponseItem)


export const UpsertAddonIngredientParams = zod.object({
  "addon_item_id": zod.string().uuid().describe('Addon item ID')
})

export const UpsertAddonIngredientBody = zod.object({
  "ingredient_name": zod.string(),
  "ingredient_unit": zod.string(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "quantity_used": zod.number()
})

export const UpsertAddonIngredientResponse = zod.object({
  "addon_item_id": zod.string().uuid(),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "quantity_used": zod.number(),
  "unit": zod.string()
})


export const DeleteAddonIngredientParams = zod.object({
  "addon_item_id": zod.string().uuid()
})

export const DeleteAddonIngredientQueryParams = zod.object({
  "ingredient_name": zod.string()
})


export const ListDrinkRecipesParams = zod.object({
  "menu_item_id": zod.string().uuid().describe('Menu item ID')
})

export const ListDrinkRecipesResponseItem = zod.object({
  "id": zod.string().uuid(),
  "ingredient_name": zod.string(),
  "menu_item_id": zod.string().uuid(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "quantity_used": zod.number(),
  "size_label": zod.string(),
  "unit": zod.string()
})
export const ListDrinkRecipesResponse = zod.array(ListDrinkRecipesResponseItem)


export const UpsertDrinkRecipeParams = zod.object({
  "menu_item_id": zod.string().uuid().describe('Menu item ID')
})

export const UpsertDrinkRecipeBody = zod.object({
  "ingredient_name": zod.string(),
  "ingredient_unit": zod.string(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "quantity_used": zod.number(),
  "size_label": zod.string()
})

export const UpsertDrinkRecipeResponse = zod.object({
  "id": zod.string().uuid(),
  "ingredient_name": zod.string(),
  "menu_item_id": zod.string().uuid(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "quantity_used": zod.number(),
  "size_label": zod.string(),
  "unit": zod.string()
})


export const DeleteDrinkRecipeParams = zod.object({
  "menu_item_id": zod.string().uuid(),
  "size": zod.string()
})

export const DeleteDrinkRecipeQueryParams = zod.object({
  "ingredient_name": zod.string()
})


export const BranchAddonSalesParams = zod.object({
  "branch_id": zod.string().uuid()
})

export const BranchAddonSalesQueryParams = zod.object({
  "from": zod.string().datetime({"offset":true}).optional(),
  "to": zod.string().datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const BranchAddonSalesResponseItem = zod.object({
  "addon_item_id": zod.string().uuid(),
  "addon_name": zod.string(),
  "addon_name_translations": zod.object({

}).passthrough(),
  "addon_type": zod.string(),
  "quantity_sold": zod.number(),
  "revenue": zod.number()
})
export const BranchAddonSalesResponse = zod.array(BranchAddonSalesResponseItem)


export const BranchBundleSalesParams = zod.object({
  "branch_id": zod.string().uuid()
})

export const BranchBundleSalesQueryParams = zod.object({
  "from": zod.string().datetime({"offset":true}).optional(),
  "to": zod.string().datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const BranchBundleSalesResponseItem = zod.object({
  "bundle_id": zod.string().uuid().nullish(),
  "bundle_name": zod.string(),
  "quantity_sold": zod.number(),
  "revenue": zod.number()
})
export const BranchBundleSalesResponse = zod.array(BranchBundleSalesResponseItem)


export const BranchConsumptionParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const BranchConsumptionQueryParams = zod.object({
  "from": zod.string().datetime({"offset":true}).optional(),
  "to": zod.string().datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const BranchConsumptionResponseItem = zod.object({
  "consumed_qty": zod.number(),
  "consumed_value": zod.number().nullish().describe('Consumption valued in piastres; `null` if any contributing cost unknown.'),
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.string().uuid(),
  "unit": zod.string()
})
export const BranchConsumptionResponse = zod.array(BranchConsumptionResponseItem)


export const BranchInventoryValuationParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const BranchInventoryValuationResponse = zod.object({
  "items": zod.array(zod.object({
  "cost_per_unit": zod.number().nullish().describe('Piastres per unit; `null` ⟺ unknown.'),
  "current_stock": zod.number(),
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.string().uuid(),
  "unit": zod.string(),
  "value": zod.number().nullish().describe('current_stock × cost_per_unit in piastres; `null` when cost unknown.')
})),
  "total_value": zod.number(),
  "unknown_cost_count": zod.number()
})


export const BranchCombinedItemSalesParams = zod.object({
  "branch_id": zod.string().uuid()
})

export const BranchCombinedItemSalesQueryParams = zod.object({
  "from": zod.string().datetime({"offset":true}).optional(),
  "to": zod.string().datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const BranchCombinedItemSalesResponseItem = zod.object({
  "bundle_qty": zod.number(),
  "item_id": zod.string().uuid().nullish(),
  "item_name": zod.string(),
  "item_name_translations": zod.object({

}).passthrough(),
  "standalone_qty": zod.number(),
  "total_qty": zod.number()
})
export const BranchCombinedItemSalesResponse = zod.array(BranchCombinedItemSalesResponseItem)


export const BranchLowStockParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID, or the all-zeros UUID for every branch in the org')
})

export const BranchLowStockResponseItem = zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string(),
  "current_stock": zod.number(),
  "deficit": zod.number().describe('reorder_threshold − current_stock: how much to order to reach par.'),
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.string().uuid(),
  "reorder_threshold": zod.number(),
  "supplier_id": zod.string().uuid().nullish().describe('Default supplier for this ingredient (for one-click \"create PO\"); may be null.'),
  "supplier_name": zod.string().nullish(),
  "unit": zod.string()
})
export const BranchLowStockResponse = zod.array(BranchLowStockResponseItem)


export const BranchMenuEngineeringParams = zod.object({
  "branch_id": zod.string().uuid()
})

export const BranchMenuEngineeringQueryParams = zod.object({
  "from": zod.string().datetime({"offset":true}).optional(),
  "to": zod.string().datetime({"offset":true}).optional(),
  "limit": zod.number().optional(),
  "cost_basis": zod.string().optional().describe('`snapshot` (default) — COGS from sale-time order snapshots.\n`current` — COGS from today\'s recipe rollups.')
})

export const BranchMenuEngineeringResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "cost_basis": zod.string().describe('Cost basis the report was computed with: \"snapshot\" | \"current\".'),
  "excluded_sales": zod.number().describe('Realized revenue (piastres) carried by the excluded SKUs — explains\nwhy `total_sales` differs between cost bases: each basis excludes a\ndifferent set of un-costable rows.'),
  "from": zod.string().datetime({"offset":true}).nullish(),
  "rows": zod.array(zod.object({
  "category_id": zod.string().uuid().nullish(),
  "category_name": zod.string().nullish(),
  "class": zod.string().describe('star | workhorse | challenge | dog (Foodics names).'),
  "cost_missing_lines": zod.number().describe('Lines in the window whose sale-time cost could not be resolved.\nAlways reports snapshot data quality, regardless of `cost_basis` —\nunder `current`, an included row can still carry snapshot gaps.'),
  "item_name": zod.string(),
  "item_profit": zod.number().describe('Average profit per unit, piastres (`(sales - cost) \/ qty`).'),
  "menu_item_id": zod.string().uuid(),
  "popularity_category": zod.string().describe('\"high\" | \"low\" — Kasavana-Smith 70% rule (0.70 \/ n).'),
  "popularity_pct": zod.number().describe('Share of units among the rows in this report (cost-tracked only).'),
  "profit_category": zod.string().describe('\"high\" | \"low\" — vs weighted-average per-unit profit.'),
  "quantity_sold": zod.number().describe('Units sold (standalone lines only — bundle lines are excluded so the\nper-unit economics stay clean; bundle performance has its own report).'),
  "sales": zod.number().describe('Revenue from those lines, piastres.'),
  "size_label": zod.string().describe('`\"one_size\"` for items without sizes.'),
  "total_cost": zod.number().describe('Recipe-scope COGS in piastres (additive addons excluded — they have\ntheir own revenue and their own report). Snapshot basis:\n`SUM(unit_cost × quantity)`; current basis: today\'s recipe rollup ×\nquantity. Rows where this is unresolvable are excluded from the\nreport, so it is always present.'),
  "total_profit": zod.number().describe('`sales - total_cost`, piastres.')
})),
  "rows_cost_missing": zod.number().describe('SKUs sold in the window but EXCLUDED from this report because their\ncost was unresolvable under the chosen basis.'),
  "to": zod.string().datetime({"offset":true}).nullish(),
  "total_cost": zod.number(),
  "total_profit": zod.number(),
  "total_sales": zod.number().describe('Totals over the returned rows.')
})


export const BranchSalesParams = zod.object({
  "branch_id": zod.string().uuid()
})

export const BranchSalesQueryParams = zod.object({
  "from": zod.string().datetime({"offset":true}).optional(),
  "to": zod.string().datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const BranchSalesResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string(),
  "by_category": zod.array(zod.object({
  "category_id": zod.string().uuid().nullish(),
  "category_name": zod.string().nullish(),
  "category_name_translations": zod.object({

}).passthrough(),
  "item_count": zod.number(),
  "items": zod.array(zod.object({
  "item_name": zod.string(),
  "item_name_translations": zod.object({

}).passthrough(),
  "menu_item_id": zod.string().uuid(),
  "quantity_sold": zod.number(),
  "revenue": zod.number()
})),
  "quantity_sold": zod.number(),
  "revenue": zod.number()
})),
  "from": zod.string().datetime({"offset":true}).nullish(),
  "revenue_by_method": zod.unknown(),
  "subtotal": zod.number(),
  "to": zod.string().datetime({"offset":true}).nullish(),
  "top_items": zod.array(zod.object({
  "item_name": zod.string(),
  "item_name_translations": zod.object({

}).passthrough(),
  "menu_item_id": zod.string().uuid(),
  "quantity_sold": zod.number(),
  "revenue": zod.number()
})),
  "total_discount": zod.number(),
  "total_orders": zod.number(),
  "total_revenue": zod.number(),
  "total_tax": zod.number(),
  "voided_orders": zod.number()
})


export const BranchSalesTimeseriesParams = zod.object({
  "branch_id": zod.string().uuid()
})

export const BranchSalesTimeseriesQueryParams = zod.object({
  "from": zod.string().datetime({"offset":true}).optional(),
  "to": zod.string().datetime({"offset":true}).optional(),
  "granularity": zod.string().optional()
})

export const BranchSalesTimeseriesResponseItem = zod.object({
  "discount": zod.number(),
  "orders": zod.number(),
  "period": zod.string(),
  "revenue": zod.number(),
  "revenue_by_method": zod.unknown(),
  "tax": zod.number(),
  "voided": zod.number()
})
export const BranchSalesTimeseriesResponse = zod.array(BranchSalesTimeseriesResponseItem)


export const BranchShrinkageParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const BranchShrinkageQueryParams = zod.object({
  "from": zod.string().datetime({"offset":true}).optional(),
  "to": zod.string().datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const BranchShrinkageResponseItem = zod.object({
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.string().uuid(),
  "reason": zod.string().describe('The variance reason captured at finalize, or `unexplained` when none.'),
  "shrinkage_qty": zod.number().describe('Quantity lost (positive number) from negative stock-count differences.'),
  "shrinkage_value": zod.number().nullish().describe('Valued shrinkage in piastres; `null` when any contributing cost unknown.'),
  "unit": zod.string()
})
export const BranchShrinkageResponse = zod.array(BranchShrinkageResponseItem)


export const BranchStockParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const BranchStockResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string(),
  "items": zod.array(zod.object({
  "below_reorder": zod.boolean(),
  "branch_inventory_id": zod.string().uuid(),
  "cost_per_unit": zod.number().nullish().describe('Piastres per unit; `null` ⟺ cost never entered.'),
  "current_stock": zod.number(),
  "ingredient_name": zod.string(),
  "reorder_threshold": zod.number(),
  "unit": zod.string()
}))
})


export const BranchTellerStatsParams = zod.object({
  "branch_id": zod.string().uuid()
})

export const BranchTellerStatsQueryParams = zod.object({
  "from": zod.string().datetime({"offset":true}).optional(),
  "to": zod.string().datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const BranchTellerStatsResponseItem = zod.object({
  "avg_order_value": zod.number(),
  "orders": zod.number(),
  "revenue": zod.number(),
  "shifts": zod.number(),
  "teller_id": zod.string().uuid(),
  "teller_name": zod.string(),
  "voided": zod.number()
})
export const BranchTellerStatsResponse = zod.array(BranchTellerStatsResponseItem)


export const BranchWasteReportParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const BranchWasteReportQueryParams = zod.object({
  "from": zod.string().datetime({"offset":true}).optional(),
  "to": zod.string().datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const BranchWasteReportResponseItem = zod.object({
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.string().uuid(),
  "reason": zod.string(),
  "unit": zod.string(),
  "waste_qty": zod.number(),
  "waste_value": zod.number().nullish()
})
export const BranchWasteReportResponse = zod.array(BranchWasteReportResponseItem)


export const OrgBranchComparisonParams = zod.object({
  "org_id": zod.string().uuid()
})

export const OrgBranchComparisonQueryParams = zod.object({
  "from": zod.string().datetime({"offset":true}).optional(),
  "to": zod.string().datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const OrgBranchComparisonResponse = zod.object({
  "branches": zod.array(zod.object({
  "avg_order_value": zod.number(),
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string(),
  "revenue_by_method": zod.unknown(),
  "total_orders": zod.number(),
  "total_revenue": zod.number(),
  "void_rate_pct": zod.number(),
  "voided_orders": zod.number()
})),
  "from": zod.string().datetime({"offset":true}).nullish(),
  "org_id": zod.string().uuid(),
  "to": zod.string().datetime({"offset":true}).nullish()
})


export const OrgConsumptionParams = zod.object({
  "org_id": zod.string().uuid().describe('Organization ID')
})

export const OrgConsumptionQueryParams = zod.object({
  "from": zod.string().datetime({"offset":true}).optional(),
  "to": zod.string().datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const OrgConsumptionResponseItem = zod.object({
  "consumed_qty": zod.number(),
  "consumed_value": zod.number().nullish().describe('Consumption valued in piastres; `null` if any contributing cost unknown.'),
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.string().uuid(),
  "unit": zod.string()
})
export const OrgConsumptionResponse = zod.array(OrgConsumptionResponseItem)


export const OrgInventoryValuationParams = zod.object({
  "org_id": zod.string().uuid().describe('Organization ID')
})

export const OrgInventoryValuationResponse = zod.object({
  "items": zod.array(zod.object({
  "cost_per_unit": zod.number().nullish().describe('Piastres per unit; `null` ⟺ unknown.'),
  "current_stock": zod.number(),
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.string().uuid(),
  "unit": zod.string(),
  "value": zod.number().nullish().describe('current_stock × cost_per_unit in piastres; `null` when cost unknown.')
})),
  "total_value": zod.number(),
  "unknown_cost_count": zod.number()
})


export const OrgLowStockParams = zod.object({
  "org_id": zod.string().uuid().describe('Organization ID')
})

export const OrgLowStockResponseItem = zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string(),
  "current_stock": zod.number(),
  "deficit": zod.number().describe('reorder_threshold − current_stock: how much to order to reach par.'),
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.string().uuid(),
  "reorder_threshold": zod.number(),
  "supplier_id": zod.string().uuid().nullish().describe('Default supplier for this ingredient (for one-click \"create PO\"); may be null.'),
  "supplier_name": zod.string().nullish(),
  "unit": zod.string()
})
export const OrgLowStockResponse = zod.array(OrgLowStockResponseItem)


export const OrgShrinkageParams = zod.object({
  "org_id": zod.string().uuid().describe('Organization ID')
})

export const OrgShrinkageQueryParams = zod.object({
  "from": zod.string().datetime({"offset":true}).optional(),
  "to": zod.string().datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const OrgShrinkageResponseItem = zod.object({
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.string().uuid(),
  "reason": zod.string().describe('The variance reason captured at finalize, or `unexplained` when none.'),
  "shrinkage_qty": zod.number().describe('Quantity lost (positive number) from negative stock-count differences.'),
  "shrinkage_value": zod.number().nullish().describe('Valued shrinkage in piastres; `null` when any contributing cost unknown.'),
  "unit": zod.string()
})
export const OrgShrinkageResponse = zod.array(OrgShrinkageResponseItem)


export const OrgWasteReportParams = zod.object({
  "org_id": zod.string().uuid().describe('Organization ID')
})

export const OrgWasteReportQueryParams = zod.object({
  "from": zod.string().datetime({"offset":true}).optional(),
  "to": zod.string().datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const OrgWasteReportResponseItem = zod.object({
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.string().uuid(),
  "reason": zod.string(),
  "unit": zod.string(),
  "waste_qty": zod.number(),
  "waste_value": zod.number().nullish()
})
export const OrgWasteReportResponse = zod.array(OrgWasteReportResponseItem)


export const ShiftDeductionsParams = zod.object({
  "shift_id": zod.string().uuid().describe('Shift ID')
})

export const ShiftDeductionsResponseItem = zod.object({
  "created_at": zod.string().datetime({"offset":true}),
  "id": zod.string().uuid(),
  "inventory_item_id": zod.string().uuid(),
  "item_name": zod.string(),
  "order_id": zod.string().uuid().nullish(),
  "order_item_id": zod.string().uuid().nullish(),
  "quantity_deducted": zod.number(),
  "source": zod.string(),
  "unit": zod.string()
})
export const ShiftDeductionsResponse = zod.array(ShiftDeductionsResponseItem)


export const ShiftSummaryParams = zod.object({
  "shift_id": zod.string().uuid().describe('Shift ID')
})

export const ShiftSummaryResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string(),
  "cash_discrepancy": zod.number().nullish(),
  "closed_at": zod.string().datetime({"offset":true}).nullish(),
  "closing_cash_declared": zod.number().nullish(),
  "closing_cash_system": zod.number().nullish(),
  "opened_at": zod.string().datetime({"offset":true}),
  "opening_cash": zod.number(),
  "revenue_by_method": zod.unknown(),
  "shift_id": zod.string().uuid(),
  "status": zod.string(),
  "teller_id": zod.string().uuid(),
  "teller_name": zod.string(),
  "total_discount": zod.number(),
  "total_orders": zod.number(),
  "total_revenue": zod.number(),
  "total_tax": zod.number(),
  "voided_orders": zod.number()
})


export const ListShiftsParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID (nil UUID = all branches in org)')
})

export const ListShiftsQueryParams = zod.object({
  "page": zod.number().optional().describe('1-based page number. Omit (along with `per_page`) to fetch every shift.'),
  "per_page": zod.number().optional().describe('Page size (clamped to [1, 200]). Omit to fetch every shift in one page.')
})

export const ListShiftsResponse = zod.object({
  "data": zod.array(zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the shifts list (so the \"All branches\"\nview can show which branch each shift belongs to). Other shift endpoints\nleave it `null`.'),
  "cash_discrepancy": zod.number().nullish(),
  "closed_at": zod.string().datetime({"offset":true}).nullish(),
  "closed_by": zod.string().uuid().nullish(),
  "closing_cash_declared": zod.number().nullish(),
  "closing_cash_system": zod.number().nullish(),
  "force_close_reason": zod.string().nullish(),
  "force_closed_at": zod.string().datetime({"offset":true}).nullish(),
  "force_closed_by": zod.string().uuid().nullish(),
  "id": zod.string().uuid(),
  "notes": zod.string().nullish(),
  "opened_at": zod.string().datetime({"offset":true}),
  "opening_cash": zod.number(),
  "opening_cash_edit_reason": zod.string().nullish(),
  "opening_cash_original": zod.number().nullish(),
  "opening_cash_was_edited": zod.boolean(),
  "status": zod.string(),
  "teller_id": zod.string().uuid(),
  "teller_name": zod.string()
})),
  "page": zod.number(),
  "per_page": zod.number(),
  "total": zod.number(),
  "total_pages": zod.number()
}).describe('Paginated envelope for the shifts list. When the request omits `page`\/`per_page`,\n`data` holds every matching shift in one page (back-compat for the dashboard);\nwhen they are present, `data` is one bounded page ordered newest-first.')


export const GetCurrentShiftParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const GetCurrentShiftResponse = zod.object({
  "has_open_shift": zod.boolean(),
  "open_shift": zod.union([zod.null(),zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the shifts list (so the \"All branches\"\nview can show which branch each shift belongs to). Other shift endpoints\nleave it `null`.'),
  "cash_discrepancy": zod.number().nullish(),
  "closed_at": zod.string().datetime({"offset":true}).nullish(),
  "closed_by": zod.string().uuid().nullish(),
  "closing_cash_declared": zod.number().nullish(),
  "closing_cash_system": zod.number().nullish(),
  "force_close_reason": zod.string().nullish(),
  "force_closed_at": zod.string().datetime({"offset":true}).nullish(),
  "force_closed_by": zod.string().uuid().nullish(),
  "id": zod.string().uuid(),
  "notes": zod.string().nullish(),
  "opened_at": zod.string().datetime({"offset":true}),
  "opening_cash": zod.number(),
  "opening_cash_edit_reason": zod.string().nullish(),
  "opening_cash_original": zod.number().nullish(),
  "opening_cash_was_edited": zod.boolean(),
  "status": zod.string(),
  "teller_id": zod.string().uuid(),
  "teller_name": zod.string()
})]).optional(),
  "suggested_opening_cash": zod.number()
})


export const OpenShiftParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const OpenShiftBody = zod.object({
  "edit_reason": zod.string().nullish(),
  "id": zod.string().uuid().nullish(),
  "opened_at": zod.string().datetime({"offset":true}).nullish(),
  "opening_cash": zod.number(),
  "opening_cash_edited": zod.boolean().nullish().describe('Ignored by the server — the carryover edit is DERIVED from the previous\nshift\'s declared closing. Kept only for API\/back-compat with clients.')
})


export const GetShiftParams = zod.object({
  "shift_id": zod.string().uuid().describe('Shift ID')
})

export const GetShiftResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the shifts list (so the \"All branches\"\nview can show which branch each shift belongs to). Other shift endpoints\nleave it `null`.'),
  "cash_discrepancy": zod.number().nullish(),
  "closed_at": zod.string().datetime({"offset":true}).nullish(),
  "closed_by": zod.string().uuid().nullish(),
  "closing_cash_declared": zod.number().nullish(),
  "closing_cash_system": zod.number().nullish(),
  "force_close_reason": zod.string().nullish(),
  "force_closed_at": zod.string().datetime({"offset":true}).nullish(),
  "force_closed_by": zod.string().uuid().nullish(),
  "id": zod.string().uuid(),
  "notes": zod.string().nullish(),
  "opened_at": zod.string().datetime({"offset":true}),
  "opening_cash": zod.number(),
  "opening_cash_edit_reason": zod.string().nullish(),
  "opening_cash_original": zod.number().nullish(),
  "opening_cash_was_edited": zod.boolean(),
  "status": zod.string(),
  "teller_id": zod.string().uuid(),
  "teller_name": zod.string()
})


export const DeleteShiftParams = zod.object({
  "shift_id": zod.string().uuid().describe('Shift ID')
})


export const ListCashMovementsParams = zod.object({
  "shift_id": zod.string().uuid().describe('Shift ID')
})

export const ListCashMovementsResponseItem = zod.object({
  "amount": zod.number(),
  "created_at": zod.string().datetime({"offset":true}),
  "id": zod.string().uuid(),
  "moved_by": zod.string().uuid(),
  "moved_by_name": zod.string(),
  "note": zod.string(),
  "shift_id": zod.string().uuid()
})
export const ListCashMovementsResponse = zod.array(ListCashMovementsResponseItem)


export const AddCashMovementParams = zod.object({
  "shift_id": zod.string().uuid().describe('Shift ID')
})

export const AddCashMovementBody = zod.object({
  "amount": zod.number(),
  "note": zod.string()
})


export const CloseShiftParams = zod.object({
  "shift_id": zod.string().uuid().describe('Shift ID')
})

export const CloseShiftBody = zod.object({
  "cash_note": zod.string().nullish(),
  "closed_at": zod.string().datetime({"offset":true}).nullish(),
  "closing_cash_declared": zod.number()
})

export const CloseShiftResponse = zod.object({
  "shift": zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the shifts list (so the \"All branches\"\nview can show which branch each shift belongs to). Other shift endpoints\nleave it `null`.'),
  "cash_discrepancy": zod.number().nullish(),
  "closed_at": zod.string().datetime({"offset":true}).nullish(),
  "closed_by": zod.string().uuid().nullish(),
  "closing_cash_declared": zod.number().nullish(),
  "closing_cash_system": zod.number().nullish(),
  "force_close_reason": zod.string().nullish(),
  "force_closed_at": zod.string().datetime({"offset":true}).nullish(),
  "force_closed_by": zod.string().uuid().nullish(),
  "id": zod.string().uuid(),
  "notes": zod.string().nullish(),
  "opened_at": zod.string().datetime({"offset":true}),
  "opening_cash": zod.number(),
  "opening_cash_edit_reason": zod.string().nullish(),
  "opening_cash_original": zod.number().nullish(),
  "opening_cash_was_edited": zod.boolean(),
  "status": zod.string(),
  "teller_id": zod.string().uuid(),
  "teller_name": zod.string()
})
})


export const ForceCloseShiftParams = zod.object({
  "shift_id": zod.string().uuid().describe('Shift ID')
})

export const ForceCloseShiftBody = zod.object({
  "reason": zod.string().nullish()
})

export const ForceCloseShiftResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the shifts list (so the \"All branches\"\nview can show which branch each shift belongs to). Other shift endpoints\nleave it `null`.'),
  "cash_discrepancy": zod.number().nullish(),
  "closed_at": zod.string().datetime({"offset":true}).nullish(),
  "closed_by": zod.string().uuid().nullish(),
  "closing_cash_declared": zod.number().nullish(),
  "closing_cash_system": zod.number().nullish(),
  "force_close_reason": zod.string().nullish(),
  "force_closed_at": zod.string().datetime({"offset":true}).nullish(),
  "force_closed_by": zod.string().uuid().nullish(),
  "id": zod.string().uuid(),
  "notes": zod.string().nullish(),
  "opened_at": zod.string().datetime({"offset":true}),
  "opening_cash": zod.number(),
  "opening_cash_edit_reason": zod.string().nullish(),
  "opening_cash_original": zod.number().nullish(),
  "opening_cash_was_edited": zod.boolean(),
  "status": zod.string(),
  "teller_id": zod.string().uuid(),
  "teller_name": zod.string()
})


export const GetShiftReportParams = zod.object({
  "shift_id": zod.string().uuid().describe('Shift ID')
})

export const GetShiftReportResponse = zod.object({
  "cash_movements": zod.array(zod.object({
  "amount": zod.number(),
  "created_at": zod.string().datetime({"offset":true}),
  "moved_by_name": zod.string(),
  "note": zod.string()
})),
  "cash_movements_in": zod.number(),
  "cash_movements_net": zod.number().describe('Net of all cash movements (in - out) as a signed integer'),
  "cash_movements_out": zod.number(),
  "expected_cash": zod.number().describe('Authoritative system (expected) cash in the drawer. For a closed shift\nthis is the snapshot taken at close (`closing_cash_system`); for an open\nshift it is computed live via the same formula. Clients should display\nthis directly instead of re-deriving it from the payment breakdown.'),
  "net_payments": zod.number(),
  "payment_summary": zod.array(zod.object({
  "is_cash": zod.boolean(),
  "order_count": zod.number(),
  "payment_method": zod.string(),
  "total": zod.number()
})),
  "printed_at": zod.string().datetime({"offset":true}),
  "shift": zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the shifts list (so the \"All branches\"\nview can show which branch each shift belongs to). Other shift endpoints\nleave it `null`.'),
  "cash_discrepancy": zod.number().nullish(),
  "closed_at": zod.string().datetime({"offset":true}).nullish(),
  "closed_by": zod.string().uuid().nullish(),
  "closing_cash_declared": zod.number().nullish(),
  "closing_cash_system": zod.number().nullish(),
  "force_close_reason": zod.string().nullish(),
  "force_closed_at": zod.string().datetime({"offset":true}).nullish(),
  "force_closed_by": zod.string().uuid().nullish(),
  "id": zod.string().uuid(),
  "notes": zod.string().nullish(),
  "opened_at": zod.string().datetime({"offset":true}),
  "opening_cash": zod.number(),
  "opening_cash_edit_reason": zod.string().nullish(),
  "opening_cash_original": zod.number().nullish(),
  "opening_cash_was_edited": zod.boolean(),
  "status": zod.string(),
  "teller_id": zod.string().uuid(),
  "teller_name": zod.string()
}),
  "total_payments": zod.number(),
  "voided_amount": zod.number()
})


export const ListStocktakesParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const ListStocktakesResponseItem = zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the stocktakes list (so the \"All\nbranches\" view can show which branch each stocktake belongs to). Other\nstocktake endpoints leave it `null`.'),
  "created_at": zod.string().datetime({"offset":true}),
  "finalized_at": zod.string().datetime({"offset":true}).nullish(),
  "finalized_by": zod.string().uuid().nullish(),
  "id": zod.string().uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.string().uuid(),
  "started_at": zod.string().datetime({"offset":true}),
  "started_by": zod.string().uuid(),
  "started_by_name": zod.string().nullish(),
  "status": zod.string()
})
export const ListStocktakesResponse = zod.array(ListStocktakesResponseItem)


export const CreateStocktakeParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const CreateStocktakeBody = zod.object({
  "note": zod.string().nullish()
})


export const GetStocktakeParams = zod.object({
  "id": zod.string().uuid().describe('Stocktake ID')
})

export const GetStocktakeResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the stocktakes list (so the \"All\nbranches\" view can show which branch each stocktake belongs to). Other\nstocktake endpoints leave it `null`.'),
  "created_at": zod.string().datetime({"offset":true}),
  "finalized_at": zod.string().datetime({"offset":true}).nullish(),
  "finalized_by": zod.string().uuid().nullish(),
  "id": zod.string().uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.string().uuid(),
  "started_at": zod.string().datetime({"offset":true}),
  "started_by": zod.string().uuid(),
  "started_by_name": zod.string().nullish(),
  "status": zod.string()
}).and(zod.object({
  "items": zod.array(zod.object({
  "branch_inventory_id": zod.string().uuid().nullish(),
  "counted_by": zod.string().uuid().nullish(),
  "counted_qty": zod.number().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "expected_qty": zod.number(),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string(),
  "note": zod.string().nullish(),
  "org_ingredient_id": zod.string().uuid(),
  "stocktake_id": zod.string().uuid(),
  "unit": zod.string(),
  "unit_cost": zod.number().nullish().describe('Piastres per unit snapshot; `null` ⟺ unknown.'),
  "variance": zod.number().nullish(),
  "variance_reason": zod.string().nullish().describe('theft | spoilage | breakage | miscount | supplier_short | transfer_error | other.')
})),
  "variance_threshold_pct": zod.number().describe('Org tolerance: a counted row whose |difference| is >= this percent of the\nexpected quantity (or that appears-from \/ vanishes-to zero) is flagged and\nrequires a `variance_reason` before the count can be finalized.')
}))


export const CancelStocktakeParams = zod.object({
  "id": zod.string().uuid().describe('Stocktake ID')
})

export const CancelStocktakeResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the stocktakes list (so the \"All\nbranches\" view can show which branch each stocktake belongs to). Other\nstocktake endpoints leave it `null`.'),
  "created_at": zod.string().datetime({"offset":true}),
  "finalized_at": zod.string().datetime({"offset":true}).nullish(),
  "finalized_by": zod.string().uuid().nullish(),
  "id": zod.string().uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.string().uuid(),
  "started_at": zod.string().datetime({"offset":true}),
  "started_by": zod.string().uuid(),
  "started_by_name": zod.string().nullish(),
  "status": zod.string()
})


export const FinalizeStocktakeParams = zod.object({
  "id": zod.string().uuid().describe('Stocktake ID')
})

export const FinalizeStocktakeResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the stocktakes list (so the \"All\nbranches\" view can show which branch each stocktake belongs to). Other\nstocktake endpoints leave it `null`.'),
  "created_at": zod.string().datetime({"offset":true}),
  "finalized_at": zod.string().datetime({"offset":true}).nullish(),
  "finalized_by": zod.string().uuid().nullish(),
  "id": zod.string().uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.string().uuid(),
  "started_at": zod.string().datetime({"offset":true}),
  "started_by": zod.string().uuid(),
  "started_by_name": zod.string().nullish(),
  "status": zod.string()
}).and(zod.object({
  "items": zod.array(zod.object({
  "branch_inventory_id": zod.string().uuid().nullish(),
  "counted_by": zod.string().uuid().nullish(),
  "counted_qty": zod.number().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "expected_qty": zod.number(),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string(),
  "note": zod.string().nullish(),
  "org_ingredient_id": zod.string().uuid(),
  "stocktake_id": zod.string().uuid(),
  "unit": zod.string(),
  "unit_cost": zod.number().nullish().describe('Piastres per unit snapshot; `null` ⟺ unknown.'),
  "variance": zod.number().nullish(),
  "variance_reason": zod.string().nullish().describe('theft | spoilage | breakage | miscount | supplier_short | transfer_error | other.')
})),
  "variance_threshold_pct": zod.number().describe('Org tolerance: a counted row whose |difference| is >= this percent of the\nexpected quantity (or that appears-from \/ vanishes-to zero) is flagged and\nrequires a `variance_reason` before the count can be finalized.')
}))


export const UpsertItemsParams = zod.object({
  "id": zod.string().uuid().describe('Stocktake ID')
})

export const UpsertItemsBody = zod.object({
  "items": zod.array(zod.object({
  "counted_qty": zod.number(),
  "note": zod.string().nullish(),
  "org_ingredient_id": zod.string().uuid(),
  "variance_reason": zod.string().nullish().describe('Why the count differs from expected. One of: theft | spoilage | breakage |\nmiscount | supplier_short | transfer_error | other. Required at finalize for\nrows whose difference exceeds the org\'s variance threshold.')
}))
})

export const UpsertItemsResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the stocktakes list (so the \"All\nbranches\" view can show which branch each stocktake belongs to). Other\nstocktake endpoints leave it `null`.'),
  "created_at": zod.string().datetime({"offset":true}),
  "finalized_at": zod.string().datetime({"offset":true}).nullish(),
  "finalized_by": zod.string().uuid().nullish(),
  "id": zod.string().uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.string().uuid(),
  "started_at": zod.string().datetime({"offset":true}),
  "started_by": zod.string().uuid(),
  "started_by_name": zod.string().nullish(),
  "status": zod.string()
}).and(zod.object({
  "items": zod.array(zod.object({
  "branch_inventory_id": zod.string().uuid().nullish(),
  "counted_by": zod.string().uuid().nullish(),
  "counted_qty": zod.number().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "expected_qty": zod.number(),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string(),
  "note": zod.string().nullish(),
  "org_ingredient_id": zod.string().uuid(),
  "stocktake_id": zod.string().uuid(),
  "unit": zod.string(),
  "unit_cost": zod.number().nullish().describe('Piastres per unit snapshot; `null` ⟺ unknown.'),
  "variance": zod.number().nullish(),
  "variance_reason": zod.string().nullish().describe('theft | spoilage | breakage | miscount | supplier_short | transfer_error | other.')
})),
  "variance_threshold_pct": zod.number().describe('Org tolerance: a counted row whose |difference| is >= this percent of the\nexpected quantity (or that appears-from \/ vanishes-to zero) is flagged and\nrequires a `variance_reason` before the count can be finalized.')
}))


export const VarianceReportParams = zod.object({
  "id": zod.string().uuid().describe('Stocktake ID')
})

export const VarianceReportResponse = zod.object({
  "net_variance_value": zod.number().describe('overage − shrinkage (net effect on inventory value).'),
  "rows": zod.array(zod.object({
  "counted_qty": zod.number().nullish(),
  "expected_qty": zod.number(),
  "ingredient_name": zod.string(),
  "is_flagged": zod.boolean().describe('True when |difference| exceeds the org threshold (or appears\/vanishes from zero).'),
  "org_ingredient_id": zod.string().uuid(),
  "unit": zod.string(),
  "unit_cost": zod.number().nullish(),
  "variance": zod.number().nullish(),
  "variance_reason": zod.string().nullish().describe('theft | spoilage | breakage | miscount | supplier_short | transfer_error | other.'),
  "variance_value": zod.number().nullish().describe('variance × unit_cost in piastres; `null` when cost unknown.')
})),
  "stocktake_id": zod.string().uuid(),
  "total_overage_value": zod.number().describe('Piastres of overage (positive variances).'),
  "total_shrinkage_value": zod.number().describe('Piastres lost to shrinkage (negative variances), as a positive number.'),
  "unknown_cost_count": zod.number().describe('Count of counted rows whose cost was unknown (excluded from totals).'),
  "variance_threshold_pct": zod.number().describe('Org tolerance used to compute `is_flagged`.')
})


export const UploadMenuItemImageParams = zod.object({
  "menu_item_id": zod.string().uuid().describe('Menu item ID')
})

export const UploadMenuItemImageBody = zod.object({
  "image": zod.instanceof(File)
})

export const UploadMenuItemImageResponse = zod.object({
  "image_url": zod.string()
})


export const ListUsersQueryParams = zod.object({
  "org_id": zod.string().uuid().optional().describe('Filter to a specific organization. Optional for super-admins\n(who see all orgs when omitted); required-by-policy for everyone\nelse (overridden server-side to the caller\'s own org).')
})

export const ListUsersResponseItem = zod.object({
  "branch_id": zod.string().uuid().nullish(),
  "email": zod.string().nullish(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.string().uuid().nullish(),
  "phone": zod.string().nullish(),
  "role": zod.enum(['super_admin', 'org_admin', 'branch_manager', 'teller'])
})
export const ListUsersResponse = zod.array(ListUsersResponseItem)


export const createUserBodyPinMin = 4;
export const createUserBodyPinMax = 6;


export const createUserBodyPinRegExp = new RegExp('^[0-9]{4,6}$');


export const CreateUserBody = zod.object({
  "branch_ids": zod.array(zod.string().uuid()).nullish().describe('Branches to assign the new user to immediately. Branch managers\ncan only assign to branches they themselves are assigned to.'),
  "email": zod.string().email().nullish().describe('Required for admins and managers; ignored for tellers.'),
  "name": zod.string(),
  "org_id": zod.string().uuid(),
  "password": zod.string().nullish().describe('Required when `role` is anything other than `teller`. Plain text;\nhashed server-side with bcrypt before storage.'),
  "phone": zod.string().nullish(),
  "pin": zod.string().min(createUserBodyPinMin).max(createUserBodyPinMax).regex(createUserBodyPinRegExp).nullish().describe('Required when `role = teller`. 4–6 ASCII digits.'),
  "role": zod.enum(['super_admin', 'org_admin', 'branch_manager', 'teller'])
})


export const GetUserParams = zod.object({
  "id": zod.string().uuid().describe('User ID')
})

export const GetUserResponse = zod.object({
  "branch_id": zod.string().uuid().nullish(),
  "email": zod.string().nullish(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.string().uuid().nullish(),
  "phone": zod.string().nullish(),
  "role": zod.enum(['super_admin', 'org_admin', 'branch_manager', 'teller'])
})


export const DeleteUserParams = zod.object({
  "id": zod.string().uuid().describe('User ID')
})


export const UpdateUserParams = zod.object({
  "id": zod.string().uuid().describe('User ID')
})

export const updateUserBodyPinMin = 4;
export const updateUserBodyPinMax = 6;


export const updateUserBodyPinRegExp = new RegExp('^[0-9]{4,6}$');


export const UpdateUserBody = zod.object({
  "email": zod.string().email().nullish(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string().nullish(),
  "password": zod.string().nullish().describe('Plain-text new password. Server-side bcrypt-hashed.'),
  "phone": zod.string().nullish(),
  "pin": zod.string().min(updateUserBodyPinMin).max(updateUserBodyPinMax).regex(updateUserBodyPinRegExp).nullish(),
  "role": zod.union([zod.null(),zod.enum(['super_admin', 'org_admin', 'branch_manager', 'teller']).describe('Only org-admins and above can change roles. Promoting to\n`super_admin` requires the caller to be a super-admin.')]).optional()
})

export const UpdateUserResponse = zod.object({
  "branch_id": zod.string().uuid().nullish(),
  "email": zod.string().nullish(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.string().uuid().nullish(),
  "phone": zod.string().nullish(),
  "role": zod.enum(['super_admin', 'org_admin', 'branch_manager', 'teller'])
})


export const ListUserBranchesParams = zod.object({
  "id": zod.string().uuid().describe('User ID')
})

export const ListUserBranchesResponseItem = zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string()
})
export const ListUserBranchesResponse = zod.array(ListUserBranchesResponseItem)


export const AssignBranchParams = zod.object({
  "id": zod.string().uuid().describe('User ID')
})

export const AssignBranchBody = zod.object({
  "branch_id": zod.string().uuid()
})


export const UnassignBranchParams = zod.object({
  "id": zod.string().uuid().describe('User ID'),
  "branch_id": zod.string().uuid().describe('Branch ID')
})


