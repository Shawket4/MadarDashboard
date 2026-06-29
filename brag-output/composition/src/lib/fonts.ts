import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";

// Inter = UI sans (tabular numerals used inline). Fraunces = display serif (wordmark, tagline).
const inter = loadInter("normal", { weights: ["400", "500", "600", "700"] });
const fraunces = loadFraunces("normal", { weights: ["400", "600", "700", "900"] });

export const INTER = inter.fontFamily;
export const FRAUNCES = fraunces.fontFamily;
export const MONO = `${INTER}, ui-monospace, monospace`;
