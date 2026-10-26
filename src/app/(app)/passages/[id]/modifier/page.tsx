import { asc, eq, or } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/db";
import { clients, services, visits } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { todayISO } from "@/lib/format";
import { VisitForm } from "../../nouveau/visit-form";

export const metadata: Metadata = { title: "Modifier le passage" };

export default async function EditVisitPage({ params, searchParams }: PageProps<"/passages/[id]/modifier">) {
  await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const [visit] = await db
    .select({
      id: visits.id,
      clientId: visits.clientId,
      clientName: clients.name,
      serviceId: visits.serviceId,
      price: visits.price,
      date: visits.date,
      paymentMethod: visits.paymentMethod,
      note: visits.note,
      isFree: visits.isFree,
    })
    .from(visits)
    .innerJoin(clients, eq(visits.clientId, clients.id))
    .where(eq(visits.id, id))
    .limit(1);
  if (!visit) notFound();

  // Le service actuel reste proposé même s'il a été masqué depuis.
  const catalogue = await db
    .select({
      id: services.id,
      name: services.name,
      audience: services.audience,
      defaultPrice: services.defaultPrice,
    })
    .from(services)
    .where(or(eq(services.active, true), eq(services.id, visit.serviceId)))
    .orderBy(asc(services.name));

  const { retour } = await searchParams;
  const returnTo =
    typeof retour === "string" && retour.startsWith("/") && !retour.startsWith("//")
      ? retour
      : `/clients/${visit.clientId}`;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Modifier le passage" back={{ href: returnTo, label: "Retour" }} />
      <VisitForm
        clients={[]}
        services={catalogue}
        threshold={0}
        today={todayISO()}
        edit={{ ...visit, returnTo }}
      />
    </div>
  );
}
