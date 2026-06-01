import re

with open("src/shared/types/index.ts", "r") as f:
    content = f.read()

# Remove all translations from Bundle and BundleWithComponents first
content = re.sub(r'\s*name_translations:[^\n]+', '', content)
content = re.sub(r'\s*description_translations:[^\n]+', '', content)

def insert_after(pattern, insertion, text):
    return re.sub(pattern, r'\1\n  ' + insertion, text)

# Add name_translations to Category
content = insert_after(r'(export interface Category \{[^}]*?name: string;)', r'name_translations: Record<string, any>;', content)
# Add name_translations to AddonItem
content = insert_after(r'(export interface AddonItem \{[^}]*?name: string;)', r'name_translations: Record<string, any>;', content)
# Add translations to MenuItem
content = insert_after(r'(export interface MenuItem \{[^}]*?name: string;)', r'name_translations: Record<string, any>;', content)
content = insert_after(r'(export interface MenuItem \{[^}]*?description\?: string \| null;)', r'description_translations: Record<string, any>;', content)

# Add name_translations to PublicCategory
content = insert_after(r'(export interface PublicCategory \{[^}]*?name: string;)', r'name_translations: Record<string, any>;', content)
# Add name_translations to PublicAddonItem
content = insert_after(r'(export interface PublicAddonItem \{[^}]*?name: string;)', r'name_translations: Record<string, any>;', content)
# Add translations to PublicMenuItem
content = insert_after(r'(export interface PublicMenuItem \{[^}]*?name: string;)', r'name_translations: Record<string, any>;', content)
content = insert_after(r'(export interface PublicMenuItem \{[^}]*?description\?: string \| null;)', r'description_translations: Record<string, any>;', content)

# Add translations to Bundle
content = insert_after(r'(export interface Bundle \{[^}]*?name: string;)', r'name_translations: Record<string, any>;', content)
content = insert_after(r'(export interface Bundle \{[^}]*?description: string \| null;)', r'description_translations: Record<string, any>;', content)

# Add translations to BundleWithComponents
content = insert_after(r'(export interface BundleWithComponents \{[^}]*?name: string;)', r'name_translations: Record<string, any>;', content)
content = insert_after(r'(export interface BundleWithComponents \{[^}]*?description: string \| null;)', r'description_translations: Record<string, any>;', content)

# Discount
content = insert_after(r'(export interface Discount \{[^}]*?name: string;)', r'name_translations: Record<string, any>;', content)


with open("src/shared/types/index.ts", "w") as f:
    f.write(content)
