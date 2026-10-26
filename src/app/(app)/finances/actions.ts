"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export type ExpenseFormState = {
  errors?: Partial<Record<"label" | "amount" | "date" | "category", string>>;
  values?: Record<string, string>;
};

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

export async function createExpense(
  returnTo: string,
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  await requireUser();
  const values = Object.fromEntries(
    ["label", "amount", "date", "category"].map((k) => [k, String(formData.get(k) ?? "")]),
  );
  const parsed = expenseSchema.safeParse(values);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error).fieldErrors as Record<string, string[] | undefined>;
    return { errors: Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0]])), values };
  }

  await db.insert(expenses).values(parsed.data);
  revalidatePath("/finances");
  redirect(withOk(returnTo, "depense"));
}

export async function deleteExpense(id: number, returnTo: string) {
  await requireUser();
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
