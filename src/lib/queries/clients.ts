import "server-only";
import { asc, count, desc, eq, like, max, or, sum } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { clients, services, visits } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getLoyalty, getLoyaltyThreshold, stampsSql } from "@/lib/loyalty";

export async function listClients(search?: string) {
  await requireUser();

  const q = search?.trim();
  const [threshold, rows] = await Promise.all([
    getLoyaltyThreshold(),
    db
      .select({
        id: clients.id,
        name: clients.name,
        phone: clients.phone,
        gender: clients.gender,
        visits: count(visits.id),
        lastVisit: max(visits.date),
        stamps: stampsSql,
      })
      .from(clients)
      .leftJoin(visits, eq(visits.clientId, clients.id))
      .where(q ? or(like(clients.name, `%${q}%`), like(clients.phone, `%${q}%`)) : undefined)
      .groupBy(clients.id)
      .orderBy(asc(clients.name)),
  ]);

  return { threshold, clients: rows };
}

export async function getClientDetail(id: number) {
  await requireUser();

  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!client) notFound();

  const [history, [totals], loyalty] = await Promise.all([
    db
      .select({
        id: visits.id,
        date: visits.date,
        price: visits.price,
        isFree: visits.isFree,
        paymentMethod: visits.paymentMethod,
        note: visits.note,
        service: services.name,
      })
      .from(visits)
      .innerJoin(services, eq(visits.serviceId, services.id))
      .where(eq(visits.clientId, id))
      .orderBy(desc(visits.date), desc(visits.id)),
    db
      .select({ spent: sum(visits.price), count: count() })
      .from(visits)
      .where(eq(visits.clientId, id)),
    getLoyalty(id),
  ]);

  return {
    client,
    history,
    loyalty,
    totals: { spent: Number(totals?.spent ?? 0), visits: totals?.count ?? 0 },
  };
}

/** Clients pour le sélecteur du formulaire de passage (liste courte et légère). */
export async function listClientsForPicker() {
  await requireUser();
  return db
    .select({ id: clients.id, name: clients.name, phone: clients.phone, stamps: stampsSql })
    .from(clients)
    .orderBy(asc(clients.name));
}
