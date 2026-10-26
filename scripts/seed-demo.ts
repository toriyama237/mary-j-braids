// Données fictives pour présenter l'application. NE PAS lancer en production.
// Usage : npm run db:seed:demo
import "dotenv/config";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { clients, services, visits } from "../src/db/schema";

const DEMO_CLIENTS: (typeof clients.$inferInsert)[] = [
  { name: "Aïcha Mbarga", phone: "+237 690 00 00 01", gender: "F" },
  { name: "Brice Tchoumi", phone: "+237 690 00 00 02", gender: "H" },
  { name: "Carine Ngo Bassa", phone: "+237 690 00 00 03", gender: "F" },
  { name: "Daniel Essomba", phone: "+237 690 00 00 04", gender: "H" },
  { name: "Estelle Fotso", phone: "+237 690 00 00 05", gender: "F" },
  { name: "Franck Ndzi", phone: "+237 690 00 00 06", gender: "H" },
];

// Nombre de passages payés par client, pour illustrer la fidélité.
const STAMPS = [9, 8, 4, 6, 2, 1];

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString("en-CA", { timeZone: "Africa/Douala" });
}

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Refusé en production.");

  const pool = mysql.createPool({ uri: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const catalogue = await db.select().from(services);
  const women = catalogue.filter((s) => s.audience !== "homme");
  const men = catalogue.filter((s) => s.audience !== "femme");

  await db
    .insert(clients)
    .values(DEMO_CLIENTS)
    .onDuplicateKeyUpdate({ set: { name: sql`name` } });
  const all = await db.select().from(clients);

  const rows: (typeof visits.$inferInsert)[] = [];
  all.slice(0, DEMO_CLIENTS.length).forEach((client, ci) => {
    const choices = client.gender === "F" ? women : men;
    for (let i = 0; i < STAMPS[ci]!; i++) {
      const service = choices[(ci + i) % choices.length]!;
      rows.push({
        clientId: client.id,
        serviceId: service.id,
        date: daysAgo(i * 6 + ci),
        price: service.defaultPrice,
        paymentMethod: i % 2 ? "orange_money" : "especes",
      });
    }
  });
  await db.insert(visits).values(rows);

  console.log(`✓ ${all.length} clients et ${rows.length} passages de démonstration.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
