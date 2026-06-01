import re

with open("src/pages/public-menu/public-menu.tsx", "r") as f:
    content = f.read()

# 1. Add translation helpers
helpers = """
const getTranslatedName = (entity: { name: string; name_translations?: Record<string, string> }, lang: string) => {
  if (lang === "ar" && entity.name_translations?.ar) return entity.name_translations.ar;
  return entity.name;
};

const getTranslatedDesc = (entity: { description?: string | null; description_translations?: Record<string, string> }, lang: string) => {
  if (lang === "ar" && entity.description_translations?.ar) return entity.description_translations.ar;
  return entity.description;
};
"""
content = content.replace('const uid = () =>', helpers + '\nconst uid = () =>')

# 2. Add language toggle in header
header_btn = """
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-2xl bg-slate-100/60 relative h-11 w-11 flex-shrink-0 text-sm font-bold"
              onClick={() => {
                haptic("light");
                i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar");
              }}
              aria-label="Toggle language"
            >
              {i18n.language === "ar" ? "EN" : "عربي"}
            </Button>
            <Button
"""
content = content.replace('          <Button\n            ref={cartButtonRef}', header_btn + '            ref={cartButtonRef}')
content = content.replace('            </Button>\n        </div>\n      </header>', '            </Button>\n          </div>\n        </div>\n      </header>')


# 3. Use helpers instead of .name and .description
content = re.sub(r'normalize\(it\.name\)', r'normalize(getTranslatedName(it, i18n.language))', content)
content = re.sub(r'normalize\(it\.description \?\? ""\)', r'normalize(getTranslatedDesc(it, i18n.language) ?? "")', content)

content = re.sub(r'\{cat\.name\}', r'{getTranslatedName(cat, i18n.language)}', content)
content = re.sub(r'\{item\.name\}', r'{getTranslatedName(item, i18n.language)}', content)
content = re.sub(r'alt=\{item\.name\}', r'alt={getTranslatedName(item, i18n.language)}', content)
content = re.sub(r'fallbackName=\{item\.name\}', r'fallbackName={getTranslatedName(item, i18n.language)}', content)
content = re.sub(r'ariaLabel=\{localItem\?\.name\}', r'ariaLabel={localItem ? getTranslatedName(localItem, i18n.language) : ""}', content)

content = re.sub(r'addonName:\s*a\.name', r'addonName: getTranslatedName(a, i18n.language)', content)
content = re.sub(r'itemName:\s*item\.name', r'itemName: getTranslatedName(item, i18n.language)', content)

content = re.sub(r'\{a\.name\}', r'{getTranslatedName(a, i18n.language)}', content)

# Descriptions
content = re.sub(r'\{item\.description\}', r'{getTranslatedDesc(item, i18n.language)}', content)
content = re.sub(r'item\.description\s*&&\s*\(', r'getTranslatedDesc(item, i18n.language) && (', content)
content = re.sub(r'localItem\?\.description\s*&&\s*\(', r'getTranslatedDesc(localItem, i18n.language) && (', content)
content = re.sub(r'\{localItem\.description\}', r'{getTranslatedDesc(localItem, i18n.language)}', content)


with open("src/pages/public-menu/public-menu.tsx", "w") as f:
    f.write(content)
