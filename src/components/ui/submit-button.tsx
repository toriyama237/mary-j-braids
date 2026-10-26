"use client";

import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./button";

/** Bouton d'envoi qui affiche un indicateur pendant l'enregistrement. */
export function SubmitButton({
  children,
  pendingLabel = "Enregistrement…",
  ...props
}: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending && <LoaderCircle className="size-5 animate-spin" />}
      {pending ? pendingLabel : children}
    </Button>
  );
}
