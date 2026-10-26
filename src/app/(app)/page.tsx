import { ArrowRight, CalendarDays, Gift, Plus, TrendingUp, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { requireUser } from "@/lib/auth";
import { formatFCFA, formatShortDate, initials, plural, todayISO } from "@/lib/format";
import { getDashboard } from "@/lib/queries/dashboard";

export const metadata: Metadata = { title: "Accueil" };

export default async function DashboardPage() {
  const [user, data] = await Promise.all([requireUser(), getDashboard()]);
  const firstName = user.name.split(" ")[0];
  const longDate = new Date(`${todayISO()}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-stone-500 first-letter:uppercase">{longDate}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-stone-900">Bonjour {firstName}</h1>
        </div>
        <ButtonLink href="/passages/nouveau" className="w-full sm:w-auto">
          <Plus className="size-5" />
          Enregistrer un passage
        </ButtonLink>
      </header>

      {/* Chiffres clés */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          index={0}
          highlight
          icon={<CalendarDays className="size-5" />}
          label="Aujourd'hui"
          value={formatFCFA(data.today.revenue)}
          hint={plural(data.today.visits, "passage")}
        />
        <StatCard
          index={1}
          icon={<TrendingUp className="size-5" />}
          label="Ce mois-ci"
          value={formatFCFA(data.month.revenue)}
          hint={plural(data.month.visits, "passage")}
        />
        <StatCard
          index={2}
          icon={<Users className="size-5" />}
          label="Clients"
          value={String(data.clients.total)}
          hint={`+${data.clients.newThisMonth} ce mois`}
        />
        <StatCard
          index={3}
          icon={<Gift className="size-5" />}
          label="Fidélité"
          value={`${data.threshold} passages`}
          hint="= 1 prestation offerte"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* Derniers passages */}
        <Card>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <CardTitle>Derniers passages</CardTitle>
            <Link
              href="/clients"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
            >
              Voir les clients <ArrowRight className="size-4" />
            </Link>
          </div>
          {data.recent.length === 0 ? (
            <Empty
              title="Aucun passage pour l'instant"
              text="Les prestations enregistrées apparaîtront ici."
            />
          ) : (
            <ul className="divide-y divide-stone-100">
              {data.recent.map((v, i) => (
                <li
                  key={v.id}
                  style={{ "--i": i + 4 } as React.CSSProperties}
                  className="animate-fade-up stagger"
                >
                  <Link
                    href={`/clients/${v.clientId}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-cream"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand text-sm font-semibold text-stone-700">
                      {initials(v.client)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{v.client}</p>
                      <p className="truncate text-sm text-stone-500">
                        {v.service} · {formatShortDate(v.date)}
                      </p>
                    </div>
                    {v.isFree ? (
                      <span className="rounded-full bg-gold-400/20 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        Offert
                      </span>
                    ) : (
                      <span className="text-sm font-semibold whitespace-nowrap">{formatFCFA(v.price)}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Fidélité */}
        <Card>
          <div className="px-5 pt-5 pb-3">
            <CardTitle>Bientôt une prestation offerte</CardTitle>
            <p className="mt-1 text-sm text-stone-500">Clients proches des {data.threshold} passages.</p>
          </div>
          {data.almostFree.length === 0 ? (
            <Empty
              title="Personne pour l'instant"
              text="Les clients fidèles apparaîtront ici avant leur récompense."
            />
          ) : (
            <ul className="space-y-4 px-5 pb-5">
              {data.almostFree.map((c) => (
                <li key={c.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <Link href={`/clients/${c.id}`} className="font-medium hover:text-brand-700">
                      {c.name}
                    </Link>
                    <span className="text-stone-500">
                      {Math.min(c.stamps, data.threshold)}/{data.threshold}
                    </span>
                  </div>
                  <LoyaltyBar stamps={c.stamps} threshold={data.threshold} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function LoyaltyBar({ stamps, threshold }: { stamps: number; threshold: number }) {
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: threshold }, (_, i) => (
        <span
          key={i}
          style={{ "--i": i } as React.CSSProperties}
          className={`h-2 flex-1 origin-left animate-grow-x rounded-full stagger ${
            i < stamps ? "bg-brand-500" : "bg-stone-200"
          }`}
        />
      ))}
    </div>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="px-5 pt-4 pb-8 text-center">
      <p className="font-medium text-stone-700">{title}</p>
      <p className="mt-1 text-sm text-stone-500">{text}</p>
    </div>
  );
}
