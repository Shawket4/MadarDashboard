import re

with open("src/pages/analytics/analytics.tsx", "r") as f:
    code = f.read()

# Add getTranslatedName import
if "getTranslatedName" not in code:
    code = code.replace(
        'import { exportToExcel } from "@/shared/lib/excel";',
        'import { exportToExcel } from "@/shared/lib/excel";\nimport { getTranslatedName } from "@/shared/lib/translation";'
    )

# 1. Update OverviewTab topItems
code = code.replace(
    '<span className="font-medium truncate me-2">{i.item_name}</span>',
    '<span className="font-medium truncate me-2">{getTranslatedName({ name: i.item_name, name_translations: i.item_name_translations }, i18n.language)}</span>'
)
code = code.replace("const { t } = useTranslation();", "const { t, i18n } = useTranslation();")

# 2. Update ItemsTab cols
code = code.replace(
    'accessorKey: "item_name", header: t("common.name"), cell: ({ row }) => <span className="font-semibold text-sm">{row.original.item_name}</span>',
    'accessorKey: "item_name", header: t("common.name"), cell: ({ row }) => <span className="font-semibold text-sm">{getTranslatedName({ name: row.original.item_name, name_translations: row.original.item_name_translations }, i18n.language)}</span>'
)

# 3. Update addonCols
code = code.replace(
    'accessorKey: "addon_name", header: t("common.name"), cell: ({ row }) => <span className="font-semibold text-sm">{row.original.addon_name}</span>',
    'accessorKey: "addon_name", header: t("common.name"), cell: ({ row }) => <span className="font-semibold text-sm">{getTranslatedName({ name: row.original.addon_name, name_translations: row.original.addon_name_translations }, i18n.language)}</span>'
)

# 4. Update exportItems
code = code.replace(
    'accessor: (i: ItemSales) => i.item_name',
    'accessor: (i: ItemSales) => getTranslatedName({ name: i.item_name, name_translations: i.item_name_translations }, i18n.language)'
)

# 5. Update byCategory name in UI
code = code.replace(
    '<h3 className="font-semibold">{c.category_name || t("menu.uncategorized")}</h3>',
    '<h3 className="font-semibold">{c.category_name ? getTranslatedName({ name: c.category_name, name_translations: c.category_name_translations }, i18n.language) : t("menu.uncategorized")}</h3>'
)

# 6. Update exportAddons
code = code.replace(
    'accessor: (a: AddonSalesRow) => a.addon_name',
    'accessor: (a: AddonSalesRow) => getTranslatedName({ name: a.addon_name, name_translations: a.addon_name_translations }, i18n.language)'
)

with open("src/pages/analytics/analytics.tsx", "w") as f:
    f.write(code)

print("Analytics patched!")
