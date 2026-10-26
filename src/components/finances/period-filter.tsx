import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Period } from "@/lib/queries/finances";

const PRESETS = [
  { key: "mois", label: "Ce mois" },
  { key: "mois-dernier", label: "Mois dernier" },
  { key: "annee", label: "Cette année" },
  { key: "perso", label: "Personnalisé" },
];

/** Filtre de période : une seule rangée au-dessus des chiffres. */
export function PeriodFilter({ period }: { period: Period }) {
  return (
    <div className="space-y-3">
      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" aria-label="Période">
        {PRESETS.map((p) => (
          <Link
            key={p.key}
            href={p.key === "mois" ? "/finances" : `/finances?periode=${p.key}`}
            scroll={false}
            aria-current={period.key === p.key ? "true" : undefined}
            className={cn(
              "h-10 shrink-0 rounded-full border px-4 text-sm leading-10 font-medium transition-all",
              period.key === p.key
                ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                : "border-stone-200 bg-white text-stone-600 hover:border-stone-300",
            )}
          >
            {p.label}
          </Link>
        ))}
      </nav>
      {period.key === "perso" && (
        <form className="flex animate-fade-in flex-wrap items-end gap-2" action="/finances">
          <input type="hidden" name="periode" value="perso" />
          <label className="text-sm">
            <span className="mb-1 block text-stone-500">Du</span>
            <input
              type="date"
              name="du"
              defaultValue={period.from}
              className="h-10 rounded-xl border border-stone-200 bg-white px-3"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-stone-500">Au</span>
            <input
              type="date"
              name="au"
              defaultValue={period.to}
              className="h-10 rounded-xl border border-stone-200 bg-white px-3"
            />
          </label>
          <button className="h-10 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition-all hover:bg-stone-700 active:scale-[0.98]">
            Appliquer
          </button>
        </form>
      )}
    </div>
  );
}
