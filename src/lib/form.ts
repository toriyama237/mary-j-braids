import { z } from "zod";

/** État renvoyé par une action de formulaire : erreurs par champ et valeurs saisies. */
export type FormState = { errors?: Record<string, string | undefined>; values?: Record<string, string> };

/** Première erreur de chaque champ, pour l'afficher sous le champ concerné. */
export function fieldErrors(error: z.ZodError) {
  const flat = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  return Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0]]));
}

/** Lit des champs texte d'un FormData (absents → chaîne vide). */
export function readFields(formData: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")]));
}
