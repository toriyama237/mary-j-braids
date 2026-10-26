import { Pencil } from "lucide-react";
import Link from "next/link";
import { deleteVisit } from "@/app/(app)/passages/actions";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Card, CardTitle } from "@/components/ui/card";
import { formatDate, formatFCFA, PAYMENT_LABELS, plural } from "@/lib/format";

type Row = {
  id: number;
  clientId: number;
  date: string;
  client: string;
  service: string;
  price: number;
  paymentMethod: keyof typeof PAYMENT_LABELS;
  isFree: boolean;
};

const LIMIT = 50;

/** Passages de la période, les plus récents d'abord, modifiables et supprimables. */
export function VisitsTable({ visits, returnTo }: { visits: Row[]; returnTo: string }) {
  const rows = [...visits].reverse().slice(0, LIMIT);
  const editHref = (id: number) => `/passages/${id}/modifier?retour=${encodeURIComponent(returnTo)}`;

  return (
    <Card>
      <div className="flex items-baseline justify-between px-5 pt-5 pb-3">
        <CardTitle>Passages de la période</CardTitle>
        <span className="text-sm text-stone-500">
          {visits.length > LIMIT
            ? `${LIMIT} plus récents sur ${visits.length}`
            : plural(visits.length, "passage")}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 pb-6 text-sm text-stone-500">Aucun passage sur la période.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="hidden border-y border-stone-100 bg-cream text-left text-xs tracking-wide text-stone-500 uppercase sm:table-header-group">
              <tr>
                <th className="px-5 py-2.5 font-medium">Date</th>
                <th className="px-3 py-2.5 font-medium">Client</th>
                <th className="px-3 py-2.5 font-medium">Service</th>
                <th className="px-3 py-2.5 font-medium">Paiement</th>
                <th className="px-3 py-2.5 text-right font-medium">Montant</th>
                <th className="w-24 px-3 py-2.5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((v) => (
                <tr key={v.id} className="transition-colors hover:bg-cream/70">
                  <td className="hidden px-5 py-2.5 whitespace-nowrap text-stone-500 sm:table-cell">
                    {formatDate(v.date)}
                  </td>
                  <td className="px-5 py-2.5 sm:px-3">
                    <Link href={`/clients/${v.clientId}`} className="font-medium hover:text-brand-700">
                      {v.client}
                    </Link>
                    <span className="block text-xs text-stone-500 sm:hidden">
                      {v.service} · {formatDate(v.date)}
                    </span>
                  </td>
                  <td className="hidden px-3 py-2.5 sm:table-cell">{v.service}</td>
                  <td className="hidden px-3 py-2.5 text-stone-600 sm:table-cell">
                    {v.isFree ? "Offert" : PAYMENT_LABELS[v.paymentMethod]}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">
                    {formatFCFA(v.price)}
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex justify-end">
                      <Link
                        href={editHref(v.id)}
                        aria-label="Modifier ce passage"
                        title="Modifier"
                        className="grid size-9 place-items-center rounded-lg text-stone-400 transition-colors hover:bg-sand hover:text-stone-700"
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <ConfirmDelete
                        action={deleteVisit.bind(null, v.id, returnTo)}
                        message={`Supprimer le passage de ${v.client} (${v.service}, ${formatDate(v.date)}) ?`}
                        label="Supprimer ce passage"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
