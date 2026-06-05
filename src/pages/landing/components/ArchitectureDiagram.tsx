import { useTranslation } from "react-i18next";

/**
 * Four-layer architecture diagram. Teller, Core, and Dashboard sit in a
 * row with the Core as the hub; Integrations hangs below. All boxes
 * use brand-token colors and Inter via inherited body font.
 */
export default function ArchitectureDiagram() {
  const { t } = useTranslation();

  const box = (
    x: number,
    y: number,
    w: number,
    h: number,
    title: string,
    stack: string,
    accent = false,
  ) => (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        width={w}
        height={h}
        rx={8}
        fill={accent ? "#0A2540" : "#FAF7F2"}
        stroke="#0A2540"
        strokeOpacity={accent ? 1 : 0.18}
        strokeWidth={1.5}
      />
      <text
        x={w / 2}
        y={28}
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="10"
        fontWeight="700"
        letterSpacing="2.4"
        fill={accent ? "#FAF7F2" : "#0A2540"}
        opacity={accent ? 0.7 : 0.5}
      >
        {title.toUpperCase()}
      </text>
      <text
        x={w / 2}
        y={h / 2 + 10}
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="14"
        fontWeight="600"
        fill={accent ? "#FAF7F2" : "#0A2540"}
      >
        {stack}
      </text>
    </g>
  );

  return (
    <svg
      viewBox="0 0 900 360"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      aria-label={t("product.diagramAlt")}
    >
      {/* Connecting lines */}
      <g stroke="#0A2540" strokeOpacity="0.25" strokeWidth="1.5" fill="none">
        <line x1="200" y1="100" x2="340" y2="100" />
        <line x1="560" y1="100" x2="700" y2="100" />
        <line x1="450" y1="160" x2="450" y2="240" />
      </g>

      {/* Terracotta dot endpoints */}
      <g fill="#C25B3F">
        <circle cx="270" cy="100" r="2.5" />
        <circle cx="630" cy="100" r="2.5" />
        <circle cx="450" cy="210" r="2.5" />
      </g>

      {/* Top row: Teller — Core — Dashboard */}
      {box(40, 40, 160, 120, t("product.layers.teller.label"), t("product.layers.teller.stack"))}
      {box(340, 40, 220, 120, t("product.layers.core.label"), t("product.layers.core.stack"), true)}
      {box(700, 40, 160, 120, t("product.layers.dashboard.label"), t("product.layers.dashboard.stack"))}

      {/* Bottom row: Integrations */}
      {box(340, 240, 220, 100, t("product.layers.integrations.label"), t("product.layers.integrations.stack"))}
    </svg>
  );
}
