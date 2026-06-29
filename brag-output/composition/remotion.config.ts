import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setConcurrency(4);
Config.setChromiumOpenGlRenderer("angle");
// Quality bias for crisp UI + smooth gradients.
Config.setCrf(18);
