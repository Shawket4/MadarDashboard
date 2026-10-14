/**
 * How a shop reaches Madar. One place to change it; the marketing site keeps
 * the same number in `site/src/lib/site.ts` (a separate package, so a copy).
 */
export const MADAR_PHONE_E164 = "+201211116899";

/**
 * WhatsApp click-to-chat to Madar, prefilled. `text` is the first message in
 * the reader's language: an owner asking to move a shop to the paid plan.
 */
export function madarWhatsAppHref(text: string): string {
  return `https://wa.me/${MADAR_PHONE_E164.replace("+", "")}?text=${encodeURIComponent(text)}`;
}
