/**
 * Whether the app shell sends someone into the POS first-run wizard
 * (/onboarding). Only an owner whose org has Madar POS switched on, whose
 * checklist the server says is unfinished, and who hasn't skipped it this
 * session. A Dawam-only org's first run is Staff ▸ Set-up instead (SA-4), so
 * it is never sent there; and nothing is decided before the modules are known.
 */
export function sendsToOnboarding(s: {
  role: string | undefined;
  skipped: boolean;
  modules: readonly string[];
  modulesKnown: boolean;
  completed: boolean | undefined;
}): boolean {
  return s.role === "org_admin" && !s.skipped && s.modulesKnown && s.modules.includes("pos") && s.completed === false;
}
