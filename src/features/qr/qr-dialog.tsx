/**
 * "QR code" buttons that open a live code: the enlarged code with the output
 * switches under it. The code is fetched when the dialog is asked for, stays
 * up while a switch re-renders it, and a failure says why in a toast (there is
 * no code to show it beside).
 */
import { useEffect, useState } from "react";

import { toast } from "@/components/ui/toast";
import type { QrResponse } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";

import { useLiveQr } from "./live";
import { QrOutputControls } from "./output-controls";
import type { QrRenderParams } from "./output";
import { QrPreviewDialog } from "./qr-preview-dialog";

/** The code came back plain although the switches asked for the logo. */
export function missingLogo(
  live: { output: { unbranded: boolean; centreLogo: boolean }; data?: QrResponse; isPlaceholderData: boolean },
): boolean {
  return (
    live.output.unbranded &&
    live.output.centreLogo &&
    !live.isPlaceholderData &&
    live.data?.centre_logo === false
  );
}

export function useQrDialog({
  id,
  scope,
  fetch,
  title,
}: {
  id: string;
  scope: readonly unknown[];
  fetch: (params: QrRenderParams) => Promise<QrResponse>;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const live = useLiveQr({ id, scope, fetch, enabled: open });
  const failed = open && live.isError && !live.data;

  useEffect(() => {
    if (!failed) return;
    toast.error(getErrorMessage(live.error), { id: `qr-${id}` });
    setOpen(false);
  }, [failed, live.error, id]);

  const dialog = (
    <QrPreviewDialog
      qr={open ? (live.data ?? null) : null}
      open={open && !!live.data}
      onOpenChange={(o) => !o && setOpen(false)}
      title={title}
      busy={live.isFetching}
      shape={live.shape}
      controls={<QrOutputControls noLogo={missingLogo(live)} />}
    />
  );

  return { show: () => setOpen(true), loading: open && !live.data, dialog };
}
