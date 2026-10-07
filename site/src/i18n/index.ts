import { en } from "./en";
import { ar } from "./ar";
import type { Lang } from "@/lib/site";

export const copy = { en, ar } as const;
export const t = (lang: Lang) => copy[lang];
export const dirOf = (lang: Lang) => (lang === "ar" ? "rtl" : "ltr");
export type { Copy } from "./en";
