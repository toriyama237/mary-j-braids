import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/db";
import { services } from "@/db/schema";
import { todayISO } from "@/lib/format";
import { getLoyaltyThreshold } from "@/lib/loyalty";
import { listClientsForPicker } from "@/lib/queries/clients";
import { VisitForm } from "./visit-form";

export const metadata: Metadata = { title: "Nouveau passage" };

export default async function NewVisitPage({ searchParams }: PageProps<"/passages/nouveau">) {
  const { client } = await searchParams;
  const [clients, catalogue, threshold] = await Promise.all([
    listClientsForPicker(),
    db
      .select({
        id: services.id,
        name: services.name,
        audience: services.audience,
        defaultPrice: services.defaultPrice,
      })
      .from(services)
      .where(eq(services.active, true))
      .orderBy(asc(services.name)),
    getLoyaltyThreshold(),
  ]);
  const initialClientId = Number(client) || undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Nouveau passage" subtitle="Client, service, prix : c'est enregistré." />
      <VisitForm
        clients={clients}
        services={catalogue}
        threshold={threshold}
        today={todayISO()}
        initialClientId={clients.some((c) => c.id === initialClientId) ? initialClientId : undefined}
      />
    </div>
  );
}
