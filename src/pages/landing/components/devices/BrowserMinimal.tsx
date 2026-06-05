import Placeholder from "./Placeholder";

type Props = {
  src?: string;
  alt?: string;
  title?: string;
  className?: string;
  darkMode?: boolean;
};

/**
 * Slim browser mockup for detail views. No URL bar — just a tight
 * title strip at the top to anchor the screenshot. Pairs well next
 * to the full `<Browser>` frame as a supporting view.
 *
 * Sizing: control via className width.
 */
export default function BrowserMinimal({
  src,
  alt = "Detail view",
  title,
  className = "",
  darkMode = false,
}: Props) {
  return (
    <div
      className={`relative overflow-hidden ${darkMode ? 'bg-[#1e1e1e]' : 'bg-[#e5e5e5]'} ${className}`}
      style={{
        aspectRatio: "16 / 11",
        borderRadius: "10px",
        boxShadow:
          "0 15px 30px -10px rgba(10, 37, 64, 0.18), 0 0 0 1px rgba(10, 37, 64, 0.08)",
      }}
    >
      {/* Glare Reflection */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-60" />

      {/* Chrome */}
      <div className={`flex items-center px-4 border-b ${darkMode ? 'border-[#333]' : 'border-[#d1d1d1]'}`} style={{ height: "8.5%", minHeight: "22px" }}>
        {/* Traffic lights — locked LTR, physical left */}
        <div className="flex items-center gap-[5px] shrink-0" dir="ltr">
          <span className="block w-[9px] h-[9px] rounded-full bg-[#ff5f56] border border-[#e0443e]" />
          <span className="block w-[9px] h-[9px] rounded-full bg-[#ffbd2e] border border-[#dea123]" />
          <span className="block w-[9px] h-[9px] rounded-full bg-[#27c93f] border border-[#1aab29]" />
        </div>

        {/* Title — centered */}
        <div className="flex-1 flex justify-center px-4">
          {title && (
            <div className={`${darkMode ? 'text-[#aaa]' : 'text-[#777]'} text-[9px] tracking-[0.22em] uppercase font-semibold`}>
              {title}
            </div>
          )}
        </div>

        {/* Right spacer for symmetry */}
        <div className="w-[37px] shrink-0" />
      </div>

      {/* Content */}
      <div className="bg-cream w-full" style={{ height: "91.5%" }}>
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-contain" />
        ) : (
          <Placeholder label="Detail view" subtitle="1920 × 1200" />
        )}
      </div>
    </div>
  );
}
