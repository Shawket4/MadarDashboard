import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Class-name helper used by the kit components (shadcn convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
