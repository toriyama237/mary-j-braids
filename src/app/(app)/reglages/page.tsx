import { asc, desc } from "drizzle-orm";
import { Gift, KeyRound, Scissors } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/db";
import { services } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getLoyaltyThreshold } from "@/lib/loyalty";
import { NewService, PasswordForm, ServiceRow, ThresholdForm } from "./settings-forms";

export const metadata: Metadata = { title: "Réglages" };

export default async function SettingsPage() {
  await requireUser();
  const [catalogue, threshold] = await Promise.all([
    db.select().from(services).orderBy(desc(services.active), asc(services.name)),
    getLoyaltyThreshold(),
  ]);

  return (
    <>
      <PageHeader title="Réglages" subtitle="Catalogue, fidélité et sécurité du compte." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr] lg:gap-6">
        <Section
          icon={<Scissors className="size-5" />}
          title="Services et prix"
          text="Les prix servent de valeur par défaut, modifiable à chaque passage. Un service masqué reste dans l'historique."
        >
          <ul className="divide-y divide-stone-100">
            {catalogue.map((s, i) => (
              <ServiceRow key={s.id} service={s} index={i} />
            ))}
          </ul>
          <NewService />
        </Section>

        <div className="space-y-4 lg:space-y-6">
          <Section
            icon={<Gift className="size-5" />}
            title="Programme de fidélité"
            text="Au bout de ce nombre de passages payés, la prestation suivante est offerte."
          >
            <div className="p-5 pt-0">
              <ThresholdForm threshold={threshold} />
            </div>
          </Section>
          <Section icon={<KeyRound className="size-5" />} title="Mot de passe">
            <div className="p-5 pt-0">
              <PasswordForm />
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({
  icon,
  title,
  text,
  children,
}: {
  icon: ReactNode;
  title: string;
  text?: string;
  children: ReactNode;
}) {
  return (
    <Card className="h-fit">
      <div className="flex gap-3 p-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          {icon}
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          {text && <p className="mt-0.5 text-sm text-stone-500">{text}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}
