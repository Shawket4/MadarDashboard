/**
 * A code that follows the output switches.
 *
 * Each code is a query keyed by what it is AND by the current output, so
 * flipping Unbranded (or the logo, the card, the DPI) re-renders every code
 * already on screen — the preview is live, with the old image held in place
 * until the new one lands (`keepPreviousData`). Nothing is fetched until the
 * person asks for a code (`enabled`): each request mints or looks up a short
 * link on the server, which is not something a page view should do.
 *
 * Generated codes are never refetched in the background (`staleTime:
 * Infinity`): a code does not change unless its inputs do, and those are its key.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { QrResponse } from "@/data/api/generated/models";

import { qrRenderParams, qrShape, useQrOutput, type QrRenderParams } from "./output";

export const LIVE_QR_KEY = "qr-live";

export function useLiveQr({
  id,
  scope,
  fetch,
  enabled,
  override,
}: {
  /** What the code is (`org_links`, `branch_order`, …). */
  id: string;
  /** Everything else that makes it a different code: org, branch, in-mall fields. */
  scope: readonly unknown[];
  fetch: (params: QrRenderParams) => Promise<QrResponse>;
  enabled: boolean;
  /** Fixed render params on top of the output's (the panel's light preview). */
  override?: Partial<QrRenderParams>;
}) {
  const [output] = useQrOutput();
  const params = { ...qrRenderParams(output), ...override };
  const query = useQuery({
    queryKey: [LIVE_QR_KEY, id, ...scope, params],
    queryFn: () => fetch(params),
    enabled,
    staleTime: Infinity,
    gcTime: 10 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
  return { ...query, output, shape: qrShape(output) };
}

/** A file name that says which variant it is, so two downloads never collide. */
export function qrFileName(qr: QrResponse, unbranded: boolean): string {
  const ext = qr.qr_data_url.startsWith("data:image/svg") ? "svg" : "png";
  return `qr-${qr.short_code}${unbranded ? "-unbranded" : ""}.${ext}`;
}

/** True where the browser can hand something to the system share sheet. */
export function canShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

function dataUrlToFile(dataUrl: string, name: string): File | null {
  const m = /^data:([^;,]+)(;base64)?,(.*)$/.exec(dataUrl);
  if (!m) return null;
  const bytes = m[2] ? atob(m[3]) : decodeURIComponent(m[3]);
  const buf = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
  return new File([buf], name, { type: m[1] });
}

/**
 * Share the code: the image itself where the platform takes files (a phone, a
 * Mac), else its short link. Resolves false only when sharing failed; a person
 * closing the share sheet is not a failure.
 */
export async function shareCode(qr: QrResponse, title: string, unbranded: boolean): Promise<boolean> {
  if (!canShare()) return false;
  const file = dataUrlToFile(qr.qr_data_url, qrFileName(qr, unbranded));
  try {
    if (file && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title, text: qr.short_url });
    } else {
      await navigator.share({ title, url: qr.short_url });
    }
    return true;
  } catch (e) {
    return e instanceof DOMException && e.name === "AbortError";
  }
}
