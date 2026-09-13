/** /shifts?report=x → /tills?report=x (search params carried over). */
export function shiftsRedirect(search: Record<string, unknown>) {
  return { to: "/tills" as const, search, replace: true };
}
