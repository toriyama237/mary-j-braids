import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientForm } from "@/components/client-form";
import { PageHeader } from "@/components/ui/page-header";
import { getClientDetail } from "@/lib/queries/clients";
import { updateClient } from "../../actions";

export const metadata: Metadata = { title: "Modifier le client" };

export default async function EditClientPage({ params }: PageProps<"/clients/[id]/modifier">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const { client } = await getClientDetail(id);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Modifier la fiche" back={{ href: `/clients/${id}`, label: client.name }} />
      <ClientForm
        action={updateClient.bind(null, id)}
        cancelHref={`/clients/${id}`}
        submitLabel="Enregistrer"
        initial={{
          name: client.name,
          phone: client.phone ?? "",
          gender: client.gender,
          birthday: client.birthday ?? "",
          notes: client.notes ?? "",
        }}
      />
    </div>
  );
}
