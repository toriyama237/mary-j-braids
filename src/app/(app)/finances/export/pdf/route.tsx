import { renderToBuffer, Text, View } from "@react-pdf/renderer";
import type { NextRequest } from "next/server";
import { EXPENSE_LABELS, formatDate, formatFCFAPlain as fcfa, PAYMENT_LABELS } from "@/lib/format";
import { PdfDocument, PdfKpi, PdfTable, pdfResponse, s } from "@/lib/pdf/document";
import { getFinances, getVisitsForExport, resolvePeriod } from "@/lib/queries/finances";

// Rapport financier de la période : synthèse, répartitions, détail des passages et dépenses.
export async function GET(request: NextRequest) {
  const period = resolvePeriod({ periode: "perso", ...Object.fromEntries(request.nextUrl.searchParams) });
  const [f, rows] = await Promise.all([getFinances(period), getVisitsForExport(period)]);
  const pct = (v: number, total: number) => (total ? `${Math.round((v / total) * 100)} %` : "—");

  const buffer = await renderToBuffer(
    <PdfDocument title="Rapport financier" subtitle={period.label}>
      <View style={s.kpis}>
        <PdfKpi label="Chiffre d'affaires" value={fcfa(f.revenue)} />
        <PdfKpi label="Dépenses" value={fcfa(f.expenses)} />
        <PdfKpi label="Bénéfice net" value={fcfa(f.net)} highlight />
        <PdfKpi label="Passages" value={`${f.visits} (${f.free} offerts)`} />
      </View>

      <View style={{ flexDirection: "row", gap: 18 }}>
        <View style={{ flex: 1.3 }}>
          <Text style={s.h2}>Par service</Text>
          <PdfTable
            columns={[
              { label: "Service", flex: 3 },
              { label: "Passages", flex: 1.2, align: "right" },
              { label: "Montant", flex: 2, align: "right" },
            ]}
            rows={f.byService.map((r) => [r.name, r.visits, fcfa(r.revenue)])}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.h2}>Par mode de paiement</Text>
          <PdfTable
            columns={[
              { label: "Mode", flex: 2 },
              { label: "Montant", flex: 2, align: "right" },
              { label: "Part", flex: 1, align: "right" },
            ]}
            rows={f.byPayment.map((r) => [
              PAYMENT_LABELS[r.method],
              fcfa(r.revenue),
              pct(r.revenue, f.revenue),
            ])}
          />
          <Text style={s.h2}>Femmes / hommes</Text>
          <PdfTable
            columns={[
              { label: "Clientèle", flex: 2 },
              { label: "Montant", flex: 2, align: "right" },
              { label: "Part", flex: 1, align: "right" },
            ]}
            rows={f.byGender.map((r) => [
              r.gender === "F" ? "Femmes" : "Hommes",
              fcfa(r.revenue),
              pct(r.revenue, f.revenue),
            ])}
          />
        </View>
      </View>

      <Text style={s.h2}>Détail des passages</Text>
      <PdfTable
        columns={[
          { label: "Date", flex: 1.3 },
          { label: "Client", flex: 2.6 },
          { label: "Service", flex: 2.4 },
          { label: "Paiement", flex: 1.8 },
          { label: "Montant", flex: 1.6, align: "right" },
        ]}
        rows={rows.map((r) => [
          formatDate(r.date),
          r.client,
          r.service,
          r.isFree ? "Offert" : PAYMENT_LABELS[r.paymentMethod],
          fcfa(r.price),
        ])}
        total={["Total", "", "", "", fcfa(f.revenue)]}
      />

      <Text style={s.h2}>Dépenses</Text>
      {f.expenseList.length === 0 ? (
        <Text style={{ color: "#78716c" }}>Aucune dépense sur la période.</Text>
      ) : (
        <PdfTable
          columns={[
            { label: "Date", flex: 1.3 },
            { label: "Libellé", flex: 4 },
            { label: "Catégorie", flex: 2.2 },
            { label: "Montant", flex: 1.6, align: "right" },
          ]}
          rows={f.expenseList.map((x) => [
            formatDate(x.date),
            x.label,
            EXPENSE_LABELS[x.category],
            fcfa(x.amount),
          ])}
          total={["Total", "", "", fcfa(f.expenses)]}
        />
      )}
    </PdfDocument>,
  );

  return pdfResponse(buffer, `rapport-mjb-${period.from}-${period.to}.pdf`);
}
