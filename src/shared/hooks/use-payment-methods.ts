import { useMemo } from "react";
import { useListPaymentMethods } from "@/shared/api/generated/api";
import { useTranslation } from "react-i18next";

export function usePaymentMethods() {
  const { i18n } = useTranslation();
  const query = useListPaymentMethods({
    query: {
      staleTime: 5 * 60 * 1000, // 5 minutes cache
    }
  });

  const methods = useMemo(() => query.data ?? [], [query.data]);
  const activeMethods = useMemo(() => methods.filter(m => m.is_active), [methods]);

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of methods) {
      map[m.name] = m.color;
    }
    return map;
  }, [methods]);

  const getLabel = (name: string, lang?: string) => {
    const method = methods.find(m => m.name === name);
    if (!method) return name;
    const currentLang = lang || i18n.language || "en";
    const targetLang = currentLang.substring(0, 2);
    
    // Fallback logic for unknown JSON
    const translations = method.label_translations as Record<string, string> | null;
    if (translations) {
      if (translations[targetLang]) return translations[targetLang];
      if (translations["en"]) return translations["en"];
    }
    return method.name; // ultimate fallback
  };

  return {
    ...query,
    methods,
    activeMethods,
    colorMap,
    getLabel,
  };
}
