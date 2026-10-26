"use client";

import { useActionState } from "react";
import type { ClientFormState } from "@/app/(app)/clients/actions";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Segmented, TextArea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

type Action = (prev: ClientFormState, formData: FormData) => Promise<ClientFormState>;

export function ClientForm({
  action,
  initial,
  cancelHref,
  submitLabel,
}: {
  action: Action;
  initial?: Partial<Record<"name" | "phone" | "gender" | "birthday" | "notes", string>>;
  cancelHref: string;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const v = state.values ?? initial ?? {};
  const e = state.errors ?? {};

  return (
    <form action={formAction} noValidate>
      <Card className="space-y-5 p-5 sm:p-6">
        <Field
          label="Nom complet"
          id="name"
          defaultValue={v.name}
          error={e.name}
          autoComplete="off"
          required
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Téléphone"
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder="6XX XX XX XX"
            defaultValue={v.phone}
            error={e.phone}
            hint="Sert à retrouver le client et à lui écrire sur WhatsApp."
          />
          <Field
            label="Date d'anniversaire"
            id="birthday"
            type="date"
            defaultValue={v.birthday}
            error={e.birthday}
            hint="Facultatif, pour lui souhaiter."
          />
        </div>
        <Segmented
          name="gender"
          label="Client"
          defaultValue={v.gender as "F" | "H" | undefined}
          error={e.gender}
          options={[
            { value: "F", label: "Femme" },
            { value: "H", label: "Homme" },
          ]}
        />
        <TextArea
          label="Notes"
          id="notes"
          defaultValue={v.notes}
          placeholder="Préférences, allergies, coiffeuse habituelle…"
        />
      </Card>
      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <ButtonLink href={cancelHref} variant="secondary">
          Annuler
        </ButtonLink>
        <SubmitButton className="sm:min-w-44">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
