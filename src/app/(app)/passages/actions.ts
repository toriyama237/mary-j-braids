"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { clients, services, visits } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getLoyalty } from "@/lib/loyalty";

export type VisitFormState = {
  errors?: Partial<
    Record<"client" | "name" | "phone" | "gender" | "service" | "price" | "date" | "paymentMethod", string>
  >;
};

const visitSchema = z.object({
  serviceId: z.coerce.number({ error: "Choisissez un service." }).int().positive("Choisissez un service."),
  price: z.coerce
    .number({ error: "Prix invalide." })
    .int("Prix invalide.")
    .min(0, "Prix invalide.")
    .max(1_000_000),
  date: z.iso.date("Date invalide."),
  paymentMethod: z.enum(["especes", "orange_money", "mtn_momo"], {
    error: "Choisissez le mode de paiement.",
  }),
  isFree: z.boolean(),
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

export async function createVisit(_prev: VisitFormState, formData: FormData): Promise<VisitFormState> {
  const user = await requireUser();
  const get = (k: string) => String(formData.get(k) ?? "");
  const isFree = get("isFree") === "1";
  const errors: VisitFormState["errors"] = {};

  const visit = visitSchema.safeParse({
    serviceId: get("serviceId") || 0,
    price: isFree ? 0 : get("price"),
    date: get("date"),
    paymentMethod: isFree ? "especes" : get("paymentMethod"),
    isFree,
    note: get("note"),
  });
  if (!visit.success) {
    for (const issue of visit.error.issues) {
      const key = issue.path[0] === "serviceId" ? "service" : (issue.path[0] as keyof typeof errors);
      errors[key] ??= issue.message;
    }
  }

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
      for (const issue of parsed.error.issues)
        errors[issue.path[0] as "name" | "phone" | "gender"] ??= issue.message;
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

  const [service] = await db
    .select({ id: services.id })
    .from(services)
    .where(and(eq(services.id, visit.data.serviceId), eq(services.active, true)));
  if (!service) return { errors: { service: "Ce service n'existe plus." } };

  if (newClient) {
    [{ id: clientId }] = await db.insert(clients).values(newClient).$returningId();
  } else if (isFree && !(await getLoyalty(clientId)).eligible) {
    return { errors: { client: "Ce client n'a pas encore droit à la prestation offerte." } };
  }

  await db.insert(visits).values({ ...visit.data, clientId, createdBy: user.id });
  revalidatePath("/", "layout");
  redirect(`/clients/${clientId}?ok=${isFree ? "offert" : "passage"}`);
}
