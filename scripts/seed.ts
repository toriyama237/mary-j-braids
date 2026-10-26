// Initialise la base : compte gérant, catalogue de services, réglages.
// Usage : npm run db:seed   (idempotent, peut être relancé sans risque)
import "dotenv/config";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { services, settings, users } from "../src/db/schema";

const CATALOGUE: (typeof services.$inferInsert)[] = [
  { name: "Tresses", audience: "femme", defaultPrice: 10000 },
  { name: "Nattes collées", audience: "femme", defaultPrice: 5000 },
  { name: "Tissage", audience: "femme", defaultPrice: 8000 },
  { name: "Locks (entretien)", audience: "mixte", defaultPrice: 5000 },
  { name: "Coupe homme", audience: "homme", defaultPrice: 1500 },
  { name: "Dégradé", audience: "homme", defaultPrice: 2000 },
  { name: "Barbe", audience: "homme", defaultPrice: 1000 },
  { name: "Coupe enfant", audience: "mixte", defaultPrice: 1000 },
];

async function main() {
  const { ADMIN_NAME, ADMIN_USERNAME, ADMIN_PASSWORD, DATABASE_URL } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    throw new Error("ADMIN_USERNAME et ADMIN_PASSWORD sont requis dans .env");
  }

  const pool = mysql.createPool({ uri: DATABASE_URL });
  const db = drizzle(pool);

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await db
    .insert(users)
    .values({ name: ADMIN_NAME ?? "Gérant", username: ADMIN_USERNAME, passwordHash, role: "admin" })
    .onDuplicateKeyUpdate({ set: { passwordHash, role: "admin" } });

  const existing = await db.select({ id: services.id }).from(services).limit(1);
  if (existing.length === 0) await db.insert(services).values(CATALOGUE);

  await db
    .insert(settings)
    .values({ key: "loyalty_threshold", value: "10" })
    .onDuplicateKeyUpdate({ set: { key: "loyalty_threshold" } });

  console.log(`✓ Compte « ${ADMIN_USERNAME} » prêt, catalogue et réglages initialisés.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
