/** Lowercase + strip diacritics (Latin & Arabic tashkeel) for accent-insensitive search. */
export const normalize = (s: string): string =>
  s
    .normalize("NFKD")
    .replace(/[̀-ًͯ-ْ]/g, "")
    .toLowerCase()
    .trim();
