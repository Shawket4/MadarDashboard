/** Pick the Arabic name when the language is Arabic and a translation exists. */
export function getTranslatedName(
  item: { name: string; name_translations?: unknown } | null | undefined,
  lang: string,
): string {
  if (!item) return "";
  const tr = item.name_translations as Record<string, unknown> | null | undefined;
  if (lang.startsWith("ar") && tr && typeof tr["ar"] === "string") return tr["ar"];
  return item.name;
}

/** Pick the Arabic description when available. */
export function getTranslatedDescription(
  item: { description?: string | null; description_translations?: unknown } | null | undefined,
  lang: string,
): string | null {
  if (!item) return null;
  const tr = item.description_translations as Record<string, unknown> | null | undefined;
  if (lang.startsWith("ar") && tr && typeof tr["ar"] === "string") return tr["ar"];
  return item.description || null;
}
