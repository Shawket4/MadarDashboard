import { cn } from "@/lib/utils";

/**
 * The Madar wordmark, drawn inline so it follows the theme: the letters take the
 * text colour (`currentColor`) and the English "d" the brand colour. Replaces the
 * `<img>` + `dark:invert` trick, which also turned the brand "d" white in dark mode.
 * Arabic gets the Arabic wordmark. Decorative unless `title` is given.
 */
export function MadarWordmark({
  lang,
  title,
  className,
}: {
  lang: "en" | "ar";
  title?: string;
  className?: string;
}) {
  const label = title ? { role: "img", "aria-label": title } : { "aria-hidden": true as const };
  return lang === "ar" ? (
    <svg viewBox="259.82 231.22 280.37 128.17" className={cn("h-7 w-auto", className)} {...label}>
      <g transform="translate(156.66666666666669,216.0) scale(1.3333333333333333)"><g stroke="currentColor" strokeWidth="13.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="258" cy="62" r="15"/><path d="M243 62 Q243 78 224 78 L208 78"/><path d="M194 42 Q208 42 208 56 L208 78 L176 78"/><path d="M152 34 L152 78"/><path d="M122 42 L117 66 Q113 84 92 93"/></g><g transform="translate(258,32) scale(0.08830128886490901,-0.08830128886490901) translate(-121.92376708984375,-559.789306640625)"><path d="M20 540.525146484375V579.053466796875H223.8475341796875V540.525146484375Z" fill="currentColor"/></g><g transform="translate(196,28) scale(0.08830128886490901,-0.08830128886490901) translate(-121.92376708984375,-559.789306640625)"><path d="M20 540.525146484375V579.053466796875H223.8475341796875V540.525146484375Z" fill="currentColor"/></g><g transform="translate(105,24) scale(0.06732171161459549,-0.06732171161459549) translate(-152.09972561753102,-611.1061401367188)"><path d="M83.996826171875 549.4716796875 49.5235595703125 551.902587890625 33.267333984375 633.2122802734375 67.7406005859375 630.7813720703125ZM52.6839599609375 540.525146484375V579.053466796875H124.3192138671875V540.525146484375ZM130.3695068359375 540.525146484375Q116.7374267578125 603.8427734375 131.31683349609375 642.7649536132812Q145.896240234375 681.6871337890625 196.79248046875 681.6871337890625Q231.056640625 681.6871337890625 248.688720703125 664.0023803710938Q266.32080078125 646.317626953125 269.9261474609375 614.6588134765625Q273.531494140625 583 264.2154541015625 540.525146484375L226.6871337890625 548.0518798828125Q238.003173828125 601.42138671875 230.003173828125 622.2901000976562Q222.003173828125 643.1588134765625 196.79248046875 643.1588134765625Q171.581787109375 643.1588134765625 164.02911376953125 622.3427734375Q156.4764404296875 601.5267333984375 167.8978271484375 549.0518798828125ZM60.2625732421875 540.525146484375V579.053466796875H264.2154541015625V540.525146484375Z" fill="currentColor"/></g></g>
    </svg>
  ) : (
    <svg viewBox="100 200 420 120" className={cn("h-7 w-auto", className)} {...label}>
      <svg x="100" y="200" width="420" height="120.0" viewBox="0 0 322 92" overflow="visible"><g stroke="currentColor" strokeWidth="13.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M14 30 L14 72"/><path d="M14 40 A14 10 0 0 1 42 40"/><path d="M42 40 L42 72"/><path d="M42 40 A14 10 0 0 1 70 40"/><path d="M70 40 L70 72"/><circle cx="111" cy="51" r="21"/><path d="M132 30 L132 72"/><circle cx="235" cy="51" r="21"/><path d="M256 30 L256 72"/><path d="M279 30 L279 72"/><path d="M279 39 A18 13 0 0 1 305 30"/></g><g className="stroke-brand" strokeWidth="13.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="173" cy="51" r="21"/><path d="M194 10 L194 72"/></g></svg>
    </svg>
  );
}
