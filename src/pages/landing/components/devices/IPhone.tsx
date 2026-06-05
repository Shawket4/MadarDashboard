import Placeholder from "./Placeholder";

type Props = {
  src?: string;
  alt?: string;
  className?: string;
};

/**
 * iPhone mockup — modeled on a modern iPhone Pro.
 * Includes a dynamic island pill at the top, a home indicator at the bottom,
 * and a subtle glare reflection.
 */
export default function IPhone({
  src,
  alt = "iPhone screen",
  className = "",
}: Props) {
  return (
    <div
      className={`relative bg-navy ${className}`}
      style={{
        aspectRatio: "19.5 / 42", // ~ 1:2.16
        borderRadius: "14%",
        padding: "3.5%",
        boxShadow:
          "0 25px 50px -12px rgba(10, 37, 64, 0.20), 0 0 0 1px rgba(10, 37, 64, 0.08)",
      }}
    >
      {/* Glare Reflection */}
      <div className="pointer-events-none absolute inset-0 z-20 rounded-[14%] bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-60" />

      {/* Dynamic Island */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bg-navy z-10 rounded-full"
        style={{
          top: "5%",
          width: "30%",
          height: "2.5%",
        }}
      />

      {/* Screen */}
      <div
        className="relative w-full h-full bg-cream overflow-hidden"
        style={{ borderRadius: "10%" }}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <Placeholder label="iPhone screen" subtitle="1170 × 2532 · 19.5:9" />
        )}
      </div>

      {/* Home indicator */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bg-cream/35 rounded-full z-10"
        style={{
          bottom: "1.5%",
          width: "35%",
          height: "0.5%",
        }}
      />
    </div>
  );
}
