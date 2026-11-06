/**
 * How every code on the Links & QR codes page comes out: the shop's choice of
 * card or plain code, its resolution, and whether it carries any branding.
 *
 * Remembered per shop on this device (`madar.qr.output.<orgId>`), the way the
 * "Items sold" exclusions are: it is how this person likes their codes printed,
 * not a rule the business sets for every manager on every device, so it needs
 * no server field. A device that cannot store it (private browsing, blocked
 * storage) keeps it for the session, through `safeStorage`.
 *
 * The four settings, and what each one sends:
 * - `unbranded` — the code and nothing else: a square QR, black on a white
 *   quiet zone. No card, no frame, no caption or purpose line, no "Powered by",
 *   no Madar mark and no shop name. It overrides `card`.
 * - `centreLogo` — only with `unbranded`: the shop's own logo in the middle of
 *   the code. Off, a completely plain QR (the server drops its error
 *   correction a level, since nothing covers the code).
 * - `card` — branded mode only: the A6 card, or the small plain receipt code.
 * - `dpi` — the raster's resolution, for the card and the unbranded code.
 */
import { useCallback } from "react";
import { create } from "zustand";

import { useOrgId } from "@/hooks/use-org-id";
import { safeStorage } from "@/lib/safe-storage";

export const QR_DPIS = [150, 300, 600] as const;
export type QrDpi = (typeof QR_DPIS)[number];

export interface QrOutput {
  unbranded: boolean;
  centreLogo: boolean;
  card: boolean;
  dpi: QrDpi;
}

/** What a shop that never touched the switches gets: today's branded card. */
export const DEFAULT_QR_OUTPUT: QrOutput = {
  unbranded: false,
  centreLogo: true,
  card: true,
  dpi: 600,
};

export const qrOutputKey = (orgId: string) => `madar.qr.output.${orgId}`;

/** A stored value, read defensively: anything malformed falls back field by field. */
export function readQrOutput(orgId: string | null): QrOutput {
  if (!orgId) return DEFAULT_QR_OUTPUT;
  let raw: unknown;
  try {
    raw = JSON.parse(safeStorage.getItem(qrOutputKey(orgId)) ?? "null");
  } catch {
    return DEFAULT_QR_OUTPUT;
  }
  if (!raw || typeof raw !== "object") return DEFAULT_QR_OUTPUT;
  const r = raw as Record<string, unknown>;
  const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
  return {
    unbranded: bool(r.unbranded, DEFAULT_QR_OUTPUT.unbranded),
    centreLogo: bool(r.centreLogo, DEFAULT_QR_OUTPUT.centreLogo),
    card: bool(r.card, DEFAULT_QR_OUTPUT.card),
    dpi: QR_DPIS.includes(r.dpi as QrDpi) ? (r.dpi as QrDpi) : DEFAULT_QR_OUTPUT.dpi,
  };
}

/**
 * One value per shop, shared by every control and every code on the page, so
 * the switch above the codes and the one in a code's preview are the same
 * switch. Hydrated from storage the first time a shop is read.
 */
const useQrOutputStore = create<{ byOrg: Record<string, QrOutput> }>(() => ({ byOrg: {} }));

export function useQrOutput(): [QrOutput, (patch: Partial<QrOutput>) => void] {
  const orgId = useOrgId();
  const held = useQrOutputStore((s) => (orgId ? s.byOrg[orgId] : undefined));
  const output = held ?? readQrOutput(orgId);

  const update = useCallback(
    (patch: Partial<QrOutput>) => {
      if (!orgId) return;
      const current = useQrOutputStore.getState().byOrg[orgId] ?? readQrOutput(orgId);
      const next = { ...current, ...patch };
      safeStorage.setItem(qrOutputKey(orgId), JSON.stringify(next));
      useQrOutputStore.setState((s) => ({ byOrg: { ...s.byOrg, [orgId]: next } }));
    },
    [orgId],
  );

  return [output, update];
}

/** Test seam: forget every shop held in memory (storage is the test's to clear). */
export function resetQrOutputMemory(): void {
  useQrOutputStore.setState({ byOrg: {} });
}

/** The render query every QR endpoint takes (`QrRenderQuery` on the server). */
export interface QrRenderParams {
  card?: boolean;
  dpi?: number;
  unbranded?: boolean;
  centre_logo?: boolean;
}

/**
 * The query for an output. Unbranded sends only what the plain code reads;
 * branded mode sends exactly what this page sent before the switch existed,
 * so a shop that never turns it on prints the same card it always has.
 */
export function qrRenderParams(o: QrOutput): QrRenderParams {
  if (o.unbranded) return { unbranded: true, centre_logo: o.centreLogo, dpi: o.dpi };
  return { card: o.card, dpi: o.dpi };
}

/** What a code's image is, for printing it at its real size. */
export type QrShape = "plain" | "card" | "receipt";

export function qrShape(o: QrOutput): QrShape {
  if (o.unbranded) return "plain";
  return o.card ? "card" : "receipt";
}
