import Placeholder from "./Placeholder";

type Props = {
  src?: string;
  alt?: string;
  url?: string;
  className?: string;
  darkMode?: boolean;
};

/**
 * macOS-style browser window mockup.
 *
 * Window chrome: navy bar at top with three traffic-light dots
 * (terracotta-red + two cream) on the PHYSICAL LEFT, regardless of
 * document direction — real macOS doesn't flip its controls in RTL,
 * so we force dir="ltr" on the dot cluster.
 *
 * URL pill is centered. Drop shadow + 1px hairline border for that
 * Mac-window feel. Content area is cream, with object-contain on the
 * screenshot so 16:10 captures fit without cropping.
 *
 * Sizing: control via className width (e.g. `w-[780px]`).
 */
export default function Browser({
  src,
  alt = "Dashboard view",
  url,
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
          "0 25px 50px -12px rgba(10, 37, 64, 0.22), 0 0 0 1px rgba(10, 37, 64, 0.08)",
      }}
    >
      {/* Glare Reflection */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-60" />

      {/* Chrome */}
      <div className={`flex items-center px-4 border-b ${darkMode ? 'border-[#333]' : 'border-[#d1d1d1]'}`} style={{ height: "8.5%", minHeight: "28px" }}>
        {/* Traffic lights — locked LTR, physical left */}
        <div className="flex items-center gap-[6px] shrink-0" dir="ltr">
          <span className="block w-[11px] h-[11px] rounded-full bg-[#ff5f56] border border-[#e0443e]" />
          <span className="block w-[11px] h-[11px] rounded-full bg-[#ffbd2e] border border-[#dea123]" />
          <span className="block w-[11px] h-[11px] rounded-full bg-[#27c93f] border border-[#1aab29]" />
        </div>

        {/* URL pill — centered */}
        <div className="flex-1 flex justify-center px-4">
          {url && (
            <div
              className={`${darkMode ? 'bg-[#333] text-[#aaa]' : 'bg-white text-[#777] shadow-sm'} text-[10px] font-medium px-4 py-[3px] rounded-md tabular tracking-wide w-full max-w-[240px] text-center`}
              dir="ltr"
            >
              {url}
            </div>
          )}
        </div>

        {/* Right spacer for symmetry */}
        <div className="w-[42px] shrink-0" />
      </div>

      {/* Content */}
      <div className="bg-cream w-full" style={{ height: "91.5%" }}>
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-contain" />
        ) : (
          <Placeholder label="Dashboard view" subtitle="1920 × 1200 · 16:10" />
        )}
      </div>
    </div>
  );
}
