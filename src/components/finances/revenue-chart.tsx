import { formatFCFA } from "@/lib/format";

type Point = { bucket: string; revenue: number; visits: number };

const compact = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });

/** Graduations « rondes » : 0, pas, 2×pas… jusqu'à couvrir le maximum. */
function niceTicks(max: number) {
  if (max <= 0) return [0, 1000];
  const rough = max / 4;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough)!;
  const ticks = [];
  for (let t = 0; t <= max + step * 0.001; t += step) ticks.push(t);
  if (ticks.at(-1)! < max) ticks.push(ticks.at(-1)! + step);
  return ticks;
}

function bucketLabel(bucket: string, byMonth: boolean, long = false) {
  const d = new Date(`${byMonth ? `${bucket}-01` : bucket}T12:00:00`);
  if (byMonth)
    return d.toLocaleDateString("fr-FR", {
      month: long ? "long" : "short",
      year: long ? "numeric" : undefined,
    });
  return long
    ? d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
    : String(d.getDate());
}

/** Histogramme du chiffre d'affaires (une seule série : pas de légende, le titre la nomme). */
export function RevenueChart({ data, byMonth }: { data: Point[]; byMonth: boolean }) {
  const max = Math.max(...data.map((d) => d.revenue), 0);
  const ticks = niceTicks(max);
  const top = ticks.at(-1)!;
  const peak = data.findIndex((d) => d.revenue === max && max > 0);
  // Une étiquette d'axe sur n, pour éviter les chevauchements sur 31 jours.
  const every = data.length > 16 ? Math.ceil(data.length / 8) : 1;

  return (
    <figure>
      <div className="relative h-56 pl-10">
        {/* Grille horizontale + graduations */}
        {ticks.map((t) => (
          <div
            key={t}
            className="absolute right-0 left-10 border-t border-stone-100"
            style={{ bottom: `${(t / top) * 100}%` }}
          >
            <span className="absolute -top-2 -left-10 w-8 text-right text-[11px] text-stone-400 tabular-nums">
              {compact.format(t)}
            </span>
          </div>
        ))}

        {/* Colonnes */}
        <div className="absolute inset-0 left-10 flex items-end gap-[2px]">
          {data.map((d, i) => {
            const h = top > 0 ? (d.revenue / top) * 100 : 0;
            return (
              <div key={d.bucket} className="group relative flex h-full flex-1 items-end justify-center">
                {d.revenue > 0 && (
                  <div
                    style={{ height: `${h}%`, animationDelay: `${i * 15}ms` }}
                    className="w-full max-w-6 origin-bottom animate-grow-y rounded-t-[4px] bg-brand-600 transition-colors group-hover:bg-brand-800"
                  />
                )}
                {i === peak && (
                  <span
                    className="pointer-events-none absolute -translate-y-1 text-[11px] font-semibold whitespace-nowrap text-stone-700 group-hover:opacity-0"
                    style={{ bottom: `${h}%` }}
                  >
                    {compact.format(d.revenue)}
                  </span>
                )}
                {/* Info-bulle au survol / toucher */}
                <div className="pointer-events-none absolute bottom-full z-10 mb-1 hidden min-w-36 -translate-y-1 rounded-xl bg-stone-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                  <p className="font-medium text-stone-300 first-letter:uppercase">
                    {bucketLabel(d.bucket, byMonth, true)}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold">{formatFCFA(d.revenue)}</p>
                  <p className="text-stone-400">
                    {d.visits} passage{d.visits > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Axe des abscisses */}
      <div className="mt-2 flex gap-[2px] pl-10" aria-hidden>
        {data.map((d, i) => (
          <span
            key={d.bucket}
            className="flex-1 text-center text-[11px] text-stone-400 first-letter:uppercase"
          >
            {i % every === 0 ? bucketLabel(d.bucket, byMonth) : ""}
          </span>
        ))}
      </div>

      {/* Version tableau pour les lecteurs d'écran */}
      <table className="sr-only">
        <caption>Chiffre d&apos;affaires par {byMonth ? "mois" : "jour"}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.bucket}>
              <th scope="row">{bucketLabel(d.bucket, byMonth, true)}</th>
              <td>{formatFCFA(d.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
