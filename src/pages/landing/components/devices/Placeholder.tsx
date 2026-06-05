type Props = {
  label?: string;
  subtitle?: string;
};

/**
 * Minimal screen placeholder. Centered label + optional subtitle on
 * the cream background — NO dashed inset border. When the screen is
 * empty, the device frame should still read as a clean blank screen.
 */
export default function Placeholder({
  label = "Screenshot",
  subtitle,
}: Props) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
      <div className="text-navy/40 text-[10.5px] font-semibold uppercase tracking-[0.22em]">
        {label}
      </div>
      {subtitle && (
        <div className="text-navy/25 text-[9px] tracking-wide tabular">
          {subtitle}
        </div>
      )}
    </div>
  );
}
