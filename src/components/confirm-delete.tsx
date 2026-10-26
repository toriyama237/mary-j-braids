"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useTransition } from "react";

/** Bouton de suppression avec confirmation native. */
export function ConfirmDelete({
  action,
  message,
  label = "Supprimer",
  asButton,
}: {
  action: () => Promise<void>;
  message: string;
  label?: string;
  /** Bouton avec libellé au lieu de la simple icône corbeille. */
  asButton?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const run = () => {
    if (confirm(message)) startTransition(() => action());
  };

  if (asButton) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={run}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={label}
      title={label}
      onClick={run}
      className="grid size-9 shrink-0 place-items-center rounded-lg text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </button>
  );
}
