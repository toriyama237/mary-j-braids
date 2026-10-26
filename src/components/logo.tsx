import { cn } from "@/lib/cn";

export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        className={cn(
          "grid size-10 place-items-center rounded-xl font-display text-lg font-semibold",
          tone === "dark" ? "bg-brand-600 text-cream" : "bg-cream text-brand-700",
        )}
        aria-hidden
      >
        MJ
      </span>
      <span className="leading-tight">
        <span
          className={cn(
            "block font-display text-lg font-semibold",
            tone === "dark" ? "text-stone-900" : "text-cream",
          )}
        >
          Mary J Braids
        </span>
        <span className={cn("block text-xs", tone === "dark" ? "text-stone-500" : "text-brand-200")}>
          Salon de coiffure mixte
        </span>
      </span>
    </div>
  );
}
