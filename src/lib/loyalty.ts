import "server-only";
import { and, count, eq, gt, max, sql } from "drizzle-orm";
import { db } from "@/db";
import { settings, visits } from "@/db/schema";

export async function getLoyaltyThreshold() {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, "loyalty_threshold"))
    .limit(1);
  return Number(row?.value ?? 10);
}

/**
 * Carte de fidélité d'un client : nombre de passages payés depuis la dernière
 * prestation offerte. Quand il atteint le seuil, la prochaine est offerte.
 */
export async function getLoyalty(clientId: number) {
  const [threshold, [lastFree]] = await Promise.all([
    getLoyaltyThreshold(),
    db
      .select({ id: max(visits.id) })
      .from(visits)
      .where(and(eq(visits.clientId, clientId), eq(visits.isFree, true))),
  ]);

  const [{ stamps }] = await db
    .select({ stamps: count() })
    .from(visits)
    .where(and(eq(visits.clientId, clientId), eq(visits.isFree, false), gt(visits.id, lastFree?.id ?? 0)));

  return { stamps, threshold, eligible: stamps >= threshold };
}

// Colonne qualifiée en toutes lettres : sur une requête à une seule table, Drizzle
// écrirait `id` tout court, que MySQL rattacherait à la sous-requête (visits.id).
const clientId = sql.raw("`clients`.`id`");

/** Même calcul en sous-requête SQL, pour les listes de clients (requête sur `clients`). */
export const stampsSql = sql<number>`(
  SELECT COUNT(*) FROM visits v
  WHERE v.client_id = ${clientId} AND v.is_free = 0
    AND v.id > COALESCE((SELECT MAX(v2.id) FROM visits v2 WHERE v2.client_id = ${clientId} AND v2.is_free = 1), 0)
)`.mapWith(Number);
