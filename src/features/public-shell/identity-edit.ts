/**
 * What a returning, verified guest changed about who they are — the client's
 * half of §4.4 of the customers design. It only decides which question to put
 * on screen; the server classifies the edit again and is the one that acts.
 *
 *   branch, channel, address, notes …  → "none"   no prompt
 *   name only                          → "name"   inline: just this order / update my name
 *   phone (with or without the name)   → "phone"  blocking: just this order / my new number
 */
import { canonicalPhone } from "@/lib/phone";

export type IdentityEditKind = "none" | "name" | "phone";

/** "once" = the order's snapshot only; "replace" = change who the customer is. */
export type IdentityChange = "once" | "replace";

export interface IdentityFields {
  name?: string | null;
  phone?: string | null;
}

export interface IdentityEdit {
  kind: IdentityEditKind;
  nameChanged: boolean;
  phoneChanged: boolean;
}

/** Names are compared as people read them: case, spacing and Unicode form aside. */
const nameKey = (name: string | null | undefined): string =>
  (name ?? "").normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase();

/**
 * Compare what is known about the customer with what was typed. A blank name,
 * or a phone that is not a phone, is the form's problem and not an edit; the
 * same number written another way (`0100…` / `+20100…`) is not a change. With
 * nothing known there is nobody to replace, so nothing is asked.
 */
export function classifyIdentityEdit(known: IdentityFields | null | undefined, typed: IdentityFields): IdentityEdit {
  const knownPhone = canonicalPhone(known?.phone);
  const typedPhone = canonicalPhone(typed.phone);
  const phoneChanged = knownPhone !== null && typedPhone !== null && knownPhone !== typedPhone;

  const knownName = nameKey(known?.name);
  const typedName = nameKey(typed.name);
  const nameChanged = knownName !== "" && typedName !== "" && knownName !== typedName;

  return { kind: phoneChanged ? "phone" : nameChanged ? "name" : "none", nameChanged, phoneChanged };
}

/** A name change defaults to the order alone; a phone change has no default. */
export const defaultIdentityChange = (kind: IdentityEditKind): IdentityChange | null =>
  kind === "name" ? "once" : null;
