/**
 * What the teller page keeps between visits, and the session in hand.
 *
 * - The SET-UP (which shop and branch this browser stamps for) is kept in
 *   localStorage: the owner signs in once on the device and picks the branch;
 *   every teller after that signs in with a PIN against it. A PIN sign-in
 *   needs only the branch, never a registered device (REWARDS_DESIGN.md §6).
 * - A per-browser device id rides every PIN sign-in, so the wrong-PIN delay
 *   counts against this tablet as well as the branch.
 * - The SESSION (the bearer token) lives in sessionStorage: a reload keeps it,
 *   closing the tab ends it. The server bounds it anyway (a PIN session is 12 h).
 *
 * Everything fails soft: storage may be blocked (private mode), and the page
 * then works for the session in memory.
 */
import { safeStorage } from "@/lib/safe-storage";
import { apiContext } from "@/data/api/client";

const SETUP_KEY = "rewardsTeller.setup";
const DEVICE_KEY = "rewardsTeller.device";
const SESSION_KEY = "rewardsTeller.session";

export interface Setup {
  orgId: string;
  branchId: string;
  branchName: string;
}

export interface Session {
  token: string;
  name: string;
}

function read<T>(store: Storage | undefined, key: string): T | null {
  try {
    const raw = store?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(store: Storage | undefined, key: string, value: unknown): void {
  try {
    if (value === null) store?.removeItem(key);
    else store?.setItem(key, JSON.stringify(value));
  } catch {
    /* storage is a convenience */
  }
}

const session = (): Storage | undefined => {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
};

export const loadSetup = (): Setup | null => read<Setup>(safeStorage, SETUP_KEY);
export const saveSetup = (s: Setup | null): void => write(safeStorage, SETUP_KEY, s);

export function deviceId(): string {
  const known = read<string>(safeStorage, DEVICE_KEY);
  if (known) return known;
  const id = crypto.randomUUID();
  write(safeStorage, DEVICE_KEY, id);
  return id;
}

export function loadSession(): Session | null {
  const s = read<Session>(session(), SESSION_KEY);
  apiContext.setToken(s?.token ?? null);
  return s;
}

export function saveSession(s: Session | null): void {
  apiContext.setToken(s?.token ?? null);
  write(session(), SESSION_KEY, s);
}
