import { Cake, FileDown, MessageCircle, Pencil, Phone, Plus, Receipt, StickyNote } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmDelete } from "@/components/confirm-delete";
import { LoyaltyCard } from "@/components/loyalty-card";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  formatDate,
  formatFCFA,
  formatShortDate,
  initials,
  PAYMENT_LABELS,
  whatsappLink,
} from "@/lib/format";
import { getClientDetail } from "@/lib/queries/clients";
import { deleteVisit } from "../actions";

export const metadata: Metadata = { title: "Fiche client" };

export default async function ClientPage({ params }: PageProps<"/clients/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const { client, history, loyalty, totals } = await getClientDetail(id);

  const firstName = client.name.split(" ")[0];
  const remaining = loyalty.threshold - Math.min(loyalty.stamps, loyalty.threshold);
  const message = loyalty.eligible
    ? `Bonjour ${firstName}, bonne nouvelle : votre prochaine prestation chez Mary J Braids est offerte ! À très vite.`
    : `Bonjour ${firstName}, merci pour votre visite chez Mary J Braids ! Plus que ${remaining} passage${remaining > 1 ? "s" : ""} avant votre prestation offerte.`;

  return (
    <>
      <PageHeader
        back={{ href: "/clients", label: "Clients" }}
        title={
          <span className="flex items-center gap-4">
            <span
              className={`grid size-14 shrink-0 animate-pop place-items-center rounded-2xl font-sans text-lg font-semibold ${
                client.gender === "F" ? "bg-brand-100 text-brand-700" : "bg-sky-100 text-sky-800"
              }`}
            >
              {initials(client.name)}
            </span>
            <span className="min-w-0 truncate">{client.name}</span>
          </span>
        }
        actions={
          <>
            <ButtonLink href={`/passages/nouveau?client=${client.id}`} className="flex-1 sm:flex-none">
              <Plus className="size-5" /> Nouveau passage
            </ButtonLink>
            <ButtonLink href={`/clients/${client.id}/modifier`} variant="secondary" aria-label="Modifier">
              <Pencil className="size-4" />
              <span className="hidden sm:inline">Modifier</span>
            </ButtonLink>
            <ButtonLink
              href={`/clients/${client.id}/pdf`}
              variant="secondary"
              prefetch={false}
              target="_blank"
              aria-label="Fiche PDF"
            >
              <FileDown className="size-4" />
              <span className="hidden sm:inline">PDF</span>
            </ButtonLink>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr] lg:gap-6">
        <div className="space-y-4">
          <LoyaltyCard stamps={loyalty.stamps} threshold={loyalty.threshold} />

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <p className="text-xs text-stone-500">Total dépensé</p>
              <p className="mt-1 font-display text-lg font-semibold">{formatFCFA(totals.spent)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-stone-500">Passages</p>
              <p className="mt-1 font-display text-lg font-semibold">{totals.visits}</p>
            </Card>
          </div>

          <Card className="space-y-3 p-5">
            <CardTitle>Coordonnées</CardTitle>
            <Info icon={Phone}>{client.phone ?? "Non renseigné"}</Info>
            <Info icon={Cake}>
              {client.birthday ? formatDate(client.birthday) : "Anniversaire non renseigné"}
            </Info>
            {client.notes && <Info icon={StickyNote}>{client.notes}</Info>}
            {client.phone && (
              <a
                href={whatsappLink(client.phone, message)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-semibold text-white transition-all hover:brightness-95 active:scale-[0.98]"
              >
                <MessageCircle className="size-5" />
                {loyalty.eligible ? "Annoncer la prestation offerte" : "Écrire sur WhatsApp"}
              </a>
            )}
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <CardTitle>Historique</CardTitle>
            <span className="text-sm text-stone-500">
              Client depuis {formatDate(client.createdAt.toISOString().slice(0, 10))}
            </span>
          </div>
          {history.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Aucun passage"
              text="Enregistrez sa première prestation."
              action={
                <ButtonLink href={`/passages/nouveau?client=${client.id}`}>
                  <Plus className="size-5" /> Nouveau passage
                </ButtonLink>
              }
            />
          ) : (
            <ul className="divide-y divide-stone-100">
              {history.map((v, i) => (
                <li
                  key={v.id}
                  style={{ "--i": Math.min(i, 12) } as React.CSSProperties}
                  className="flex animate-fade-up items-center gap-3 px-5 py-3 stagger"
                >
                  <div className="w-16 shrink-0 text-xs leading-tight text-stone-500 first-letter:uppercase">
                    {formatShortDate(v.date)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{v.service}</p>
                    <p className="truncate text-sm text-stone-500">
                      {v.isFree ? "Offert par la fidélité" : PAYMENT_LABELS[v.paymentMethod]}
                      {v.note && ` · ${v.note}`}
                    </p>
                  </div>
                  {v.isFree ? (
                    <span className="rounded-full bg-gold-400/20 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      Offert
                    </span>
                  ) : (
                    <span className="text-sm font-semibold whitespace-nowrap">{formatFCFA(v.price)}</span>
                  )}
                  <ConfirmDelete
                    action={deleteVisit.bind(null, v.id, client.id)}
                    message={`Supprimer le passage « ${v.service} » du ${formatDate(v.date)} ?`}
                    label="Supprimer ce passage"
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function Info({ icon: Icon, children }: { icon: typeof Phone; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-3 text-sm text-stone-700">
      <Icon className="mt-0.5 size-4 shrink-0 text-stone-400" />
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}
