import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge class names with Tailwind-aware conflict resolution (shadcn convention). */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
