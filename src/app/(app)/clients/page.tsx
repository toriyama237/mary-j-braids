import { ChevronRight, UserPlus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoyaltyMeter } from "@/components/loyalty-card";
import { SearchBox } from "@/components/search-box";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatShortDate, initials, plural } from "@/lib/format";
import { listClients } from "@/lib/queries/clients";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage({ searchParams }: PageProps<"/clients">) {
  const { q } = await searchParams;
  const search = typeof q === "string" ? q : undefined;
  const { clients, threshold } = await listClients(search);

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle={
          search
            ? `${plural(clients.length, "résultat")} pour « ${search} »`
            : plural(clients.length, "client")
        }
        actions={
          <ButtonLink href="/clients/nouveau" className="w-full sm:w-auto">
            <UserPlus className="size-5" />
            Nouveau client
          </ButtonLink>
        }
      />

      <div className="mb-4">
        <Suspense>
          <SearchBox placeholder="Rechercher par nom ou téléphone" />
        </Suspense>
      </div>

      <Card className="overflow-hidden">
        {clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? "Aucun client trouvé" : "Aucun client pour l'instant"}
            text={
              search
                ? "Vérifiez l'orthographe ou ajoutez ce client."
                : "Ajoutez votre premier client pour commencer."
            }
            action={
              <ButtonLink href="/clients/nouveau">
                <UserPlus className="size-5" /> Ajouter un client
              </ButtonLink>
            }
          />
        ) : (
          <ul className="divide-y divide-stone-100">
            {clients.map((c, i) => (
              <li
                key={c.id}
                style={{ "--i": Math.min(i, 12) } as React.CSSProperties}
                className="animate-fade-up stagger"
              >
                <Link
                  href={`/clients/${c.id}`}
                  className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-cream sm:px-5"
                >
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                      c.gender === "F" ? "bg-brand-50 text-brand-700" : "bg-sky-50 text-sky-800"
                    }`}
                  >
                    {initials(c.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="truncate text-sm text-stone-500">
                      {c.phone ?? "Pas de téléphone"}
                      <span className="hidden sm:inline">
                        {" · "}
                        {c.lastVisit ? `Dernier passage ${formatShortDate(c.lastVisit)}` : "Jamais venu"}
                      </span>
                    </p>
                  </div>
                  <div className="hidden text-right text-sm text-stone-500 md:block">
                    {plural(c.visits, "passage")}
                  </div>
                  <LoyaltyMeter stamps={c.stamps} threshold={threshold} />
                  <ChevronRight className="size-5 text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-stone-500" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
