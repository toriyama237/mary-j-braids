import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { loginAttempts } from "@/db/schema";

/** Nombre d'essais ratés autorisés avant blocage. */
export const MAX_FAILURES = 5;
/** Durée du blocage, en secondes. */
export const LOCK_SECONDS = 60;

// Les comparaisons de dates se font côté MySQL (NOW()) pour éviter tout décalage de fuseau horaire.

/** Secondes restantes avant de pouvoir réessayer (0 si l'identifiant n'est pas bloqué). */
export async function lockedFor(username: string) {
  const [row] = await db
    .select({ wait: sql<number>`TIMESTAMPDIFF(SECOND, NOW(), ${loginAttempts.lockedUntil})`.mapWith(Number) })
    .from(loginAttempts)
    .where(eq(loginAttempts.username, username))
    .limit(1);
  return row && row.wait > 0 ? row.wait : 0;
}

/** Enregistre un échec ; au 5e, bloque l'identifiant pendant 1 minute. Renvoie l'état qui en résulte. */
export async function recordFailure(username: string) {
  await db
    .insert(loginAttempts)
    .values({ username, failures: 1 })
    .onDuplicateKeyUpdate({ set: { failures: sql`${loginAttempts.failures} + 1` } });

  const [row] = await db
    .select({ failures: loginAttempts.failures })
    .from(loginAttempts)
    .where(eq(loginAttempts.username, username));
  const failures = row?.failures ?? 1;

  if (failures >= MAX_FAILURES) {
    await db
      .update(loginAttempts)
      .set({ failures: 0, lockedUntil: sql`NOW() + INTERVAL ${LOCK_SECONDS} SECOND` })
      .where(eq(loginAttempts.username, username));
    return { lockedFor: LOCK_SECONDS, remaining: 0 };
  }
  return { lockedFor: 0, remaining: MAX_FAILURES - failures };
}

/** Connexion réussie : on oublie les échecs précédents. */
export async function clearFailures(username: string) {
  await db.delete(loginAttempts).where(eq(loginAttempts.username, username));
}
