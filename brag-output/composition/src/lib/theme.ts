// Madar brand tokens (hex derived from src/styles/globals.css header).
export const C = {
  tealDeep: "#0D6273", // --primary
  teal: "#2E94A6", // --brand
  tealSoft: "#5FB2C0",
  ink: "#14181E", // --foreground
  paper: "#EFF3F4", // --background
  paperWarm: "#E4EAEB",
  slate: "#76828B", // --muted-foreground
  line: "#D7DEE0", // --border
  card: "#FFFFFF",
  success: "#2E8B66",
  successSoft: "#E2F2EB",
  warning: "#D9A441",
  white: "#FFFFFF",
} as const;

// Beat boundaries (global frames @30fps). Beat = 15 frames (120 BPM).
export const BEATS = {
  buildUp: [0, 60],
  drop: [60, 90],
  popIn: [90, 120],
  punchWhip: [120, 150],
  uiFlow: [150, 210],
  wipe: [210, 240],
  resolve: [240, 270],
  outro: [270, 330],
} as const;

export const DUR = 330;
export const FPS = 30;

// Inner monitor logical size (16:9).
export const INNER_W = 1920;
export const INNER_H = 1080;
