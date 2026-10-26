import { FileDown, FileSpreadsheet, Gift, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Breakdown } from "@/components/finances/breakdown";
import { ExpenseRow, NewExpense } from "@/components/finances/expense-form";
import { VisitsTable } from "@/components/finances/visits-table";
import { PeriodFilter } from "@/components/finances/period-filter";
import { RevenueChart } from "@/components/finances/revenue-chart";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/cn";
import { formatFCFA, PAYMENT_LABELS, plural, todayISO } from "@/lib/format";
import { getFinances, getVisitsForExport, resolvePeriod } from "@/lib/queries/finances";

export const metadata: Metadata = { title: "Finances" };

export default async function FinancesPage({ searchParams }: PageProps<"/finances">) {
  const period = resolvePeriod(await searchParams);
  const [f, periodVisits] = await Promise.all([getFinances(period), getVisitsForExport(period)]);
  const today = todayISO();

  const query = new URLSearchParams(
    period.key === "perso"
      ? { periode: "perso", du: period.from, au: period.to }
      : period.key === "mois"
        ? {}
        : { periode: period.key },
  ).toString();
  const returnTo = `/finances${query ? `?${query}` : ""}`;
  const exportQuery = `du=${period.from}&au=${period.to}`;

  return (
    <>
      <PageHeader
        title="Finances"
        subtitle={<span className="first-letter:uppercase">{period.label}</span>}
        actions={
          <>
            <ButtonLink
              href={`/finances/export/pdf?${exportQuery}`}
              prefetch={false}
              target="_blank"
              className="flex-1 sm:flex-none"
            >
              <FileDown className="size-4" /> Rapport PDF
            </ButtonLink>
            <ButtonLink
              href={`/finances/export/excel?${exportQuery}`}
              prefetch={false}
              variant="secondary"
              className="flex-1 sm:flex-none"
            >
              <FileSpreadsheet className="size-4" /> Excel
            </ButtonLink>
          </>
        }
      />

      <div className="space-y-4 lg:space-y-6">
        <PeriodFilter period={period} />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard
            index={0}
            icon={<TrendingUp className="size-5" />}
            label="Chiffre d'affaires"
            value={formatFCFA(f.revenue)}
            hint={plural(f.visits, "passage")}
          />
          <StatCard
            index={1}
            icon={<TrendingDown className="size-5" />}
            label="Dépenses"
            value={formatFCFA(f.expenses)}
            hint={plural(f.expenseList.length, "dépense")}
          />
          <StatCard
            index={2}
            highlight
            icon={<Wallet className="size-5" />}
            label="Bénéfice net"
            value={formatFCFA(f.net)}
            hint={f.revenue > 0 ? `Marge ${Math.round((f.net / f.revenue) * 100)} %` : "—"}
          />
          <StatCard
            index={3}
            icon={<Gift className="size-5" />}
            label="Panier moyen"
            value={formatFCFA(f.average)}
            hint={`${plural(f.free, "prestation")} offerte${f.free > 1 ? "s" : ""}`}
          />
        </div>

        <Card className="p-5">
          <div className="mb-6 flex items-baseline justify-between">
            <CardTitle>Chiffre d&apos;affaires par {f.byMonth ? "mois" : "jour"}</CardTitle>
            <span className="text-xs text-stone-400">Survolez une colonne</span>
          </div>
          <RevenueChart data={f.series} byMonth={f.byMonth} />
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <Card className="p-5">
            <CardTitle className="mb-4">Par service</CardTitle>
            <Breakdown
              rows={f.byService.map((s) => ({
                label: s.name,
                value: s.revenue,
                hint: plural(s.visits, "passage"),
              }))}
            />
          </Card>
          <div className="space-y-4 lg:space-y-6">
            <Card className="p-5">
              <CardTitle className="mb-4">Par mode de paiement</CardTitle>
              <Breakdown
                rows={f.byPayment.map((p) => ({ label: PAYMENT_LABELS[p.method], value: p.revenue }))}
              />
            </Card>
            <Card className="p-5">
              <CardTitle className="mb-4">Femmes / hommes</CardTitle>
              <Breakdown
                rows={f.byGender.map((g) => ({
                  label: g.gender === "F" ? "Femmes" : "Hommes",
                  value: g.revenue,
                  hint: plural(g.visits, "passage"),
                }))}
              />
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <Card>
            <CardTitle className="px-5 pt-5 pb-2">Meilleurs clients</CardTitle>
            {f.topClients.length === 0 ? (
              <p className="px-5 pb-6 text-sm text-stone-500">Aucun passage sur la période.</p>
            ) : (
              <ol className="divide-y divide-stone-100">
                {f.topClients.map((c, i) => (
                  <li key={c.id}>
                    <Link
                      href={`/clients/${c.id}`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-cream"
                    >
                      <span
                        className={cn(
                          "grid size-8 place-items-center rounded-full text-sm font-semibold",
                          i === 0 ? "bg-gold-400 text-brand-900" : "bg-sand text-stone-600",
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{c.name}</span>
                        <span className="text-xs text-stone-500">{plural(c.visits, "passage")}</span>
                      </span>
                      <span className="text-sm font-semibold whitespace-nowrap">{formatFCFA(c.revenue)}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card>
            <div className="flex items-baseline justify-between px-5 pt-5 pb-2">
              <CardTitle>Dépenses</CardTitle>
              <span className="text-sm font-semibold">{formatFCFA(f.expenses)}</span>
            </div>
            {f.expenseList.length > 0 && (
              <ul className="divide-y divide-stone-100">
                {f.expenseList.map((x) => (
                  <ExpenseRow key={x.id} expense={x} returnTo={returnTo} today={today} />
                ))}
              </ul>
            )}
            <div className="p-4">
              <NewExpense returnTo={returnTo} today={today} />
            </div>
          </Card>
        </div>

        <VisitsTable visits={periodVisits} returnTo={returnTo} />
      </div>
    </>
  );
}
