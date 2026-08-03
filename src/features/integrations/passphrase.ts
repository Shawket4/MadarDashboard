/**
 * Passphrase generation for the encrypted credential handoff.
 *
 * A human reads this aloud down a phone line to the partner, so the alphabet is
 * uppercase-only and drops every glyph pair that sounds or looks alike:
 * `0`/`O`, `1`/`I`/`L`. That leaves 31 symbols. Twenty of them ≈ 99 bits, which
 * is far beyond any offline attack on the archive while still being five short
 * chunks to dictate.
 */

export const PASSPHRASE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

const GROUPS = 5;
const GROUP_LENGTH = 4;
const LENGTH = GROUPS * GROUP_LENGTH;

/**
 * Largest multiple of the alphabet size that fits in a byte (31 × 8 = 248).
 * Bytes at or above this are REJECTED rather than folded with `%`, which is
 * what keeps the distribution uniform — plain `byte % 31` would make the first
 * eight symbols measurably more likely.
 */
const REJECT_AT = 256 - (256 % PASSPHRASE_ALPHABET.length);

/** Thrown rather than ever silently falling back to `Math.random()`. */
export class InsecureRandomError extends Error {
  constructor() {
    super("Secure random number generation is unavailable in this browser.");
    this.name = "InsecureRandomError";
  }
}

/**
 * Fills the buffer with random bytes. Injectable so tests can be deterministic.
 *
 * Pinned to `Uint8Array<ArrayBuffer>` rather than bare `Uint8Array`: the latter
 * widens to `ArrayBufferLike`, which includes `SharedArrayBuffer` and so is not
 * assignable to `getRandomValues`.
 */
export type RandomBytes = (out: Uint8Array<ArrayBuffer>) => void;

export function hasSecureRandom(): boolean {
  return typeof globalThis.crypto?.getRandomValues === "function";
}

const secureRandomBytes: RandomBytes = (out) => {
  if (!hasSecureRandom()) throw new InsecureRandomError();
  globalThis.crypto.getRandomValues(out);
};

/**
 * A 20-symbol passphrase formatted as `XXXX-XXXX-XXXX-XXXX-XXXX`.
 *
 * @throws {InsecureRandomError} when the platform has no CSPRNG.
 */
export function generatePassphrase(randomBytes: RandomBytes = secureRandomBytes): string {
  const symbols: string[] = [];
  const buf = new Uint8Array(32);

  while (symbols.length < LENGTH) {
    randomBytes(buf);
    for (const byte of buf) {
      if (byte >= REJECT_AT) continue;
      symbols.push(PASSPHRASE_ALPHABET[byte % PASSPHRASE_ALPHABET.length]);
      if (symbols.length === LENGTH) break;
    }
  }

  const groups: string[] = [];
  for (let g = 0; g < GROUPS; g += 1) {
    groups.push(symbols.slice(g * GROUP_LENGTH, (g + 1) * GROUP_LENGTH).join(""));
  }
  return groups.join("-");
}
