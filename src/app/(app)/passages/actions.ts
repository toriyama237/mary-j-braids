"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { clients, services, visits } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getLoyalty } from "@/lib/loyalty";

type VisitField =
  "client" | "name" | "phone" | "gender" | "service" | "customService" | "price" | "date" | "paymentMethod";

export type VisitFormState = { errors?: Partial<Record<VisitField, string>> };

const visitSchema = z.object({
  price: z.coerce
    .number({ error: "Prix invalide." })
    .int("Prix invalide.")
    .min(0, "Prix invalide.")
    .max(1_000_000),
  date: z.iso.date("Date invalide."),
  paymentMethod: z.enum(["especes", "orange_money", "mtn_momo"], {
    error: "Choisissez le mode de paiement.",
  }),
  note: z
    .string()
    .trim()
    .max(500)
    .transform((v) => v || null),
});

const newClientSchema = z.object({
  name: z.string().trim().min(2, "Indiquez le nom du client."),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || v.replace(/\D/g, "").length >= 9, "Numéro trop court.")
    .transform((v) => v || null),
  gender: z.enum(["F", "H"], { error: "Précisez homme ou femme." }),
});

/** Champs communs (prix, date, paiement, service) aux formulaires de création et de modification. */
function readVisit(formData: FormData, isFree: boolean) {
  const get = (k: string) => String(formData.get(k) ?? "");
  const errors: VisitFormState["errors"] = {};

  const visit = visitSchema.safeParse({
    price: isFree ? 0 : get("price"),
    date: get("date"),
    paymentMethod: isFree ? "especes" : get("paymentMethod"),
    note: get("note"),
  });
  if (!visit.success) {
    for (const issue of visit.error.issues) errors[issue.path[0] as VisitField] ??= issue.message;
  }

  // Service du catalogue, ou nom saisi librement quand il n'y figure pas.
  const custom = get("serviceMode") === "custom";
  const serviceId = Number(get("serviceId")) || 0;
  const customName = get("customService").trim().replace(/\s+/g, " ");
  if (custom && customName.length < 2) errors.customService = "Indiquez le nom du service.";
  if (!custom && !serviceId) errors.service = "Choisissez un service ou saisissez-en un.";

  return { errors, visit, service: custom ? { name: customName.slice(0, 100) } : { id: serviceId } };
}

/** Retrouve le service (par id, ou par nom pour un service saisi) ; crée ce dernier s'il est nouveau. */
async function resolveService(service: { id: number } | { name: string }, price: number) {
  if ("id" in service) {
    const [row] = await db
      .select({ id: services.id })
      .from(services)
      .where(and(eq(services.id, service.id), eq(services.active, true)));
    return row?.id ?? null;
  }
  const [existing] = await db
    .select({ id: services.id, active: services.active })
    .from(services)
    .where(sql`LOWER(${services.name}) = ${service.name.toLowerCase()}`)
    .limit(1);
  if (existing) {
    if (!existing.active) await db.update(services).set({ active: true }).where(eq(services.id, existing.id));
    return existing.id;
  }
  const [{ id }] = await db
    .insert(services)
    .values({ name: service.name, audience: "mixte", defaultPrice: price })
    .$returningId();
  return id;
}

export async function createVisit(_prev: VisitFormState, formData: FormData): Promise<VisitFormState> {
  const user = await requireUser();
  const get = (k: string) => String(formData.get(k) ?? "");
  const isFree = get("isFree") === "1";
  const { errors, visit, service } = readVisit(formData, isFree);

  // Client existant, ou nouveau client saisi dans le même formulaire.
  let clientId = Number(get("clientId")) || 0;
  let newClient: z.infer<typeof newClientSchema> | null = null;
  if (get("mode") === "new") {
    const parsed = newClientSchema.safeParse({
      name: get("name"),
      phone: get("phone"),
      gender: get("gender"),
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) errors[issue.path[0] as VisitField] ??= issue.message;
    } else {
      newClient = parsed.data;
      if (newClient.phone) {
        const [dup] = await db
          .select({ id: clients.id })
          .from(clients)
          .where(eq(clients.phone, newClient.phone));
        if (dup) errors.phone = "Ce numéro appartient déjà à un client : sélectionnez-le dans la liste.";
      }
    }
  } else if (!clientId) {
    errors.client = "Choisissez un client ou créez-en un nouveau.";
  }

  if (Object.keys(errors).length > 0 || !visit.success) return { errors };

  if (!newClient && isFree && !(await getLoyalty(clientId)).eligible) {
    return { errors: { client: "Ce client n'a pas encore droit à la prestation offerte." } };
  }
  const serviceId = await resolveService(service, visit.data.price);
  if (!serviceId) return { errors: { service: "Ce service n'existe plus." } };
  if (newClient) [{ id: clientId }] = await db.insert(clients).values(newClient).$returningId();

  await db.insert(visits).values({ ...visit.data, isFree, serviceId, clientId, createdBy: user.id });
  revalidatePath("/", "layout");
  redirect(`/clients/${clientId}?ok=${isFree ? "offert" : "passage"}`);
}

/** Modification d'un passage : le client et le statut « offert » ne changent pas. */
export async function updateVisit(
  id: number,
  returnTo: string,
  _prev: VisitFormState,
  formData: FormData,
): Promise<VisitFormState> {
  await requireUser();
  const [current] = await db.select({ isFree: visits.isFree }).from(visits).where(eq(visits.id, id)).limit(1);
  if (!current) redirect(safeReturn(returnTo));

  const { errors, visit, service } = readVisit(formData, current.isFree);
  if (Object.keys(errors).length > 0 || !visit.success) return { errors };

  const serviceId = await resolveService(service, visit.data.price);
  if (!serviceId) return { errors: { service: "Ce service n'existe plus." } };

  await db
    .update(visits)
    .set({ ...visit.data, serviceId })
    .where(eq(visits.id, id));
  revalidatePath("/", "layout");
  redirect(withOk(returnTo, "passage-modifie"));
}

export async function deleteVisit(id: number, returnTo: string) {
  await requireUser();
  await db.delete(visits).where(eq(visits.id, id));
  revalidatePath("/", "layout");
  redirect(withOk(returnTo, "passage-supprime"));
}

/** Seules les URL internes sont acceptées comme destination de retour. */
function safeReturn(returnTo: string) {
  return returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
}

function withOk(returnTo: string, ok: string) {
  const url = new URL(safeReturn(returnTo), "http://local");
  url.searchParams.set("ok", ok);
  return `${url.pathname}${url.search}`;
}
