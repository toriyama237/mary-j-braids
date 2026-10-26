import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Tuile de chiffre clé ; `index` décale son apparition en cascade. */
export function StatCard({
  index,
  icon,
  label,
  value,
  hint,
  highlight,
}: {
  index: number;
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{ "--i": index } as React.CSSProperties}
      className={cn(
        "animate-fade-up rounded-2xl p-4 shadow-sm transition-transform duration-300 stagger hover:-translate-y-0.5 sm:p-5",
        highlight ? "bg-brand-700 text-cream" : "border border-stone-200/80 bg-white",
      )}
    >
      <div className={cn("flex items-center gap-2 text-sm", highlight ? "text-brand-200" : "text-stone-500")}>
        <span className={highlight ? "text-gold-400" : "text-brand-600"}>{icon}</span>
        {label}
      </div>
      <p className="mt-3 font-display text-lg font-semibold sm:text-2xl">{value}</p>
      <p className={cn("mt-1 text-xs", highlight ? "text-brand-200" : "text-stone-500")}>{hint}</p>
    </div>
  );
}
