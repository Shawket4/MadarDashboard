import re

with open("src/shared/types/index.ts", "r") as f:
    content = f.read()

# Make translations optional
content = content.replace("name_translations: Record<string, any>;", "name_translations?: Record<string, any>;")
content = content.replace("description_translations: Record<string, any>;", "description_translations?: Record<string, any>;")

# Remove description_translations from Category (it's around line 58)
category_block = re.search(r'export interface Category \{[^}]+\}', content).group(0)
new_category_block = re.sub(r'\s*description_translations\?: Record<string, any>;\n', '\n', category_block)
content = content.replace(category_block, new_category_block)

with open("src/shared/types/index.ts", "w") as f:
    f.write(content)
