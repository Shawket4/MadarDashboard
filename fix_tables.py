import re

with open("src/pages/menu/menu.tsx", "r") as f:
    content = f.read()

# Add imports
if "getTranslatedName" not in content:
    content = content.replace("import { exportToExcel } from \"@/shared/lib/excel\";", "import { exportToExcel } from \"@/shared/lib/excel\";\nimport { getTranslatedName, getTranslatedDescription } from \"@/shared/lib/translation\";")

# Add i18n
content = content.replace("const columns: ColumnDef<Category>[] = [", "const { i18n } = useTranslation();\n  const columns: ColumnDef<Category>[] = [")
content = content.replace("const columns: ColumnDef<MenuItem>[] = [", "const { i18n } = useTranslation();\n  const columns: ColumnDef<MenuItem>[] = [")
content = content.replace("const columns: ColumnDef<AddonItem>[] = [", "const { i18n } = useTranslation();\n  const columns: ColumnDef<AddonItem>[] = [")

# Replace names in Category table
content = content.replace("<p className=\"font-semibold text-sm\">{row.original.name}</p>", "<p className=\"font-semibold text-sm\">{getTranslatedName(row.original, i18n.language)}</p>")
content = content.replace("{row.original.description && (", "{getTranslatedDescription(row.original, i18n.language) && (")
content = content.replace("<p className=\"text-xs text-muted-foreground\">{row.original.description}</p>", "<p className=\"text-xs text-muted-foreground\">{getTranslatedDescription(row.original, i18n.language)}</p>")

# Replace names in MenuItem table
content = content.replace("<span className=\"font-semibold\">{row.original.name}</span>", "<span className=\"font-semibold\">{getTranslatedName(row.original, i18n.language)}</span>")

with open("src/pages/menu/menu.tsx", "w") as f:
    f.write(content)

with open("src/pages/orders/orders.tsx", "r") as f:
    content = f.read()

# Add imports
if "getTranslatedName" not in content:
    content = content.replace("import { exportToExcel } from \"@/shared/lib/excel\";", "import { exportToExcel } from \"@/shared/lib/excel\";\nimport { getTranslatedName } from \"@/shared/lib/translation\";")

# The orders.tsx components might not have i18n if they already have t
content = content.replace("const { t } = useTranslation();", "const { t, i18n } = useTranslation();")

# Replace names in Orders
content = content.replace("{it.item_name}", "{getTranslatedName({ name: it.item_name, name_translations: it.name_translations }, i18n.language)}")
content = content.replace("– {c.item_name}", "– {getTranslatedName({ name: c.item_name, name_translations: c.name_translations }, i18n.language)}")
content = content.replace("{a.addon_name}", "{getTranslatedName({ name: a.addon_name, name_translations: a.name_translations }, i18n.language)}")

with open("src/pages/orders/orders.tsx", "w") as f:
    f.write(content)

