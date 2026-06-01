import os
import re

def process_discounts():
    path = "src/pages/discounts/discounts.tsx"
    with open(path, "r") as f:
        content = f.read()
        
    # Add import
    if "getTranslatedName" not in content:
        content = content.replace("import { exportToExcel } from \"@/shared/lib/excel\";", "import { exportToExcel } from \"@/shared/lib/excel\";\nimport { getTranslatedName } from \"@/shared/lib/translation\";")
    
    # Add i18n
    content = content.replace("const { t } = useTranslation();", "const { t, i18n } = useTranslation();")
    
    # Update table cell
    content = content.replace("<p className=\"font-semibold text-sm\">{row.original.name}</p>", "<p className=\"font-semibold text-sm\">{getTranslatedName(row.original, i18n.language)}</p>")
    
    # Update exportToExcel accessor
    content = content.replace("accessor: (d: Discount) => d.name", "accessor: (d: Discount) => getTranslatedName(d, i18n.language)")
    
    with open(path, "w") as f:
        f.write(content)

def process_recipes():
    path = "src/pages/recipes/recipes.tsx"
    with open(path, "r") as f:
        content = f.read()

    # Add import
    if "getTranslatedName" not in content:
        content = content.replace("import { exportToExcel } from \"@/shared/lib/excel\";", "import { exportToExcel } from \"@/shared/lib/excel\";\nimport { getTranslatedName, getTranslatedLabel } from \"@/shared/lib/translation\";")
        
    # Add i18n
    if "const { t, i18n } = useTranslation();" not in content:
        content = content.replace("const { t } = useTranslation();", "const { t, i18n } = useTranslation();")
        
    # Update AddonSlots UI
    content = content.replace("<p className=\"text-sm font-medium\">{s.label ?? t(`menu.addonTypes.${s.addon_type}`, { defaultValue: s.addon_type })}</p>", "<p className=\"text-sm font-medium\">{getTranslatedLabel(s, i18n.language) ?? t(`menu.addonTypes.${s.addon_type}`, { defaultValue: s.addon_type })}</p>")
    
    # Update OptionalFields UI
    content = content.replace("<p className=\"text-sm font-medium\">{o.name}</p>", "<p className=\"text-sm font-medium\">{getTranslatedName(o, i18n.language)}</p>")
    
    # Update exportToExcel accessors
    content = content.replace("accessor: (s: AddonSlot) => s.label ?? s.addon_type", "accessor: (s: AddonSlot) => getTranslatedLabel(s, i18n.language) ?? s.addon_type")
    content = content.replace("accessor: (o: OptionalField) => o.name", "accessor: (o: OptionalField) => getTranslatedName(o, i18n.language)")
    content = content.replace("accessor: (r: MenuItemEmbeddedRecipe) => r.ingredient_name", "accessor: (r: MenuItemEmbeddedRecipe) => getTranslatedName({ name: r.ingredient_name, name_translations: r.name_translations }, i18n.language)")

    with open(path, "w") as f:
        f.write(content)
        
def process_menu():
    path = "src/pages/menu/menu.tsx"
    with open(path, "r") as f:
        content = f.read()

    # Update exportToExcel accessors
    content = content.replace("accessor: (m: MenuItem) => m.name", "accessor: (m: MenuItem) => getTranslatedName(m, i18n.language)")
    content = content.replace("accessor: (m: MenuItem) => m.description ?? \"—\"", "accessor: (m: MenuItem) => getTranslatedDescription(m, i18n.language) ?? \"—\"")
    content = content.replace("accessor: (c: Category) => c.name", "accessor: (c: Category) => getTranslatedName(c, i18n.language)")
    content = content.replace("accessor: (a: AddonItem) => a.name", "accessor: (a: AddonItem) => getTranslatedName(a, i18n.language)")
    
    with open(path, "w") as f:
        f.write(content)
        

process_discounts()
process_recipes()
process_menu()
print("Done patching.")
