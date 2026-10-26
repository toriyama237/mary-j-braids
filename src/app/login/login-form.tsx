"use client";

import { CircleAlert, LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </p>
      )}

      <Field
        label="Identifiant"
        id="username"
        name="username"
        autoComplete="username"
        autoCapitalize="none"
        defaultValue={state.username}
        placeholder="ex. mary"
        required
      />
      <Field
        label="Mot de passe"
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />

      <Button type="submit" disabled={pending} className="h-12 w-full text-base">
        {pending && <LoaderCircle className="size-5 animate-spin" />}
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
