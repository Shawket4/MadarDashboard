import * as React from "react";
import { useTranslation } from "react-i18next";
import { Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  value: string | null | undefined;
  /** Caller performs the upload and resolves the new URL (or throws). */
  onUpload: (file: File) => Promise<string>;
  onRemove?: () => Promise<void> | void;
  hint?: string;
  accept?: string;
  maxBytes?: number;
  square?: boolean;
  disabled?: boolean;
}

/** Uniform drag-drop image upload (menu items, org logos, …). Owns preview + progress. */
export function ImageUploader({
  value,
  onUpload,
  onRemove,
  hint,
  accept = "image/png,image/jpeg,image/webp",
  maxBytes = 5 * 1024 * 1024,
  square = true,
  disabled = false,
}: ImageUploaderProps) {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

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
      await onUpload(file);
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
        {value ? (
          <>
            <img src={value} alt="" className="size-full object-cover" draggable={false} />
            {!disabled ? (
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/0 opacity-0 transition-colors hover:bg-black/40 hover:opacity-100">
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
