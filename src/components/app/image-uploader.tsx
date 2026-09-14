import * as React from "react";
import { useTranslation } from "react-i18next";
import { Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AssetImage, useAssetJob, type AssetGroupRef, type AssetGroupReady } from "@/components/app/asset-image";

/** Upload routes answer with the job that converts the file (§11.3). */
export interface UploadOutcome {
  url?: string | null;
  image?: AssetGroupRef | null;
  asset_job_id?: string | null;
  status?: string | null;
}

interface ImageUploaderProps {
  value: string | null | undefined;
  /** Caller performs the upload and resolves the new URL (or throws). */
  onUpload: (file: File) => Promise<string | UploadOutcome>;
  /** Asset group for the current value, when the API returns one. */
  asset?: AssetGroupRef | null;
  onRemove?: () => Promise<void> | void;
  hint?: string;
  accept?: string;
  maxBytes?: number;
  square?: boolean;
  disabled?: boolean;
  /** Called once a "processing" upload's asset job finishes (done or failed). */
  onProcessed?: () => void;
}

/**
 * Uniform drag-drop image upload (menu items, org logos, …).
 *
 * It shows the URL its own upload returned, not only the one the caller passes
 * back down. The prop is the truth once it arrives, but it arrives on the
 * caller's schedule — a cache invalidation that misses the query this dialog is
 * reading, or simply a refetch in flight — and in the meantime the field a
 * moment ago showed a picture and now shows an empty dashed box. That read as
 * the upload having failed; the image would then appear the moment the editor
 * was closed, which is the one place it was not wanted.
 */
export function ImageUploader({
  value,
  onUpload,
  onRemove,
  hint,
  accept = "image/png,image/jpeg,image/webp",
  maxBytes = 5 * 1024 * 1024,
  square = true,
  disabled = false,
  asset,
  onProcessed,
}: ImageUploaderProps) {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  /// What we just uploaded, held only until the caller's own value catches up.
  const [justUploaded, setJustUploaded] = React.useState<string | null>(null);
  React.useEffect(() => setJustUploaded(null), [value]);
  const [jobId, setJobId] = React.useState<string | null>(null);
  const job = useAssetJob(jobId);
  React.useEffect(() => {
    if (!jobId || !job.data) return;
    if (job.data.status === "done") {
      const result = job.data.result as AssetGroupReady | null;
      const tile = result?.variants?.tile ?? result?.variants?.full;
      if (tile) setJustUploaded(tile.url);
      setJobId(null);
      onProcessed?.();
    } else if (job.data.status === "failed") {
      setError(job.data.error ?? t("uploader.processingFailed", "The image could not be processed"));
      setJobId(null);
      onProcessed?.();
    }
  }, [jobId, job.data, t, onProcessed]);
  const processing = !!jobId;
  const shown = justUploaded ?? value;
  // A row on the asset pipeline can have `asset` set with `value` (its
  // legacy `image_url`) null — that is still a picture to show, not an
  // empty box. `AssetImage` itself falls back to `legacyUrl` when there is
  // no asset, so gate visibility on either.
  const hasImage = !!shown || !!(!justUploaded && asset);

  const handleFile = async (file: File | null | undefined) => {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError(t("uploader.notAnImage", "That's not an image file"));
      return;
    }
    if (file.size > maxBytes) {
      setError(t("uploader.tooLarge", { mb: Math.round(maxBytes / (1024 * 1024)), defaultValue: "Image is too large" }));
      return;
    }
    setUploading(true);
    try {
      const out = await onUpload(file);
      if (typeof out === "string") {
        if (out) setJustUploaded(out);
      } else if (out) {
        if (out.status === "processing" && out.asset_job_id) setJobId(out.asset_job_id);
        else if (out.url) setJustUploaded(out.url);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    setRemoving(true);
    setError(null);
    try {
      await onRemove();
      setJustUploaded(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (disabled || uploading) return;
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "relative max-w-[200px] overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          square ? "aspect-square" : "aspect-video",
          isDragging ? "border-primary bg-primary/5" : "border-input",
          disabled && "opacity-50",
        )}
      >
        {processing ? (
          <div role="status" className="flex size-full flex-col items-center justify-center gap-2 bg-muted/40 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-xs font-medium">{t("uploader.processing", "Processing…")}</span>
          </div>
        ) : hasImage ? (
          <>
            <AssetImage
              asset={justUploaded ? null : asset}
              legacyUrl={shown}
              sizes="512px"
              className="size-full"
              draggable={false}
            />
            {!disabled ? (
              // Visible by default, and hidden until hover ONLY where hovering
              // is a thing the device does. On a phone there is no hover, so
              // replace and remove were invisible and reachable — if at all —
              // by a tap that emulates one. `focus-within` covers a keyboard,
              // which had the same problem for the same reason.
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center gap-1 bg-foreground/40 opacity-100 transition-colors",
                  "focus-within:opacity-100",
                  "[@media(hover:hover)]:bg-foreground/0 [@media(hover:hover)]:opacity-0",
                  "[@media(hover:hover)]:hover:bg-foreground/40 [@media(hover:hover)]:hover:opacity-100",
                )}
              >
                <Button
                  type="button"
                  size="icon-sm"
                  variant="secondary"
                  onClick={() => inputRef.current?.click()}
                  loading={uploading}
                  aria-label={t("uploader.replace", "Replace image")}
                >
                  <Upload />
                </Button>
                {onRemove ? (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="destructive"
                    onClick={handleRemove}
                    loading={removing}
                    aria-label={t("uploader.remove", "Remove image")}
                  >
                    <X />
                  </Button>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground disabled:cursor-not-allowed"
          >
            {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImageIcon className="size-5" />}
            <span className="text-xs font-medium">
              {uploading ? t("uploader.uploading", "Uploading…") : t("uploader.choose", "Upload image")}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled || uploading}
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
        className="hidden"
      />

      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
