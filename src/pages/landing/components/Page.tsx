import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * The Page component wraps each portfolio page in a fixed A4-landscape
 * canvas. Print CSS (in globals.css) handles the actual page break
 * behavior; on screen, pages stack vertically with shadows.
 */
export default function Page({ children, className = "" }: Props) {
  return <section className={`relative min-h-screen w-full overflow-hidden flex flex-col justify-center py-20 ${className}`}>{children}</section>;
}
