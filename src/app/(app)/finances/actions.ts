"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { fieldErrors, readFields, type FormState } from "@/lib/form";

const expenseSchema = z.object({
  label: z.string().trim().min(2, "Décrivez la dépense.").max(150),
  amount: z.coerce
    .number({ error: "Montant invalide." })
    .int("Montant invalide.")
    .positive("Montant invalide."),
  date: z.iso.date("Date invalide."),
  category: z.enum(["produits", "loyer", "electricite", "salaires", "autre"], {
    error: "Choisissez une catégorie.",
  }),
});

/** Crée (id = null) ou modifie une dépense. */
export async function saveExpense(
  id: number | null,
  returnTo: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = readFields(formData, ["label", "amount", "date", "category"]);
  const parsed = expenseSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  if (id) await db.update(expenses).set(parsed.data).where(eq(expenses.id, id));
  else await db.insert(expenses).values(parsed.data);
  revalidatePath("/finances");
  redirect(withOk(returnTo, id ? "depense-modifiee" : "depense"));
}

export async function deleteExpense(id: number, returnTo: string) {
  await requireAdmin();
  await db.delete(expenses).where(eq(expenses.id, id));
  revalidatePath("/finances");
  redirect(withOk(returnTo, "depense-supprimee"));
}

/** Ajoute ?ok=… à une URL interne de la page Finances (en gardant la période). */
function withOk(returnTo: string, ok: string) {
  const url = new URL(returnTo.startsWith("/finances") ? returnTo : "/finances", "http://local");
  url.searchParams.set("ok", ok);
  return `${url.pathname}${url.search}`;
}
