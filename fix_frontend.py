import re

# 1. Fix public-menu.tsx
with open("src/pages/public-menu/public-menu.tsx", "r") as f:
    content = f.read()

# Fix i18n not being read warning, but actually we need to make sure i18n is available at 1459
content = content.replace(
    "const CategorySection = ({ category, menuItems, activeCategoryId }: { category: PublicCategory; menuItems: PublicMenuItem[]; activeCategoryId: string | null }) => {",
    "const CategorySection = ({ category, menuItems, activeCategoryId }: { category: PublicCategory; menuItems: PublicMenuItem[]; activeCategoryId: string | null }) => {\n  const { t, i18n } = useTranslation();"
)

# If we added i18n to places where it's not needed, we should just let tsc tell us, or we can just ignore TS6133 for now.
# Actually let's just restore index.ts

with open("src/pages/public-menu/public-menu.tsx", "w") as f:
    f.write(content)

# 2. Fix index.ts
with open("src/shared/types/index.ts", "r") as f:
    types = f.read()

def add_field(struct_name, field):
    global types
    pattern = r'(export interface ' + struct_name + r'\s*\{[^}]*?)(\n})'
    types = re.sub(pattern, r'\1\n  ' + field + r'\2', types)

add_field("Category", "name_translations: Record<string, any>;")
add_field("AddonItem", "name_translations: Record<string, any>;")
add_field("MenuItem", "name_translations: Record<string, any>;\n  description_translations: Record<string, any>;")
add_field("Discount", "name_translations: Record<string, any>;")
add_field("PublicAddonItem", "name_translations: Record<string, any>;")
add_field("PublicMenuItem", "name_translations: Record<string, any>;\n  description_translations: Record<string, any>;")
add_field("PublicCategory", "name_translations: Record<string, any>;")
add_field("Bundle", "name_translations: Record<string, any>;\n  description_translations: Record<string, any>;")
add_field("BundleWithComponents", "name_translations: Record<string, any>;\n  description_translations: Record<string, any>;")

with open("src/shared/types/index.ts", "w") as f:
    f.write(types)
