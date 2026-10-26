"use client";

import { Pencil, Plus, ReceiptText, X } from "lucide-react";
import { useActionState, useState } from "react";
import { deleteExpense, saveExpense } from "@/app/(app)/finances/actions";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { EXPENSE_LABELS, formatFCFA, formatShortDate } from "@/lib/format";
import type { FormState } from "@/lib/form";

type Expense = {
  id: number;
  label: string;
  amount: number;
  date: string;
  category: keyof typeof EXPENSE_LABELS;
};

/** Bouton « Ajouter une dépense » qui déplie le formulaire. */
export function NewExpense({ returnTo, today }: { returnTo: string; today: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)} className="w-full">
        <Plus className="size-4" /> Ajouter une dépense
      </Button>
    );
  }
  return <ExpenseForm returnTo={returnTo} today={today} onClose={() => setOpen(false)} />;
}

/** Ligne de dépense, modifiable sur place. */
export function ExpenseRow({
  expense,
  returnTo,
  today,
}: {
  expense: Expense;
  returnTo: string;
  today: string;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="p-3">
        <ExpenseForm expense={expense} returnTo={returnTo} today={today} onClose={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 py-2.5 pr-3 pl-5">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-red-50 text-red-600">
        <ReceiptText className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{expense.label}</span>
        <span className="text-xs text-stone-500">
          {EXPENSE_LABELS[expense.category]} · {formatShortDate(expense.date)}
        </span>
      </span>
      <span className="text-sm font-semibold whitespace-nowrap">{formatFCFA(expense.amount)}</span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Modifier cette dépense"
        title="Modifier"
        className="grid size-9 shrink-0 place-items-center rounded-lg text-stone-400 transition-colors hover:bg-sand hover:text-stone-700"
      >
        <Pencil className="size-4" />
      </button>
      <ConfirmDelete
        action={deleteExpense.bind(null, expense.id, returnTo)}
        message={`Supprimer la dépense « ${expense.label} » ?`}
        label="Supprimer cette dépense"
      />
    </li>
  );
}

function ExpenseForm({
  expense,
  returnTo,
  today,
  onClose,
}: {
  expense?: Expense;
  returnTo: string;
  today: string;
  onClose: () => void;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    saveExpense.bind(null, expense?.id ?? null, returnTo),
    {},
  );
  const e = state.errors ?? {};
  const v = state.values ?? {
    label: expense?.label ?? "",
    amount: expense ? String(expense.amount) : "",
    date: expense?.date ?? today,
    category: expense?.category ?? "produits",
  };

  return (
    <form action={formAction} noValidate className="animate-scale-in space-y-4 rounded-xl bg-cream p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{expense ? "Modifier la dépense" : "Nouvelle dépense"}</p>
        <button
          type="button"
          onClick={onClose}
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
        <Field label="Date" id="date" type="date" max={today} defaultValue={v.date} error={e.date} />
      </div>
      <Select label="Catégorie" id="category" defaultValue={v.category} error={e.category}>
        {Object.entries(EXPENSE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <SubmitButton className="w-full">{expense ? "Enregistrer" : "Enregistrer la dépense"}</SubmitButton>
    </form>
  );
}
