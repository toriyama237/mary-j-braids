import { formatFCFA } from "@/lib/format";

/** Répartition en barres horizontales, valeur au bout de chaque barre. */
export function Breakdown({
  rows,
  empty = "Aucune donnée sur la période.",
}: {
  rows: { label: string; value: number; hint?: string }[];
  empty?: string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 0);
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (rows.length === 0 || total === 0)
    return <p className="py-6 text-center text-sm text-stone-500">{empty}</p>;

  return (
    <ul className="space-y-3.5">
      {rows.map((r, i) => (
        <li key={r.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-stone-800">{r.label}</span>
            <span className="shrink-0 text-stone-600 tabular-nums">
              {formatFCFA(r.value)}
              <span className="ml-1.5 text-xs text-stone-400">{Math.round((r.value / total) * 100)} %</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-stone-100">
            <div
              style={{ width: `${max ? (r.value / max) * 100 : 0}%`, "--i": i } as React.CSSProperties}
              className="h-full origin-left animate-grow-x rounded-full bg-brand-600 stagger"
            />
          </div>
          {r.hint && <p className="mt-1 text-xs text-stone-500">{r.hint}</p>}
        </li>
      ))}
    </ul>
  );
}
