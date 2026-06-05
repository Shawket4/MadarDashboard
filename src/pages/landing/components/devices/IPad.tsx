import Placeholder from "./Placeholder";

type Props = {
  src?: string;
  alt?: string;
  className?: string;
};

/**
 * Realistic iPad landscape mockup — modeled on an iPad Pro.
 * Features a dark bezel, camera notch, inner rounded screen,
 * and a subtle glassy glare.
 */
export default function IPad({
  src,
  alt = "iPad screen",
  className = "",
}: Props) {
  return (
    <div
      className={`relative bg-[#1A1A1C] border border-[#3A3A3D] flex items-center justify-center shadow-2xl ${className}`}
      style={{
        aspectRatio: "1.41", // iPad Pro 11-inch landscape approx
        borderRadius: "24px",
        padding: "16px",
        boxShadow: "0 25px 50px -12px rgba(10, 37, 64, 0.45), inset 0 0 0 1px rgba(255,255,255,0.05)",
      }}
    >
      {/* Glare Reflection overlay on the entire device */}
      <div className="pointer-events-none absolute inset-0 z-20 rounded-[24px] bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-40" />

      {/* Camera notch / dot (Top edge in landscape) */}
      <div
        className="absolute top-1/2 -translate-y-1/2 right-[6px] w-[8px] h-[8px] bg-black rounded-full border border-white/10 z-10"
        style={{ left: "auto" }} // Physical right edge for camera in older models, or physical top edge. Let's do top edge.
      />
      {/* Real camera dot top edge centered */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-[6px] w-[6px] h-[6px] bg-[#0A0A0C] rounded-full z-10"
      />

      {/* Inner Screen */}
      <div
        className="relative w-full h-full bg-black overflow-hidden z-0"
        style={{ borderRadius: "10px" }}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <Placeholder label="iPad screen" subtitle="2388 × 1668" />
        )}
      </div>

      {/* Home Indicator (Bottom edge) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-[14px] w-[100px] h-[3px] bg-white/20 rounded-full z-10"
      />
    </div>
  );
}
