"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { clients, visits } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export type ClientFormState = {
  errors?: Partial<Record<"name" | "phone" | "gender" | "birthday", string>>;
  values?: Record<string, string>;
};

const clientSchema = z.object({
  name: z.string().trim().min(2, "Indiquez le nom du client.").max(120),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v === "" || v.replace(/\D/g, "").length >= 9, "Numéro trop court.")
    .transform((v) => v || null),
  gender: z.enum(["F", "H"], { error: "Précisez homme ou femme." }),
  birthday: z
    .string()
    .trim()
    .transform((v) => v || null),
  notes: z
    .string()
    .trim()
    .max(2000)
    .transform((v) => v || null),
});

function readForm(formData: FormData) {
  const values = Object.fromEntries(
    ["name", "phone", "gender", "birthday", "notes"].map((k) => [k, String(formData.get(k) ?? "")]),
  );
  return { values, parsed: clientSchema.safeParse(values) };
}

async function phoneTaken(phone: string | null, exceptId?: number) {
  if (!phone) return false;
  const [row] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(exceptId ? and(eq(clients.phone, phone), ne(clients.id, exceptId)) : eq(clients.phone, phone))
    .limit(1);
  return !!row;
}

function fieldErrors(error: z.ZodError) {
  const flat = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  return Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0]]));
}

export async function createClient(_prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  await requireUser();
  const { values, parsed } = readForm(formData);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  if (await phoneTaken(parsed.data.phone)) {
    return { errors: { phone: "Ce numéro appartient déjà à un client." }, values };
  }

  const [{ id }] = await db.insert(clients).values(parsed.data).$returningId();
  revalidatePath("/", "layout");
  redirect(`/clients/${id}?ok=client`);
}

export async function updateClient(
  id: number,
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  await requireUser();
  const { values, parsed } = readForm(formData);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  if (await phoneTaken(parsed.data.phone, id)) {
    return { errors: { phone: "Ce numéro appartient déjà à un autre client." }, values };
  }

  await db.update(clients).set(parsed.data).where(eq(clients.id, id));
  revalidatePath("/", "layout");
  redirect(`/clients/${id}?ok=client-modifie`);
}

/** Supprime le client et tout son historique de passages. */
export async function deleteClient(id: number) {
  await requireUser();
  await db.delete(visits).where(eq(visits.clientId, id));
  await db.delete(clients).where(eq(clients.id, id));
  revalidatePath("/", "layout");
  redirect("/clients?ok=client-supprime");
}
