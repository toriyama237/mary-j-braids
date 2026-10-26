import {
  boolean,
  date,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// Montants stockés en FCFA entiers (pas de centimes).

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clients = mysqlTable(
  "clients",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 30 }).unique(),
    gender: mysqlEnum("gender", ["F", "H"]).notNull(),
    birthday: date("birthday", { mode: "string" }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("clients_name_idx").on(t.name)],
);

export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  audience: mysqlEnum("audience", ["femme", "homme", "mixte"]).notNull(),
  defaultPrice: int("default_price").notNull(),
  active: boolean("active").default(true).notNull(),
});

export const visits = mysqlTable(
  "visits",
  {
    id: int("id").autoincrement().primaryKey(),
    clientId: int("client_id")
      .notNull()
      .references(() => clients.id),
    serviceId: int("service_id")
      .notNull()
      .references(() => services.id),
    date: date("date", { mode: "string" }).notNull(),
    price: int("price").notNull(),
    paymentMethod: mysqlEnum("payment_method", ["especes", "orange_money", "mtn_momo"]).notNull(),
    // Prestation offerte par le programme de fidélité (prix = 0).
    isFree: boolean("is_free").default(false).notNull(),
    note: text("note"),
    createdBy: int("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("visits_client_idx").on(t.clientId), index("visits_date_idx").on(t.date)],
);

export const expenses = mysqlTable(
  "expenses",
  {
    id: int("id").autoincrement().primaryKey(),
    date: date("date", { mode: "string" }).notNull(),
    label: varchar("label", { length: 150 }).notNull(),
    category: mysqlEnum("category", ["produits", "loyer", "electricite", "salaires", "autre"]).notNull(),
    amount: int("amount").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("expenses_date_idx").on(t.date)],
);

export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 50 }).primaryKey(),
  value: varchar("value", { length: 255 }).notNull(),
});

export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Visit = typeof visits.$inferSelect;
