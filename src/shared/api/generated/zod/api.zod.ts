/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import * as zod from 'zod';


export const ListAddonItemsQueryParams = zod.object({
  "org_id": zod.string().uuid(),
  "addon_type": zod.string().optional()
})

export const ListAddonItemsResponseItem = zod.object({
  "addon_type": zod.string(),
  "created_at": zod.string().datetime({"offset":true}),
  "default_price": zod.number(),
  "display_order": zod.number(),
  "id": zod.string().uuid(),
  "ingredients": zod.array(zod.object({
  "ingredient_name": zod.string(),
  "ingredient_unit": zod.string(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "quantity_used": zod.number()
})).optional(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.string().uuid(),
  "primary_ingredient_id": zod.string().uuid().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
})
export const ListAddonItemsResponse = zod.array(ListAddonItemsResponseItem)


export const CreateAddonItemBody = zod.object({
  "addon_type": zod.string(),
  "default_price": zod.number(),
  "display_order": zod.number().nullish(),
  "name": zod.string(),
  "org_id": zod.string().uuid()
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
  "display_order": zod.number().nullish(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string().nullish()
})

export const UpdateAddonItemResponse = zod.object({
  "addon_type": zod.string(),
  "created_at": zod.string().datetime({"offset":true}),
  "default_price": zod.number(),
  "display_order": zod.number(),
  "id": zod.string().uuid(),
  "ingredients": zod.array(zod.object({
  "ingredient_name": zod.string(),
  "ingredient_unit": zod.string(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "quantity_used": zod.number()
})).optional(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.string().uuid(),
  "primary_ingredient_id": zod.string().uuid().nullish(),
  "updated_at": zod.string().datetime({"offset":true})
})


export const loginBodyPinMin = 4;
export const loginBodyPinMax = 6;


export const loginBodyPinRegExp = new RegExp('^[0-9]{4,6}$');


export const LoginBody = zod.object({
  "branch_id": zod.string().uuid().nullish().describe('Teller-only: locks the issued JWT to a specific branch.'),
  "email": zod.string().email().nullish(),
  "name": zod.string().nullish().describe('Teller\'s display name (required for PIN login, unused otherwise).'),
  "org_id": zod.string().uuid().nullish(),
  "password": zod.string().nullish(),
  "pin": zod.string().min(loginBodyPinMin).max(loginBodyPinMax).regex(loginBodyPinRegExp).nullish()
}).describe('Login is dual-mode:\n\n- \*\*Email + password\*\* (admins, managers, super-admins): supply\n  `email` and `password`. `org_id` is optional — if provided, the\n  user must belong to that org; if omitted, lookup is by email only.\n- \*\*PIN + name\*\* (tellers): supply `name` and `pin`. The first\n  active teller with a matching name and a `pin_hash` that verifies\n  wins. `branch_id` may be supplied to lock the issued JWT to that\n  branch; tellers without a branch lock can later be reassigned.')

export const LoginResponse = zod.object({
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


export const ListBranchesQueryParams = zod.object({
  "org_id": zod.string().uuid().describe('Organization whose branches to list. Must match the caller\'s JWT org.')
})

export const ListBranchesResponseItem = zod.object({
  "address": zod.string().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
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
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
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
  "is_active": zod.boolean().nullish(),
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
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
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
  "per_page": zod.number().optional()
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
  "display_order": zod.number(),
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
  "display_order": zod.number().nullish(),
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
  "display_order": zod.number(),
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
  "display_order": zod.number(),
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
  "display_order": zod.number().nullish(),
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
  "display_order": zod.number(),
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
  "display_order": zod.number(),
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
  "display_order": zod.number(),
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
  "display_order": zod.number(),
  "id": zod.string().uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.string().uuid(),
  "updated_at": zod.string().datetime({"offset":true})
})
export const ListCategoriesResponse = zod.array(ListCategoriesResponseItem)


export const CreateCategoryBody = zod.object({
  "display_order": zod.number().nullish(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "org_id": zod.string().uuid()
})


export const DeleteCategoryParams = zod.object({
  "id": zod.string().uuid().describe('Category ID')
})


export const UpdateCategoryParams = zod.object({
  "id": zod.string().uuid().describe('Category ID')
})

export const UpdateCategoryBody = zod.object({
  "display_order": zod.number().nullish(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string().nullish()
})

export const UpdateCategoryResponse = zod.object({
  "created_at": zod.string().datetime({"offset":true}),
  "deleted_at": zod.string().datetime({"offset":true}).nullish(),
  "display_order": zod.number(),
  "id": zod.string().uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.string().uuid(),
  "updated_at": zod.string().datetime({"offset":true})
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
  "org_id": zod.string().uuid(),
  "updated_at": zod.string().datetime({"offset":true}),
  "value": zod.number()
})
export const ListDiscountsResponse = zod.array(ListDiscountsResponseItem)


export const CreateDiscountBody = zod.object({
  "dtype": zod.string(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string(),
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
  "value": zod.number().nullish()
})

export const UpdateDiscountResponse = zod.object({
  "created_at": zod.string().datetime({"offset":true}),
  "dtype": zod.string(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
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


export const ListBranchStockParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const ListBranchStockResponseItem = zod.object({
  "below_reorder": zod.boolean(),
  "branch_id": zod.string().uuid(),
  "cost_per_unit": zod.number(),
  "created_at": zod.string().datetime({"offset":true}),
  "current_stock": zod.number(),
  "description": zod.string().nullish(),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string(),
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
  "cost_per_unit": zod.number(),
  "created_at": zod.string().datetime({"offset":true}),
  "current_stock": zod.number(),
  "description": zod.string().nullish(),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string(),
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


export const ListCatalogParams = zod.object({
  "org_id": zod.string().uuid().describe('Organization ID')
})

export const ListCatalogResponseItem = zod.object({
  "category": zod.string(),
  "cost_per_unit": zod.number(),
  "created_at": zod.string().datetime({"offset":true}),
  "description": zod.string().nullish(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.string().uuid(),
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
  "unit": zod.string().nullish()
})

export const UpdateCatalogItemResponse = zod.object({
  "category": zod.string(),
  "cost_per_unit": zod.number(),
  "created_at": zod.string().datetime({"offset":true}),
  "description": zod.string().nullish(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.string().uuid(),
  "unit": zod.string(),
  "updated_at": zod.string().datetime({"offset":true})
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


export const ListMenuItemsQueryParams = zod.object({
  "org_id": zod.string().uuid(),
  "category_id": zod.string().uuid().optional(),
  "full": zod.boolean().optional()
})

export const ListMenuItemsResponseItem = zod.object({
  "base_price": zod.number(),
  "category_id": zod.string().uuid().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "default_milk_addon_id": zod.string().nullish(),
  "deleted_at": zod.string().datetime({"offset":true}).nullish(),
  "description": zod.string().nullish(),
  "display_order": zod.number(),
  "id": zod.string().uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.string().uuid(),
  "updated_at": zod.string().datetime({"offset":true})
}).and(zod.object({
  "addon_slots": zod.array(zod.object({
  "addon_type": zod.string(),
  "created_at": zod.string().datetime({"offset":true}),
  "display_order": zod.number(),
  "id": zod.string().uuid(),
  "is_required": zod.boolean(),
  "label": zod.string().nullish(),
  "max_selections": zod.number().nullish(),
  "menu_item_id": zod.string().uuid(),
  "min_selections": zod.number()
})),
  "optional_fields": zod.array(zod.object({
  "created_at": zod.string().datetime({"offset":true}),
  "display_order": zod.number(),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "is_active": zod.boolean(),
  "menu_item_id": zod.string().uuid(),
  "name": zod.string(),
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
  "display_order": zod.number(),
  "id": zod.string().uuid(),
  "is_active": zod.boolean(),
  "label": zod.string(),
  "menu_item_id": zod.string().uuid(),
  "price_override": zod.number()
}))
}))
export const ListMenuItemsResponse = zod.array(ListMenuItemsResponseItem)


export const CreateMenuItemBody = zod.object({
  "base_price": zod.number(),
  "category_id": zod.string().uuid(),
  "description": zod.string().nullish(),
  "display_order": zod.number().nullish(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
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
  "display_order": zod.number(),
  "id": zod.string().uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.string().uuid(),
  "updated_at": zod.string().datetime({"offset":true})
}).and(zod.object({
  "addon_slots": zod.array(zod.object({
  "addon_type": zod.string(),
  "created_at": zod.string().datetime({"offset":true}),
  "display_order": zod.number(),
  "id": zod.string().uuid(),
  "is_required": zod.boolean(),
  "label": zod.string().nullish(),
  "max_selections": zod.number().nullish(),
  "menu_item_id": zod.string().uuid(),
  "min_selections": zod.number()
})),
  "optional_fields": zod.array(zod.object({
  "created_at": zod.string().datetime({"offset":true}),
  "display_order": zod.number(),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "is_active": zod.boolean(),
  "menu_item_id": zod.string().uuid(),
  "name": zod.string(),
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
  "display_order": zod.number(),
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
  "display_order": zod.number().nullish(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string().nullish()
})

export const UpdateMenuItemResponse = zod.object({
  "base_price": zod.number(),
  "category_id": zod.string().uuid().nullish(),
  "created_at": zod.string().datetime({"offset":true}),
  "default_milk_addon_id": zod.string().nullish(),
  "deleted_at": zod.string().datetime({"offset":true}).nullish(),
  "description": zod.string().nullish(),
  "display_order": zod.number(),
  "id": zod.string().uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.string().uuid(),
  "updated_at": zod.string().datetime({"offset":true})
})


export const ListAddonSlotsParams = zod.object({
  "id": zod.string().uuid().describe('Menu item ID')
})

export const ListAddonSlotsResponseItem = zod.object({
  "addon_type": zod.string(),
  "created_at": zod.string().datetime({"offset":true}),
  "display_order": zod.number(),
  "id": zod.string().uuid(),
  "is_required": zod.boolean(),
  "label": zod.string().nullish(),
  "max_selections": zod.number().nullish(),
  "menu_item_id": zod.string().uuid(),
  "min_selections": zod.number()
})
export const ListAddonSlotsResponse = zod.array(ListAddonSlotsResponseItem)


export const CreateAddonSlotParams = zod.object({
  "id": zod.string().uuid().describe('Menu item ID')
})

export const CreateAddonSlotBody = zod.object({
  "addon_type": zod.string(),
  "display_order": zod.number().nullish(),
  "is_required": zod.boolean().nullish(),
  "label": zod.string().nullish(),
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
  "display_order": zod.number().nullish(),
  "is_required": zod.boolean().nullish(),
  "label": zod.string().nullish(),
  "max_selections": zod.number().nullish(),
  "min_selections": zod.number().nullish()
})

export const UpdateAddonSlotResponse = zod.object({
  "addon_type": zod.string(),
  "created_at": zod.string().datetime({"offset":true}),
  "display_order": zod.number(),
  "id": zod.string().uuid(),
  "is_required": zod.boolean(),
  "label": zod.string().nullish(),
  "max_selections": zod.number().nullish(),
  "menu_item_id": zod.string().uuid(),
  "min_selections": zod.number()
})


export const ListOptionalFieldsParams = zod.object({
  "id": zod.string().uuid().describe('Menu item ID')
})

export const ListOptionalFieldsResponseItem = zod.object({
  "created_at": zod.string().datetime({"offset":true}),
  "display_order": zod.number(),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "is_active": zod.boolean(),
  "menu_item_id": zod.string().uuid(),
  "name": zod.string(),
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
  "display_order": zod.number().nullish(),
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "name": zod.string(),
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
  "display_order": zod.number().nullish(),
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string().nullish(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "price": zod.number().nullish(),
  "quantity_used": zod.number().nullish(),
  "size_label": zod.string().nullish()
})

export const UpdateOptionalFieldResponse = zod.object({
  "created_at": zod.string().datetime({"offset":true}),
  "display_order": zod.number(),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "is_active": zod.boolean(),
  "menu_item_id": zod.string().uuid(),
  "name": zod.string(),
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
  "display_order": zod.number().nullish(),
  "label": zod.string(),
  "price_override": zod.number()
})

export const UpsertSizeResponse = zod.object({
  "display_order": zod.number(),
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


export const GetPublicMenuParams = zod.object({
  "org_id": zod.string().uuid().describe('Organization ID')
})

export const GetPublicMenuResponse = zod.object({
  "categories": zod.array(zod.object({
  "display_order": zod.number(),
  "id": zod.string().uuid(),
  "image_url": zod.string().nullish(),
  "items": zod.array(zod.object({
  "addon_slots": zod.array(zod.object({
  "addon_items": zod.array(zod.object({
  "default_price": zod.number(),
  "id": zod.string().uuid(),
  "name": zod.string()
})),
  "addon_type": zod.string(),
  "id": zod.string().uuid(),
  "is_required": zod.boolean(),
  "label": zod.string().nullish(),
  "max_selections": zod.number().nullish(),
  "min_selections": zod.number()
})),
  "base_price": zod.number(),
  "description": zod.string().nullish(),
  "display_order": zod.number(),
  "id": zod.string().uuid(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "sizes": zod.array(zod.object({
  "id": zod.string().uuid(),
  "label": zod.string(),
  "price_override": zod.number()
}))
})),
  "name": zod.string()
})),
  "logo_url": zod.string().nullish(),
  "org_id": zod.string().uuid(),
  "org_name": zod.string()
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
  "to": zod.string().datetime({"offset":true}).optional()
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
  "created_at": zod.string().datetime({"offset":true}).nullish(),
  "customer_name": zod.string().nullish(),
  "discount_id": zod.string().uuid().nullish(),
  "discount_type": zod.string().nullish(),
  "discount_value": zod.number().nullish(),
  "items": zod.array(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.string().uuid(),
  "quantity": zod.number().optional()
})),
  "bundle_components": zod.array(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.string().uuid(),
  "quantity": zod.number().optional()
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
  "size_label": zod.string().nullish()
})),
  "notes": zod.string().nullish(),
  "payment_method": zod.string(),
  "payment_splits": zod.array(zod.object({
  "amount": zod.number(),
  "method": zod.string(),
  "reference": zod.string().nullish()
})).nullish(),
  "shift_id": zod.string().uuid(),
  "tip_amount": zod.number().nullish(),
  "tip_payment_method": zod.string().nullish()
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
  "void_reason": zod.string().nullish(),
  "voided_at": zod.string().datetime({"offset":true}).nullish(),
  "voided_by": zod.string().uuid().nullish()
}).and(zod.object({
  "items": zod.array(zod.object({
  "bundle_id": zod.string().uuid().nullish(),
  "bundle_unit_price": zod.number().nullish(),
  "deductions_snapshot": zod.unknown(),
  "id": zod.string().uuid(),
  "item_name": zod.string(),
  "line_total": zod.number(),
  "menu_item_id": zod.string().uuid().nullish(),
  "notes": zod.string().nullish(),
  "order_id": zod.string().uuid(),
  "quantity": zod.number(),
  "size_label": zod.string().nullish(),
  "unit_price": zod.number()
}).and(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.string().uuid(),
  "addon_name": zod.string(),
  "id": zod.string().uuid(),
  "line_total": zod.number(),
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
  "order_line_id": zod.string().uuid(),
  "quantity": zod.number(),
  "unit_price": zod.number()
})),
  "item_id": zod.string().uuid(),
  "item_name": zod.string(),
  "optionals": zod.array(zod.object({
  "component_item_id": zod.string().uuid(),
  "field_name": zod.string(),
  "id": zod.string().uuid(),
  "optional_field_id": zod.string().uuid().nullish(),
  "order_line_id": zod.string().uuid(),
  "price": zod.number()
})),
  "quantity": zod.number(),
  "size_label": zod.string().nullish()
})).optional(),
  "optionals": zod.array(zod.object({
  "field_name": zod.string(),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
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
  "void_reason": zod.string().nullish(),
  "voided_at": zod.string().datetime({"offset":true}).nullish(),
  "voided_by": zod.string().uuid().nullish()
}).and(zod.object({
  "items": zod.array(zod.object({
  "bundle_id": zod.string().uuid().nullish(),
  "bundle_unit_price": zod.number().nullish(),
  "deductions_snapshot": zod.unknown(),
  "id": zod.string().uuid(),
  "item_name": zod.string(),
  "line_total": zod.number(),
  "menu_item_id": zod.string().uuid().nullish(),
  "notes": zod.string().nullish(),
  "order_id": zod.string().uuid(),
  "quantity": zod.number(),
  "size_label": zod.string().nullish(),
  "unit_price": zod.number()
}).and(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.string().uuid(),
  "addon_name": zod.string(),
  "id": zod.string().uuid(),
  "line_total": zod.number(),
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
  "order_line_id": zod.string().uuid(),
  "quantity": zod.number(),
  "unit_price": zod.number()
})),
  "item_id": zod.string().uuid(),
  "item_name": zod.string(),
  "optionals": zod.array(zod.object({
  "component_item_id": zod.string().uuid(),
  "field_name": zod.string(),
  "id": zod.string().uuid(),
  "optional_field_id": zod.string().uuid().nullish(),
  "order_line_id": zod.string().uuid(),
  "price": zod.number()
})),
  "quantity": zod.number(),
  "size_label": zod.string().nullish()
})).optional(),
  "optionals": zod.array(zod.object({
  "field_name": zod.string(),
  "id": zod.string().uuid(),
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "optional_field_id": zod.string().uuid().nullish(),
  "order_item_id": zod.string().uuid(),
  "org_ingredient_id": zod.string().uuid().nullish(),
  "price": zod.number(),
  "quantity_deducted": zod.number().nullish()
}))
})))
}))


export const VoidOrderParams = zod.object({
  "order_id": zod.string().uuid().describe('Order ID')
})

export const VoidOrderBody = zod.object({
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


export const ListPaymentMethodsResponseItem = zod.object({
  "color": zod.string(),
  "created_at": zod.string().datetime({"offset":true}),
  "display_order": zod.number(),
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
  "display_order": zod.number().nullish(),
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
  "display_order": zod.number().nullish(),
  "icon": zod.string().nullish(),
  "is_active": zod.boolean().nullish(),
  "is_cash": zod.boolean().nullish(),
  "label_translations": zod.record(zod.string(), zod.string()).nullish(),
  "name": zod.string().nullish()
})

export const UpdatePaymentMethodResponse = zod.object({
  "color": zod.string(),
  "created_at": zod.string().datetime({"offset":true}),
  "display_order": zod.number(),
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
  "display_order": zod.number(),
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
  "display_order": zod.number(),
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
  "standalone_qty": zod.number(),
  "total_qty": zod.number()
})
export const BranchCombinedItemSalesResponse = zod.array(BranchCombinedItemSalesResponseItem)


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
  "item_count": zod.number(),
  "items": zod.array(zod.object({
  "item_name": zod.string(),
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


export const BranchStockParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const BranchStockResponse = zod.object({
  "branch_id": zod.string().uuid(),
  "branch_name": zod.string(),
  "items": zod.array(zod.object({
  "below_reorder": zod.boolean(),
  "branch_inventory_id": zod.string().uuid(),
  "cost_per_unit": zod.number(),
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


export const ShiftInventoryDiscrepanciesParams = zod.object({
  "shift_id": zod.string().uuid().describe('Shift ID')
})

export const ShiftInventoryDiscrepanciesResponseItem = zod.object({
  "actual_count": zod.number().nullish(),
  "branch_inventory_id": zod.string().uuid(),
  "discrepancy": zod.number().nullish(),
  "expected_stock": zod.number(),
  "ingredient_name": zod.string(),
  "note": zod.string().nullish(),
  "unit": zod.string()
})
export const ShiftInventoryDiscrepanciesResponse = zod.array(ShiftInventoryDiscrepanciesResponseItem)


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
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const ListShiftsResponseItem = zod.object({
  "branch_id": zod.string().uuid(),
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
export const ListShiftsResponse = zod.array(ListShiftsResponseItem)


export const GetCurrentShiftParams = zod.object({
  "branch_id": zod.string().uuid().describe('Branch ID')
})

export const GetCurrentShiftResponse = zod.object({
  "has_open_shift": zod.boolean(),
  "open_shift": zod.union([zod.null(),zod.object({
  "branch_id": zod.string().uuid(),
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
  "opening_cash_edited": zod.boolean().nullish()
})


export const GetShiftParams = zod.object({
  "shift_id": zod.string().uuid().describe('Shift ID')
})

export const GetShiftResponse = zod.object({
  "branch_id": zod.string().uuid(),
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
  "closing_cash_declared": zod.number(),
  "inventory_counts": zod.array(zod.object({
  "actual_stock": zod.number(),
  "branch_inventory_id": zod.string().uuid(),
  "note": zod.string().nullish()
}))
})

export const CloseShiftResponse = zod.object({
  "inventory_counts": zod.array(zod.object({
  "actual_stock": zod.number(),
  "branch_inventory_id": zod.string().uuid(),
  "discrepancy": zod.number(),
  "expected_stock": zod.number(),
  "ingredient_name": zod.string(),
  "is_suspicious": zod.boolean(),
  "note": zod.string().nullish(),
  "unit": zod.string()
})),
  "shift": zod.object({
  "branch_id": zod.string().uuid(),
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
  "net_payments": zod.number(),
  "payment_summary": zod.array(zod.object({
  "order_count": zod.number(),
  "payment_method": zod.string(),
  "total": zod.number()
})),
  "printed_at": zod.string().datetime({"offset":true}),
  "shift": zod.object({
  "branch_id": zod.string().uuid(),
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


