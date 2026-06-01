import re

with open("src/pages/orders/orders.tsx", "r") as f:
    content = f.read()

# Add imports
if "getTranslatedName" not in content:
    content = content.replace("import { exportToExcel } from \"@/shared/lib/excel\";", "import { exportToExcel } from \"@/shared/lib/excel\";\nimport { getTranslatedName } from \"@/shared/lib/translation\";")

# Add i18n
content = content.replace("const { t } = useTranslation();", "const { t, i18n } = useTranslation();")

# Replace names in Orders
content = content.replace("{it.item_name}", "{getTranslatedName({ name: it.item_name, name_translations: it.name_translations }, i18n.language)}")
content = content.replace("– {c.item_name}", "– {getTranslatedName({ name: c.item_name, name_translations: c.name_translations }, i18n.language)}")
content = content.replace("{a.addon_name}", "{getTranslatedName({ name: a.addon_name, name_translations: a.name_translations }, i18n.language)}")
content = content.replace("const optionName = o.field_name;", "const optionName = getTranslatedName({ name: o.field_name || '', name_translations: o.name_translations }, i18n.language);")

with open("src/pages/orders/orders.tsx", "w") as f:
    f.write(content)

