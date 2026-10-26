import type { NextRequest } from "next/server";
import { PAYMENT_LABELS } from "@/lib/format";
import { getVisitsForExport, resolvePeriod } from "@/lib/queries/finances";

// Export des passages en CSV, au format attendu par Excel en français
// (séparateur « ; », encodage UTF-8 avec BOM pour les accents).
export async function GET(request: NextRequest) {
  const period = resolvePeriod({ periode: "perso", ...Object.fromEntries(request.nextUrl.searchParams) });
  const rows = await getVisitsForExport(period);

  const escape = (v: string | number | null) => {
    const text = String(v ?? "");
    return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [
    ["Date", "Client", "Téléphone", "Service", "Montant (FCFA)", "Paiement", "Offert", "Remarque"],
    ...rows.map((r) => [
      r.date,
      r.client,
      r.phone,
      r.service,
      r.price,
      PAYMENT_LABELS[r.paymentMethod],
      r.isFree ? "Oui" : "Non",
      r.note,
    ]),
  ].map((line) => line.map(escape).join(";"));

  return new Response(`﻿${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="passages-mjb-${period.from}-${period.to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
