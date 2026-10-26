"use client";

import { CircleAlert, LoaderCircle, Timer } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  // Compte à rebours pendant le blocage, réinitialisé à chaque nouvelle réponse du serveur.
  const [wait, setWait] = useState(0);
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    setWait(state.retryAfter ?? 0);
  }
  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const locked = wait > 0;
  const countdown = `${Math.floor(wait / 60)}:${String(wait % 60).padStart(2, "0")}`;

  return (
    <form action={formAction} className="space-y-5">
      {locked ? (
        <p
          role="alert"
          className="flex animate-fade-in items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          <Timer className="mt-0.5 size-4 shrink-0" />
          <span>
            Trop de tentatives. Réessayez dans <b className="tabular-nums">{countdown}</b>.
          </span>
        </p>
      ) : (
        state.error &&
        !state.retryAfter && (
          <p
            role="alert"
            className="flex animate-fade-in items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {state.error}
          </p>
        )
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

      <Button type="submit" disabled={pending || locked} className="h-12 w-full text-base">
        {pending && <LoaderCircle className="size-5 animate-spin" />}
        {pending ? "Connexion…" : locked ? `Patientez ${countdown}` : "Se connecter"}
      </Button>
    </form>
  );
}
