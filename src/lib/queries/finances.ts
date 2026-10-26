import "server-only";
import { and, asc, between, count, desc, eq, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import { clients, expenses, services, visits } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { todayISO } from "@/lib/format";

export type Period = { key: string; from: string; to: string; label: string };

const iso = (d: Date) => d.toISOString().slice(0, 10);
const monthLabel = (d: Date) =>
  d.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

/** Traduit ?periode=…&du=…&au=… en bornes de dates (inclusives). */
export function resolvePeriod(params: Record<string, string | string[] | undefined>): Period {
  const get = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : undefined);
  const today = todayISO();
  const [y, m] = today.split("-").map(Number) as [number, number];
  const key = get("periode") ?? "mois";

  switch (key) {
    case "mois-dernier": {
      const start = new Date(Date.UTC(y, m - 2, 1));
      return { key, from: iso(start), to: iso(new Date(Date.UTC(y, m - 1, 0))), label: monthLabel(start) };
    }
    case "annee":
      return { key, from: `${y}-01-01`, to: today, label: `Année ${y}` };
    case "perso": {
      const valid = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
      const from = valid(get("du")) ?? `${today.slice(0, 7)}-01`;
      const to = valid(get("au")) ?? today;
      const [a, b] = from <= to ? [from, to] : [to, from];
      const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("fr-FR");
      return { key, from: a, to: b, label: `Du ${fmt(a)} au ${fmt(b)}` };
    }
    default:
      return {
        key: "mois",
        from: `${today.slice(0, 7)}-01`,
        to: today,
        label: monthLabel(new Date(Date.UTC(y, m - 1, 1))),
      };
  }
}

export async function getFinances(period: Period) {
  await requireAdmin();

  const inRange = between(visits.date, period.from, period.to);
  const days = (Date.parse(period.to) - Date.parse(period.from)) / 864e5 + 1;
  const byMonth = days > 62;
  const bucket = byMonth ? sql<string>`DATE_FORMAT(${visits.date}, '%Y-%m')` : sql<string>`${visits.date}`;

  const [[totals], [spent], series, byService, byPayment, byGender, topClients, expenseList] =
    await Promise.all([
      db
        .select({
          revenue: sum(visits.price).mapWith(Number),
          visits: count(),
          free: sql<number>`SUM(${visits.isFree})`.mapWith(Number),
        })
        .from(visits)
        .where(inRange),
      db
        .select({ total: sum(expenses.amount).mapWith(Number) })
        .from(expenses)
        .where(between(expenses.date, period.from, period.to)),
      db
        .select({ bucket, revenue: sum(visits.price).mapWith(Number), visits: count() })
        .from(visits)
        .where(inRange)
        .groupBy(bucket)
        .orderBy(asc(bucket)),
      db
        .select({ name: services.name, visits: count(), revenue: sum(visits.price).mapWith(Number) })
        .from(visits)
        .innerJoin(services, eq(visits.serviceId, services.id))
        .where(inRange)
        .groupBy(services.id, services.name)
        .orderBy(desc(sum(visits.price))),
      db
        .select({ method: visits.paymentMethod, revenue: sum(visits.price).mapWith(Number), visits: count() })
        .from(visits)
        .where(and(inRange, eq(visits.isFree, false)))
        .groupBy(visits.paymentMethod),
      db
        .select({ gender: clients.gender, revenue: sum(visits.price).mapWith(Number), visits: count() })
        .from(visits)
        .innerJoin(clients, eq(visits.clientId, clients.id))
        .where(inRange)
        .groupBy(clients.gender),
      db
        .select({
          id: clients.id,
          name: clients.name,
          visits: count(),
          revenue: sum(visits.price).mapWith(Number),
        })
        .from(visits)
        .innerJoin(clients, eq(visits.clientId, clients.id))
        .where(inRange)
        .groupBy(clients.id, clients.name)
        .orderBy(desc(sum(visits.price)))
        .limit(5),
      db
        .select()
        .from(expenses)
        .where(between(expenses.date, period.from, period.to))
        .orderBy(desc(expenses.date), desc(expenses.id)),
    ]);

  const revenue = totals?.revenue ?? 0;
  const expenseTotal = spent?.total ?? 0;
  const paidVisits = (totals?.visits ?? 0) - (totals?.free ?? 0);

  return {
    period,
    byMonth,
    revenue,
    expenses: expenseTotal,
    net: revenue - expenseTotal,
    visits: totals?.visits ?? 0,
    free: totals?.free ?? 0,
    average: paidVisits > 0 ? Math.round(revenue / paidVisits) : 0,
    series: fillSeries(series, period, byMonth),
    byService,
    byPayment,
    byGender,
    topClients,
    expenseList,
  };
}

/** Complète la série avec les jours (ou mois) sans passage, pour un axe continu. */
function fillSeries(
  rows: { bucket: string; revenue: number; visits: number }[],
  period: Period,
  byMonth: boolean,
) {
  const found = new Map(rows.map((r) => [String(r.bucket), r]));
  const out: { bucket: string; revenue: number; visits: number }[] = [];
  const cursor = new Date(`${period.from}T00:00:00Z`);
  const end = new Date(`${period.to}T00:00:00Z`);
  while (cursor <= end) {
    const key = byMonth ? iso(cursor).slice(0, 7) : iso(cursor);
    if (!out.some((o) => o.bucket === key)) {
      out.push(found.get(key) ?? { bucket: key, revenue: 0, visits: 0 });
    }
    if (byMonth) cursor.setUTCMonth(cursor.getUTCMonth() + 1, 1);
    else cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

/** Passages détaillés de la période, pour les exports. */
export async function getVisitsForExport(period: Period) {
  await requireAdmin();
  return db
    .select({
      id: visits.id,
      clientId: visits.clientId,
      date: visits.date,
      client: clients.name,
      phone: clients.phone,
      service: services.name,
      price: visits.price,
      paymentMethod: visits.paymentMethod,
      isFree: visits.isFree,
      note: visits.note,
    })
    .from(visits)
    .innerJoin(clients, eq(visits.clientId, clients.id))
    .innerJoin(services, eq(visits.serviceId, services.id))
    .where(between(visits.date, period.from, period.to))
    .orderBy(asc(visits.date), asc(visits.id));
}
