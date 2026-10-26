"use client";

import { Pencil, ShieldCheck, UserPlus, X } from "lucide-react";
import { useActionState, useState } from "react";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Button } from "@/components/ui/button";
import { Field, Segmented } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import type { FormState } from "@/lib/form";
import { deleteUser, saveUser } from "./actions";

type Role = "admin" | "staff";
type User = { id: number; name: string; username: string; role: Role };

export const ROLE_LABELS: Record<Role, string> = { admin: "Gérant", staff: "Employé" };

export function UserRow({ user, isMe, index }: { user: User; isMe: boolean; index: number }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li>
        <UserForm user={user} isMe={isMe} onClose={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li
      style={{ "--i": index } as React.CSSProperties}
      className="flex animate-fade-up items-center gap-3 px-5 py-3 stagger"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
        {initials(user.name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {user.name}
          {isMe && <span className="ml-1.5 text-xs font-normal text-stone-400">(vous)</span>}
        </p>
        <p className="truncate text-xs text-stone-500">@{user.username}</p>
      </div>
      <span
        className={cn(
          "hidden items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex",
          user.role === "admin" ? "bg-brand-50 text-brand-700" : "bg-stone-100 text-stone-600",
        )}
      >
        {user.role === "admin" && <ShieldCheck className="size-3.5" />}
        {ROLE_LABELS[user.role]}
      </span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="grid size-9 place-items-center rounded-lg text-stone-400 hover:bg-sand hover:text-stone-700"
        aria-label={`Modifier ${user.name}`}
      >
        <Pencil className="size-4" />
      </button>
      {isMe ? (
        <span className="size-9" aria-hidden />
      ) : (
        <ConfirmDelete
          action={deleteUser.bind(null, user.id)}
          message={`Supprimer le compte de ${user.name} ? Ses passages enregistrés sont conservés.`}
          label={`Supprimer ${user.name}`}
        />
      )}
    </li>
  );
}

export function NewUser() {
  const [open, setOpen] = useState(false);
  if (open) return <UserForm onClose={() => setOpen(false)} />;
  return (
    <div className="p-4">
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        <UserPlus className="size-4" /> Ajouter un utilisateur
      </Button>
    </div>
  );
}

function UserForm({ user, isMe, onClose }: { user?: User; isMe?: boolean; onClose: () => void }) {
  const [state, formAction] = useActionState<FormState, FormData>(saveUser.bind(null, user?.id ?? null), {});
  const e = state.errors ?? {};
  const v = state.values ?? {
    name: user?.name ?? "",
    username: user?.username ?? "",
    role: user?.role ?? "staff",
  };

  return (
    <form action={formAction} noValidate className="m-3 animate-scale-in space-y-4 rounded-xl bg-cream p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{user ? `Modifier ${user.name}` : "Nouvel utilisateur"}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="text-stone-400 hover:text-stone-700"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" id="name" defaultValue={v.name} error={e.name} autoComplete="off" />
        <Field
          label="Identifiant de connexion"
          id="username"
          defaultValue={v.username}
          error={e.username}
          autoCapitalize="none"
          autoComplete="off"
        />
      </div>
      {isMe ? (
        <input type="hidden" name="role" value="admin" />
      ) : (
        <Segmented<Role>
          name="role"
          label="Rôle"
          defaultValue={v.role as Role}
          error={e.role}
          options={[
            { value: "staff", label: "Employé" },
            { value: "admin", label: "Gérant" },
          ]}
        />
      )}
      <p className="-mt-2 text-xs text-stone-500">
        Employé : clients et passages. Gérant : en plus, finances, réglages et utilisateurs.
      </p>
      <Field
        label={user ? "Nouveau mot de passe" : "Mot de passe"}
        id="password"
        type="password"
        autoComplete="new-password"
        error={e.password}
        hint={user ? "Laissez vide pour le conserver." : "8 caractères minimum."}
      />
      <SubmitButton className="w-full">{user ? "Enregistrer" : "Créer le compte"}</SubmitButton>
    </form>
  );
}
