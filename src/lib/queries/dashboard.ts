import "server-only";
import { count, desc, eq, gte, sql, sum, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { clients, services, visits } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { todayISO } from "@/lib/format";
import { getLoyaltyThreshold, stampsSql } from "@/lib/loyalty";

export async function getDashboard() {
  await requireUser();

  const today = todayISO();
  const monthStart = `${today.slice(0, 7)}-01`;
  const threshold = await getLoyaltyThreshold();

  const revenue = (where: SQL) =>
    db
      .select({ total: sum(visits.price), count: count() })
      .from(visits)
      .where(where);

  const [[day], [month], [clientTotals], recent, almostFree] = await Promise.all([
    revenue(eq(visits.date, today)),
    revenue(gte(visits.date, monthStart)),
    db
      .select({
        total: count(),
        newThisMonth: sql<number>`SUM(${clients.createdAt} >= ${monthStart})`,
      })
      .from(clients),
    db
      .select({
        id: visits.id,
        date: visits.date,
        price: visits.price,
        isFree: visits.isFree,
        clientId: clients.id,
        client: clients.name,
        service: services.name,
      })
      .from(visits)
      .innerJoin(clients, eq(visits.clientId, clients.id))
      .innerJoin(services, eq(visits.serviceId, services.id))
      .orderBy(desc(visits.date), desc(visits.id))
      .limit(6),
    db
      .select({ id: clients.id, name: clients.name, stamps: stampsSql })
      .from(clients)
      .where(sql`${stampsSql} >= ${Math.max(threshold - 2, 1)}`)
      .orderBy(desc(stampsSql))
      .limit(5),
  ]);

  return {
    threshold,
    today: { revenue: Number(day?.total ?? 0), visits: day?.count ?? 0 },
    month: { revenue: Number(month?.total ?? 0), visits: month?.count ?? 0 },
    clients: {
      total: clientTotals?.total ?? 0,
      newThisMonth: Number(clientTotals?.newThisMonth ?? 0),
    },
    recent,
    almostFree,
  };
}
