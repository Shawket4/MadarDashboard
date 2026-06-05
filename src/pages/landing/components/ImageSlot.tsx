type Props = {
  src?: string;
  alt?: string;
  label?: string;
  subtitle?: string;
  className?: string;
  aspectRatio?: string;
};

/**
 * Generic image slot for non-device imagery — case study photo,
 * lifestyle shots, anything that isn't framed in an iPad or browser.
 * Falls back to a labeled dashed placeholder if no src is provided.
 */
export default function ImageSlot({
  src,
  alt = "",
  label = "Image",
  subtitle,
  className = "",
  aspectRatio = "4/3",
}: Props) {
  return (
    <div
      className={`relative bg-cream overflow-hidden rounded-md ${className}`}
      style={{ aspectRatio }}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <>
          <div className="absolute inset-3 border border-dashed border-navy/15 rounded pointer-events-none" />
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
            <div className="text-navy/40 text-[11px] font-semibold uppercase tracking-[0.22em]">
              {label}
            </div>
            {subtitle && (
              <div className="text-navy/25 text-[9.5px] tracking-wide tabular">
                {subtitle}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
