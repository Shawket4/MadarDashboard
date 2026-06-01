export function getTranslatedName(item: { name: string; name_translations?: Record<string, any> } | null | undefined, lang: string): string {
  if (!item) return "";
  if (lang === "ar" && item.name_translations && item.name_translations["ar"]) {
    return item.name_translations["ar"] as string;
  }
  return item.name;
}

export function getTranslatedDescription(item: { description?: string | null; description_translations?: Record<string, any> } | null | undefined, lang: string): string | null {
  if (!item) return null;
  if (lang === "ar" && item.description_translations && item.description_translations["ar"]) {
    return item.description_translations["ar"] as string;
  }
  return item.description || null;
}

export function getTranslatedLabel(item: { label?: string | null; label_translations?: Record<string, any> } | null | undefined, lang: string): string | null {
  if (!item) return null;
  if (lang === "ar" && item.label_translations && item.label_translations["ar"]) {
    return item.label_translations["ar"] as string;
  }
  return item.label || null;
}
