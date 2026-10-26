"use client";

import { Plus, X } from "lucide-react";
import { useActionState, useState } from "react";
import { createExpense, type ExpenseFormState } from "@/app/(app)/finances/actions";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { EXPENSE_LABELS } from "@/lib/format";

export function ExpenseForm({ returnTo, today }: { returnTo: string; today: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ExpenseFormState, FormData>(
    createExpense.bind(null, returnTo),
    {},
  );
  const e = state.errors ?? {};
  const v = state.values ?? {};

  if (!open && !state.errors) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)} className="w-full">
        <Plus className="size-4" /> Ajouter une dépense
      </Button>
    );
  }

  return (
    <form action={formAction} noValidate className="animate-scale-in space-y-4 rounded-xl bg-cream p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Nouvelle dépense</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fermer"
          className="text-stone-400 hover:text-stone-700"
        >
          <X className="size-5" />
        </button>
      </div>
      <Field
        label="Libellé"
        id="label"
        placeholder="ex. Mèches X-pression"
        defaultValue={v.label}
        error={e.label}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Montant (FCFA)"
          id="amount"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={v.amount}
          error={e.amount}
        />
        <Field label="Date" id="date" type="date" max={today} defaultValue={v.date || today} error={e.date} />
      </div>
      <Select label="Catégorie" id="category" defaultValue={v.category || "produits"} error={e.category}>
        {Object.entries(EXPENSE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <SubmitButton className="w-full">Enregistrer la dépense</SubmitButton>
    </form>
  );
}
