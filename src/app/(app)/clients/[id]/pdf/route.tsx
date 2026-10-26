import { renderToBuffer, Text, View } from "@react-pdf/renderer";
import type { NextRequest } from "next/server";
import { formatDate, formatFCFAPlain as fcfa, PAYMENT_LABELS } from "@/lib/format";
import { C, PdfDocument, PdfKpi, PdfTable, pdfResponse, s } from "@/lib/pdf/document";
import { getClientDetail } from "@/lib/queries/clients";

// Fiche client : coordonnées, fidélité et historique complet.
export async function GET(_request: NextRequest, ctx: RouteContext<"/clients/[id]/pdf">) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return new Response("Introuvable", { status: 404 });
  const { client, history, loyalty, totals } = await getClientDetail(id);

  const buffer = await renderToBuffer(
    <PdfDocument title="Fiche client" subtitle={client.name}>
      <View style={{ flexDirection: "row", gap: 18, marginBottom: 6 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontFamily: "Helvetica-Bold" }}>{client.name}</Text>
          <Text style={{ color: C.muted, marginTop: 3 }}>
            {client.gender === "F" ? "Cliente" : "Client"} depuis le{" "}
            {formatDate(client.createdAt.toISOString().slice(0, 10))}
          </Text>
          <Text style={{ marginTop: 8 }}>Téléphone : {client.phone ?? "non renseigné"}</Text>
          <Text>Anniversaire : {client.birthday ? formatDate(client.birthday) : "non renseigné"}</Text>
          {client.notes && <Text style={{ marginTop: 6, color: C.muted }}>Notes : {client.notes}</Text>}
        </View>
        <View style={{ width: 200, backgroundColor: C.brand, borderRadius: 8, padding: 12 }}>
          <Text style={{ color: "#ecc6d4", fontSize: 8, letterSpacing: 1.5 }}>CARTE FIDÉLITÉ</Text>
          <Text style={{ color: "#fff", fontSize: 18, fontFamily: "Helvetica-Bold", marginTop: 4 }}>
            {Math.min(loyalty.stamps, loyalty.threshold)} / {loyalty.threshold}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
            {Array.from({ length: loyalty.threshold }, (_, i) => (
              <View
                key={i}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: i < loyalty.stamps ? C.gold : "transparent",
                  borderWidth: 1,
                  borderColor: i < loyalty.stamps ? C.gold : "#ecc6d4",
                }}
              />
            ))}
          </View>
          <Text style={{ color: "#fff", marginTop: 8, fontSize: 8.5 }}>
            {loyalty.eligible
              ? "Prochaine prestation offerte !"
              : `Encore ${loyalty.threshold - loyalty.stamps} passage(s) avant la prestation offerte.`}
          </Text>
        </View>
      </View>

      <View style={[s.kpis, { marginTop: 12 }]}>
        <PdfKpi label="Total dépensé" value={fcfa(totals.spent)} />
        <PdfKpi label="Passages" value={String(totals.visits)} />
        <PdfKpi label="Dernier passage" value={history[0] ? formatDate(history[0].date) : "—"} />
      </View>

      <Text style={s.h2}>Historique des passages</Text>
      <PdfTable
        columns={[
          { label: "Date", flex: 1.3 },
          { label: "Service", flex: 2.6 },
          { label: "Paiement", flex: 1.8 },
          { label: "Remarque", flex: 2.6 },
          { label: "Montant", flex: 1.6, align: "right" },
        ]}
        rows={history.map((v) => [
          formatDate(v.date),
          v.service,
          v.isFree ? "Offert" : PAYMENT_LABELS[v.paymentMethod],
          v.note ?? "",
          fcfa(v.price),
        ])}
        total={["Total", "", "", "", fcfa(totals.spent)]}
      />
    </PdfDocument>,
  );

  const slug = client.name
    .normalize("NFD")
    .replace(/[^\w]+/g, "-")
    .toLowerCase();
  return pdfResponse(buffer, `fiche-${slug}.pdf`);
}
