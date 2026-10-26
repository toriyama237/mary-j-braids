"use server";

import bcrypt from "bcryptjs";
import { and, count, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { services, settings, users, visits } from "@/db/schema";
import { requireAdmin, requireUser } from "@/lib/auth";
import { fieldErrors, readFields, type FormState } from "@/lib/form";

/* ---------- Services ---------- */

const serviceSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court.").max(100),
  audience: z.enum(["femme", "homme", "mixte"], { error: "Choisissez la clientèle." }),
  defaultPrice: z.coerce
    .number({ error: "Prix invalide." })
    .int("Prix invalide.")
    .min(0, "Prix invalide.")
    .max(1_000_000),
});

export async function saveService(
  id: number | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = readFields(formData, ["name", "audience", "defaultPrice"]);
  const parsed = serviceSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  if (id) await db.update(services).set(parsed.data).where(eq(services.id, id));
  else await db.insert(services).values(parsed.data);
  revalidatePath("/", "layout");
  redirect("/reglages?ok=service");
}

/** Masquer plutôt que supprimer : l'historique des passages garde le service. */
export async function toggleService(id: number, active: boolean) {
  await requireAdmin();
  await db.update(services).set({ active }).where(eq(services.id, id));
  revalidatePath("/", "layout");
}

/** Suppression définitive, possible seulement pour un service jamais utilisé. */
export async function deleteService(id: number) {
  await requireAdmin();
  const [{ used }] = await db.select({ used: count() }).from(visits).where(eq(visits.serviceId, id));
  if (used === 0) await db.delete(services).where(eq(services.id, id));
  revalidatePath("/", "layout");
  redirect(`/reglages?ok=${used === 0 ? "service-supprime" : "service"}`);
}

/* ---------- Fidélité ---------- */

export async function saveThreshold(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const value = String(formData.get("threshold") ?? "");
  const parsed = z.coerce.number().int().min(2).max(50).safeParse(value);
  if (!parsed.success)
    return { errors: { threshold: "Entre 2 et 50 passages." }, values: { threshold: value } };

  await db
    .insert(settings)
    .values({ key: "loyalty_threshold", value: String(parsed.data) })
    .onDuplicateKeyUpdate({ set: { value: String(parsed.data) } });
  revalidatePath("/", "layout");
  redirect("/reglages?ok=fidelite");
}

/* ---------- Utilisateurs ---------- */

const userSchema = z.object({
  name: z.string().trim().min(2, "Indiquez le nom.").max(100),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,50}$/, "3 caractères minimum : lettres, chiffres, point, tiret."),
  role: z.enum(["admin", "staff"], { error: "Choisissez un rôle." }),
  password: z.string(),
});

async function adminCount(exceptId?: number) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(users)
    .where(exceptId ? and(eq(users.role, "admin"), ne(users.id, exceptId)) : eq(users.role, "admin"));
  return n;
}

/** Crée (id = null) ou modifie un utilisateur ; un mot de passe saisi en modification le réinitialise. */
export async function saveUser(id: number | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const values = readFields(formData, ["name", "username", "role", "password"]);
  const parsed = userSchema.safeParse(values);
  const errors: FormState["errors"] = parsed.success ? {} : fieldErrors(parsed.error);
  const keep = { ...values, password: "" };

  const password = values.password;
  if ((!id || password) && password.length < 8) errors.password = "8 caractères minimum.";
  if (!parsed.success || Object.values(errors).some(Boolean)) return { errors, values: keep };

  const data = parsed.data;
  const [taken] = await db
    .select({ id: users.id })
    .from(users)
    .where(id ? and(eq(users.username, data.username), ne(users.id, id)) : eq(users.username, data.username))
    .limit(1);
  if (taken) return { errors: { username: "Cet identifiant est déjà utilisé." }, values: keep };

  if (id && data.role !== "admin" && (id === me.id || (await adminCount(id)) === 0)) {
    return {
      errors: { role: "Il faut garder au moins un gérant (et vous ne pouvez pas vous rétrograder)." },
      values: keep,
    };
  }

  const fields = { name: data.name, username: data.username, role: data.role };
  if (id) {
    await db
      .update(users)
      .set(password ? { ...fields, passwordHash: await bcrypt.hash(password, 12) } : fields)
      .where(eq(users.id, id));
  } else {
    await db.insert(users).values({ ...fields, passwordHash: await bcrypt.hash(password, 12) });
  }
  revalidatePath("/", "layout");
  redirect(`/reglages?ok=${id ? "utilisateur-modifie" : "utilisateur"}`);
}

export async function deleteUser(id: number) {
  const me = await requireAdmin();
  const [target] = await db.select({ role: users.role }).from(users).where(eq(users.id, id)).limit(1);
  // Impossible de supprimer son propre compte ou le dernier gérant.
  if (target && id !== me.id && !(target.role === "admin" && (await adminCount(id)) === 0)) {
    await db.delete(users).where(eq(users.id, id));
  }
  revalidatePath("/reglages");
  redirect("/reglages?ok=utilisateur-supprime");
}

/* ---------- Mon mot de passe (tous les utilisateurs) ---------- */

const passwordSchema = z
  .object({
    current: z.string().min(1, "Saisissez votre mot de passe actuel."),
    next: z.string().min(8, "8 caractères minimum."),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, { path: ["confirm"], message: "Les deux mots de passe diffèrent." });

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = passwordSchema.safeParse(readFields(formData, ["current", "next", "confirm"]));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const [row] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, user.id));
  if (!row || !(await bcrypt.compare(parsed.data.current, row.hash))) {
    return { errors: { current: "Mot de passe actuel incorrect." } };
  }

  await db
    .update(users)
    .set({ passwordHash: await bcrypt.hash(parsed.data.next, 12) })
    .where(eq(users.id, user.id));
  redirect("/reglages?ok=mot-de-passe");
}
