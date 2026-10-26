import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Page introuvable"
      text="Ce client ou cette page n'existe pas (ou plus)."
      action={<ButtonLink href="/">Retour à l&apos;accueil</ButtonLink>}
    />
  );
}
