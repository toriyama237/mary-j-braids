"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useTransition } from "react";

/** Bouton de suppression avec confirmation native. */
export function ConfirmDelete({
  action,
  message,
  label = "Supprimer",
}: {
  action: () => Promise<void>;
  message: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={label}
      title={label}
      onClick={() => {
        if (confirm(message)) startTransition(() => action());
      }}
      className="grid size-9 shrink-0 place-items-center rounded-lg text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </button>
  );
}
