/**
 * Content-addressed images (TILLS_CONTRACT §11.10). An entity's image arrives
 * as an asset group with thumb/tile/full variants; the browser picks the
 * smallest that fits via srcset/sizes. Hand-typed until orval regenerates.
 */
import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Skeleton } from "@/components/ui/skeleton";
import { customInstance } from "@/data/api/custom-instance";
import { cn } from "@/lib/utils";

export interface AssetVariant {
  url: string;
  width: number;
  height: number;
  bytes: number;
  content_hash: string;
}

export interface AssetGroupReady {
  group_id: string;
  label?: string | null;
  width?: number | null;
  height?: number | null;
  has_alpha?: boolean;
  variants: {
    thumb?: AssetVariant | null;
    tile?: AssetVariant | null;
    full?: AssetVariant | null;
    original?: AssetVariant | null;
  };
  status?: undefined;
}

export interface AssetGroupProcessing {
  group_id: null;
  status: "processing";
  job_id: string;
}

export type AssetGroupRef = AssetGroupReady | AssetGroupProcessing;

export interface AssetJob {
  id: string;
  status: "queued" | "running" | "done" | "failed";
  result: { group_id?: string; variants?: AssetGroupReady["variants"] } | Record<string, unknown> | null;
  error: string | null;
}

export const POLL_MS = 3_000;
export const POLL_LIMIT_MS = 60_000;

const isProcessing = (a: AssetGroupRef | null | undefined): a is AssetGroupProcessing =>
  !!a && (a as AssetGroupProcessing).status === "processing";

/** Poll an ingest job every 3 s for at most 60 s. */
export function useAssetJob(jobId: string | null | undefined) {
  const started = useRef<number>(0);
  useEffect(() => {
    started.current = Date.now();
  }, [jobId]);
  return useQuery({
    queryKey: [`/assets/jobs/${jobId}`],
    queryFn: () => customInstance<AssetJob>({ url: `/assets/jobs/${jobId}`, method: "GET" }),
    enabled: !!jobId,
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      if (s === "done" || s === "failed") return false;
      return Date.now() - started.current < POLL_LIMIT_MS ? POLL_MS : false;
    },
  });
}

/** Pick a variant for intrinsic width/height (avoids layout shift). */
export function srcSetFor(asset: AssetGroupReady): string {
  const v = asset.variants;
  return [
    v.thumb ? `${v.thumb.url} 128w` : null,
    v.tile ? `${v.tile.url} 512w` : null,
    v.full ? `${v.full.url} 1600w` : null,
  ]
    .filter(Boolean)
    .join(", ");
}

interface Props {
  asset?: AssetGroupRef | null;
  legacyUrl?: string | null;
  sizes?: string;
  alt?: string;
  fit?: "cover" | "contain";
  className?: string;
  draggable?: boolean;
  /** Called once a processing job finishes. Defaults to invalidating all queries' data. */
  onReady?: () => void;
}

export function AssetImage({
  asset,
  legacyUrl,
  sizes = "(max-width: 640px) 128px, 512px",
  alt = "",
  fit = "cover",
  className,
  draggable,
  onReady,
}: Props) {
  const queryClient = useQueryClient();
  const jobId = isProcessing(asset) ? asset.job_id : null;
  const job = useAssetJob(jobId);
  const done = job.data?.status === "done" || job.data?.status === "failed";

  useEffect(() => {
    if (!jobId || !done) return;
    if (onReady) onReady();
    else void queryClient.invalidateQueries();
  }, [jobId, done, onReady, queryClient]);

  const fitClass = fit === "contain" ? "object-contain" : "object-cover";

  if (isProcessing(asset)) {
    const result = job.data?.result as AssetGroupReady | null | undefined;
    if (job.data?.status === "done" && result?.variants) {
      return <AssetImage asset={{ ...result, group_id: result.group_id ?? jobId! }} sizes={sizes} alt={alt} fit={fit} className={className} draggable={draggable} />;
    }
    return <Skeleton data-testid="asset-processing" className={cn("size-full", className)} />;
  }

  if (asset && asset.variants) {
    const chosen = asset.variants.tile ?? asset.variants.thumb ?? asset.variants.full;
    if (chosen) {
      return (
        <img
          src={chosen.url}
          srcSet={srcSetFor(asset)}
          sizes={sizes}
          width={chosen.width}
          height={chosen.height}
          loading="lazy"
          decoding="async"
          alt={alt}
          draggable={draggable}
          className={cn(fitClass, className)}
        />
      );
    }
  }

  if (!legacyUrl) return null;
  return (
    <img src={legacyUrl} loading="lazy" decoding="async" alt={alt} draggable={draggable} className={cn(fitClass, className)} />
  );
}

/** Loose accessor for response objects that may already carry an asset ref. */
export function assetOf(entity: unknown, field: "image" | "logo" | "brand_card_image" = "image"): AssetGroupRef | null {
  if (!entity || typeof entity !== "object") return null;
  const v = (entity as Record<string, unknown>)[field];
  return v && typeof v === "object" ? (v as AssetGroupRef) : null;
}
