"use client";

import { Pencil, Plus, X } from "lucide-react";
import { useActionState, useOptimistic, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";
import { AUDIENCE_LABELS, formatFCFA } from "@/lib/format";
import { changePassword, saveService, saveThreshold, toggleService, type FormState } from "./actions";

type Service = {
  id: number;
  name: string;
  audience: "femme" | "homme" | "mixte";
  defaultPrice: number;
  active: boolean;
};

export function ServiceRow({ service, index }: { service: Service; index: number }) {
  const [editing, setEditing] = useState(false);
  const [active, setActive] = useOptimistic(service.active);
  const [, startTransition] = useTransition();

  if (editing) {
    return (
      <li>
        <ServiceForm service={service} onClose={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li
      style={{ "--i": index } as React.CSSProperties}
      className={cn(
        "flex animate-fade-up items-center gap-3 px-5 py-3 transition-opacity stagger",
        !active && "opacity-50",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{service.name}</p>
        <p className="text-xs text-stone-500">
          {AUDIENCE_LABELS[service.audience]} · {formatFCFA(service.defaultPrice)}
        </p>
      </div>
      <label
        className="flex cursor-pointer items-center gap-2 text-xs text-stone-500"
        title={active ? "Proposé" : "Masqué"}
      >
        <span className="hidden sm:inline">{active ? "Proposé" : "Masqué"}</span>
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => {
            const next = e.target.checked;
            startTransition(async () => {
              setActive(next);
              await toggleService(service.id, next);
            });
          }}
          className="peer sr-only"
          aria-label={`Proposer ${service.name}`}
        />
        <span className="relative h-6 w-10 rounded-full bg-stone-300 transition-colors peer-checked:bg-brand-600 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" />
      </label>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="grid size-9 place-items-center rounded-lg text-stone-400 hover:bg-sand hover:text-stone-700"
        aria-label={`Modifier ${service.name}`}
      >
        <Pencil className="size-4" />
      </button>
    </li>
  );
}

export function NewService() {
  const [open, setOpen] = useState(false);
  if (open) return <ServiceForm onClose={() => setOpen(false)} />;
  return (
    <div className="p-4">
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Ajouter un service
      </Button>
    </div>
  );
}

function ServiceForm({ service, onClose }: { service?: Service; onClose: () => void }) {
  const [state, formAction] = useActionState<FormState, FormData>(
    saveService.bind(null, service?.id ?? null),
    {},
  );
  const e = state.errors ?? {};
  const v = state.values ?? {
    name: service?.name ?? "",
    audience: service?.audience ?? "mixte",
    defaultPrice: service ? String(service.defaultPrice) : "",
  };

  return (
    <form action={formAction} noValidate className="m-3 animate-scale-in space-y-4 rounded-xl bg-cream p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{service ? "Modifier le service" : "Nouveau service"}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="text-stone-400 hover:text-stone-700"
        >
          <X className="size-5" />
        </button>
      </div>
      <Field label="Nom" id="name" defaultValue={v.name} error={e.name} />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Clientèle" id="audience" defaultValue={v.audience} error={e.audience}>
          <option value="femme">Femme</option>
          <option value="homme">Homme</option>
          <option value="mixte">Mixte</option>
        </Select>
        <Field
          label="Prix (FCFA)"
          id="defaultPrice"
          type="number"
          inputMode="numeric"
          min={0}
          step={500}
          defaultValue={v.defaultPrice}
          error={e.defaultPrice}
        />
      </div>
      <SubmitButton className="w-full">Enregistrer</SubmitButton>
    </form>
  );
}

export function ThresholdForm({ threshold }: { threshold: number }) {
  const [state, formAction] = useActionState<FormState, FormData>(saveThreshold, {});
  return (
    <form action={formAction} noValidate className="flex items-end gap-3">
      <Field
        label="Passages pour une prestation offerte"
        id="threshold"
        type="number"
        inputMode="numeric"
        min={2}
        max={50}
        defaultValue={state.values?.threshold ?? threshold}
        error={state.errors?.threshold}
        className="flex-1"
      />
      <SubmitButton variant="secondary" className="h-12">
        Valider
      </SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction] = useActionState<FormState, FormData>(changePassword, {});
  const e = state.errors ?? {};
  return (
    <form action={formAction} noValidate className="space-y-4">
      <Field
        label="Mot de passe actuel"
        id="current"
        type="password"
        autoComplete="current-password"
        error={e.current}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nouveau mot de passe"
          id="next"
          type="password"
          autoComplete="new-password"
          error={e.next}
          hint="8 caractères minimum."
        />
        <Field label="Confirmer" id="confirm" type="password" autoComplete="new-password" error={e.confirm} />
      </div>
      <SubmitButton variant="secondary">Changer le mot de passe</SubmitButton>
    </form>
  );
}
