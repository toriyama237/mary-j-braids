import { Gift } from "lucide-react";
import { cn } from "@/lib/cn";

/** Carte de fidélité : un tampon par passage payé, la dernière case = cadeau. */
export function LoyaltyCard({ stamps, threshold }: { stamps: number; threshold: number }) {
  const filled = Math.min(stamps, threshold);
  const eligible = stamps >= threshold;
  const remaining = threshold - filled;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-cream shadow-lg shadow-brand-900/20">
      <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/5" aria-hidden />
      <div className="absolute -bottom-16 -left-6 size-40 rounded-full bg-gold-400/10" aria-hidden />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs tracking-[0.2em] text-brand-200 uppercase">Carte fidélité</p>
          <p className="mt-1 font-display text-2xl font-semibold">
            {filled}
            <span className="text-brand-300">/{threshold}</span>
          </p>
        </div>
        <span className="font-display text-sm font-semibold text-gold-400">MJ</span>
      </div>

      <div className="relative mt-5 grid grid-cols-5 gap-2.5">
        {Array.from({ length: threshold }, (_, i) => {
          const isGift = i === threshold - 1;
          const on = i < filled;
          return (
            <span
              key={i}
              style={{ "--i": i } as React.CSSProperties}
              className={cn(
                "grid aspect-square place-items-center rounded-full border-2 text-xs font-semibold stagger",
                on
                  ? "animate-pop border-gold-400 bg-gold-400 text-brand-900"
                  : "border-dashed border-white/25 text-white/40",
              )}
            >
              {isGift ? <Gift className="size-4" /> : on ? "✓" : i + 1}
            </span>
          );
        })}
      </div>

      <p className="relative mt-4 text-sm text-brand-100">
        {eligible ? (
          <span className="font-semibold text-gold-400">La prochaine prestation est offerte !</span>
        ) : (
          <>
            Encore <b className="text-white">{remaining}</b> passage{remaining > 1 ? "s" : ""} avant la
            prestation offerte.
          </>
        )}
      </p>
    </div>
  );
}

/** Petite jauge pour les listes. */
export function LoyaltyMeter({ stamps, threshold }: { stamps: number; threshold: number }) {
  const pct = Math.min(stamps / threshold, 1) * 100;
  const eligible = stamps >= threshold;
  return (
    <div className="flex items-center gap-2" title={`${Math.min(stamps, threshold)}/${threshold} passages`}>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-stone-200">
        <span
          className={cn(
            "block h-full origin-left animate-grow-x rounded-full",
            eligible ? "bg-gold-500" : "bg-brand-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </span>
      {eligible ? (
        <Gift className="size-4 text-gold-500" />
      ) : (
        <span className="text-xs text-stone-500 tabular-nums">
          {stamps}/{threshold}
        </span>
      )}
    </div>
  );
}
