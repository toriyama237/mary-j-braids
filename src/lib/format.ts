const fcfa = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/** 12500 → « 12 500 FCFA » */
export function formatFCFA(amount: number) {
  return `${fcfa.format(amount)} FCFA`;
}

/** Même format, avec des espaces simples (les polices PDF n'ont pas l'espace fine). */
export function formatFCFAPlain(amount: number) {
  return formatFCFA(amount).replace(/\s/g, " ");
}

/** « 2026-10-26 » → « lun. 26 oct. » */
export function formatShortDate(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** « 2026-10-26 » → « 26/10/2026 » */
export function formatDate(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("fr-FR");
}

/** Date du jour au format AAAA-MM-JJ, heure du Cameroun (UTC+1). */
export function todayISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Douala" });
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export function plural(n: number, word: string) {
  return `${n} ${word}${n > 1 ? "s" : ""}`;
}

/** Lien WhatsApp à partir d'un numéro camerounais (« 690 00 00 01 » → wa.me/237690000001). */
export function whatsappLink(phone: string, text?: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 9) digits = `237${digits}`;
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${query}`;
}

export const PAYMENT_LABELS = {
  especes: "Espèces",
  orange_money: "Orange Money",
  mtn_momo: "MTN MoMo",
} as const;

export const EXPENSE_LABELS = {
  produits: "Produits et mèches",
  loyer: "Loyer",
  electricite: "Électricité / eau",
  salaires: "Salaires",
  autre: "Autre",
} as const;

export const AUDIENCE_LABELS = { femme: "Femme", homme: "Homme", mixte: "Mixte" } as const;
