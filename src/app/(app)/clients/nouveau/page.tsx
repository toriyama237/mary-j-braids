import type { Metadata } from "next";
import { ClientForm } from "@/components/client-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth";
import { createClient } from "../actions";

export const metadata: Metadata = { title: "Nouveau client" };

export default async function NewClientPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Nouveau client" back={{ href: "/clients", label: "Clients" }} />
      <ClientForm action={createClient} cancelHref="/clients" submitLabel="Créer le client" />
    </div>
  );
}
