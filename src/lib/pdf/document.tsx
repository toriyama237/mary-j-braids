import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";

// Pas de césure automatique : les mots français coupés au hasard (« of-ferte ») font négligé.
Font.registerHyphenationCallback((word) => [word]);

// Charte des documents PDF : mêmes couleurs que l'application.
export const C = {
  brand: "#8a2846",
  brandDark: "#5e1c31",
  gold: "#c9a24a",
  ink: "#1c1917",
  muted: "#78716c",
  line: "#e7e5e4",
  soft: "#faf6f2",
};

export const s = StyleSheet.create({
  page: {
    padding: 36,
    paddingBottom: 56,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: C.ink,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    borderBottomWidth: 2.5,
    borderBottomColor: C.brand,
    marginBottom: 18,
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.brand,
    color: "#fff",
    fontFamily: "Times-Bold",
    fontSize: 14,
    textAlign: "center",
    paddingTop: 8,
    marginRight: 10,
  },
  brandName: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  brandSub: { fontSize: 8.5, color: C.muted },
  docTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.brand, textAlign: "right" },
  docSub: { fontSize: 9, color: C.muted, textAlign: "right", marginTop: 2 },
  h2: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.brand,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 6,
  },
  kpis: { flexDirection: "row", gap: 8 },
  kpi: { flex: 1, borderWidth: 1, borderColor: C.line, borderRadius: 6, padding: 9, backgroundColor: C.soft },
  kpiHi: { backgroundColor: C.brand, borderColor: C.brand },
  kpiLabel: { fontSize: 8, color: C.muted },
  kpiValue: { fontSize: 12.5, fontFamily: "Helvetica-Bold", marginTop: 3 },
  th: {
    flexDirection: "row",
    borderBottomWidth: 1.2,
    borderBottomColor: C.ink,
    paddingVertical: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    textTransform: "uppercase",
  },
  tr: { flexDirection: "row", borderBottomWidth: 0.6, borderBottomColor: C.line, paddingVertical: 4.5 },
  trTotal: { flexDirection: "row", paddingVertical: 5, fontFamily: "Helvetica-Bold" },
  right: { textAlign: "right" },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: C.muted,
    borderTopWidth: 0.6,
    borderTopColor: C.line,
    paddingTop: 6,
  },
});

export function PdfDocument({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const generated = new Date().toLocaleString("fr-FR", { timeZone: "Africa/Douala" });
  return (
    <Document title={`${title} — Mary J Braids`} author="Mary J Braids" language="fr">
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <View style={s.brandRow}>
            <Text style={s.logo}>MJ</Text>
            <View>
              <Text style={s.brandName}>Mary J Braids</Text>
              <Text style={s.brandSub}>Salon de coiffure mixte</Text>
            </View>
          </View>
          <View>
            <Text style={s.docTitle}>{title}</Text>
            <Text style={s.docSub}>{subtitle}</Text>
          </View>
        </View>
        {children}
        <View style={s.footer} fixed>
          <Text>Généré le {generated}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

/** Tableau simple : colonnes en flex, alignement à droite pour les montants. */
export function PdfTable({
  columns,
  rows,
  total,
}: {
  columns: { label: string; flex: number; align?: "right" }[];
  rows: (string | number)[][];
  total?: (string | number)[];
}) {
  const cell = (value: string | number, i: number) => (
    <Text
      key={i}
      style={[{ flex: columns[i]!.flex, paddingRight: 6 }, columns[i]!.align === "right" ? s.right : {}]}
    >
      {value}
    </Text>
  );
  return (
    <View>
      <View style={s.th} fixed>
        {columns.map((c, i) => cell(c.label, i))}
      </View>
      {rows.map((r, ri) => (
        <View key={ri} style={s.tr} wrap={false}>
          {r.map(cell)}
        </View>
      ))}
      {total && <View style={s.trTotal}>{total.map(cell)}</View>}
    </View>
  );
}

export function PdfKpi({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={[s.kpi, highlight ? s.kpiHi : {}]}>
      <Text style={[s.kpiLabel, highlight ? { color: "#ecc6d4" } : {}]}>{label}</Text>
      <Text style={[s.kpiValue, highlight ? { color: "#fff" } : {}]}>{value}</Text>
    </View>
  );
}

export function pdfResponse(buffer: Buffer, filename: string) {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
