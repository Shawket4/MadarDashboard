// The Meta Pixel's PageView, on the live site only (never localhost or a preview).
// Off until the build has PUBLIC_META_PIXEL_ID (CI: the META_PIXEL_ID variable).
import { metaPixel } from "@shared/meta-pixel";

const id = (import.meta.env.PUBLIC_META_PIXEL_ID as string | undefined)?.trim();
if (id && location.hostname === "get.madar-pos.cloud") metaPixel(id)("track", "PageView");
