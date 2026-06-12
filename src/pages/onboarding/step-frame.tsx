import type { ReactNode } from "react";

/** Title/description wrapper shared by every wizard step. */
export function StepFrame({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold">{title}</h1>
      {description && <p className="text-sm text-muted-foreground mt-1 mb-6">{description}</p>}
      {!description && <div className="mb-6" />}
      {children}
    </div>
  );
}
