/** A warehouse only holds stock: pages about selling never offer one as a branch. */
export const isSelling = (b: { kind?: string }): boolean => b.kind !== "warehouse";
