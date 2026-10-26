"use client";

import { CircleCheck } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/** Messages affichés après une action : la redirection ajoute ?ok=<clé>. */
const MESSAGES: Record<string, string> = {
  passage: "Passage enregistré",
  offert: "Prestation offerte enregistrée — carte de fidélité remise à zéro",
  client: "Client enregistré",
  "client-modifie": "Fiche client mise à jour",
  "passage-supprime": "Passage supprimé",
  depense: "Dépense enregistrée",
  "depense-supprimee": "Dépense supprimée",
  service: "Catalogue mis à jour",
  fidelite: "Seuil de fidélité mis à jour",
  "mot-de-passe": "Mot de passe modifié",
};

export function Toast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const key = params.get("ok");
  const [message, setMessage] = useState<string | null>(null);
  const [seenKey, setSeenKey] = useState<string | null>(null);

  // Nouveau ?ok= reçu : on affiche le message (ajustement d'état pendant le rendu).
  if (key !== seenKey) {
    setSeenKey(key);
    if (key && MESSAGES[key]) setMessage(MESSAGES[key]);
  }

  useEffect(() => {
    if (!key || !MESSAGES[key]) return;
    // Retire le paramètre de l'URL sans recharger la page.
    const rest = new URLSearchParams(params);
    rest.delete("ok");
    router.replace(rest.size ? `${pathname}?${rest}` : pathname, { scroll: false });
  }, [key, params, pathname, router]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-md animate-toast-in items-center gap-3 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-xl lg:inset-x-auto lg:top-auto lg:right-6 lg:bottom-6"
    >
      <CircleCheck className="size-5 shrink-0 text-emerald-400" />
      {message}
    </div>
  );
}
