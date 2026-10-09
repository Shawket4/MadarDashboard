/**
 * The showcase's colours: the brand kit's palette as sRGB hex, taken from the
 * tokens in `src/styles/globals.css` (each token there carries its hex in a
 * comment). Hex rather than the oklch tokens because WebGL materials and the
 * 2D canvases that paint the screens need plain sRGB everywhere, including
 * older WebKit in the desktop app.
 */
export const C = {
  /** The chrome's ink (the sidebar / brand panel). */
  ink: "#0D1A1E",
  inkDeep: "#0A1417",
  inkCard: "#16252A",
  inkRaised: "#213238",
  inkLine: "#2C4048",
  /** Paper: the work surface and the printed things. */
  paper: "#F1F3F3",
  paperBright: "#F8FAFA",
  white: "#FFFFFF",
  sunk: "#E4E9EA",
  hair: "#DDE4E6",
  slate: "#9DB0B6",
  slateDeep: "#4F5F66",
  text: "#101820",
  /** Madar teal: the light theme's and the dark theme's. */
  teal: "#0F7A8A",
  tealBright: "#2AA7B8",
  /** Status, dark-theme values (they sit on ink in the kitchen screen). */
  amber: "#F0A23F",
  green: "#3BCB7E",
  /** Device finishes. */
  graphite: "#1C2428",
  glass: "#050708",
} as const;
