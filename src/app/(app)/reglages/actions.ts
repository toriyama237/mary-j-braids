"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { services, settings, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export type FormState = { errors?: Record<string, string | undefined>; values?: Record<string, string> };

const serviceSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court.").max(100),
  audience: z.enum(["femme", "homme", "mixte"], { error: "Choisissez la clientèle." }),
  defaultPrice: z.coerce
    .number({ error: "Prix invalide." })
    .int("Prix invalide.")
    .min(0, "Prix invalide.")
    .max(1_000_000),
});

function errorsOf(error: z.ZodError) {
  const flat = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  return Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0]]));
}

function readService(formData: FormData) {
  const values = Object.fromEntries(
    ["name", "audience", "defaultPrice"].map((k) => [k, String(formData.get(k) ?? "")]),
  );
  return { values, parsed: serviceSchema.safeParse(values) };
}

export async function saveService(
  id: number | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const { values, parsed } = readService(formData);
  if (!parsed.success) return { errors: errorsOf(parsed.error), values };

  if (id) await db.update(services).set(parsed.data).where(eq(services.id, id));
  else await db.insert(services).values(parsed.data);
  revalidatePath("/", "layout");
  redirect("/reglages?ok=service");
}

/** Désactiver plutôt que supprimer : l'historique des passages garde le service. */
export async function toggleService(id: number, active: boolean) {
  await requireUser();
  await db.update(services).set({ active }).where(eq(services.id, id));
  revalidatePath("/", "layout");
}

export async function saveThreshold(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
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

const passwordSchema = z
  .object({
    current: z.string().min(1, "Saisissez votre mot de passe actuel."),
    next: z.string().min(8, "8 caractères minimum."),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, { path: ["confirm"], message: "Les deux mots de passe diffèrent." });

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = passwordSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { errors: errorsOf(parsed.error) };

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
