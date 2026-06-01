import re

with open("src/pages/public-menu/public-menu.tsx", "r") as f:
    content = f.read()

# 1. Change type of getTranslatedName and getTranslatedDesc to use any
content = content.replace(
    'const getTranslatedName = (entity: { name: string; name_translations?: Record<string, string> }, lang: string) => {',
    'const getTranslatedName = (entity: { name: string; name_translations?: any }, lang: string) => {'
)
content = content.replace(
    'const getTranslatedDesc = (entity: { description?: string | null; description_translations?: Record<string, string> }, lang: string) => {',
    'const getTranslatedDesc = (entity: { description?: string | null; description_translations?: any }, lang: string) => {'
)

# 2. Add useTranslation to ItemCard and ItemDetails
def add_usetranslation(match):
    return match.group(0) + '\n  const { i18n } = useTranslation();'

content = re.sub(r'function ItemCard\(\{[^}]+\}: \{[^}]+\}\) \{', add_usetranslation, content)
content = re.sub(r'function ItemDetails\(\{[^}]+\}: \{[^}]+\}\) \{', add_usetranslation, content)

with open("src/pages/public-menu/public-menu.tsx", "w") as f:
    f.write(content)
