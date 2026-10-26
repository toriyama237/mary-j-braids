"use client";

import { Banknote, Check, Gift, Search, Smartphone, UserPlus, X } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Segmented, TextArea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";
import { AUDIENCE_LABELS, formatFCFA, initials } from "@/lib/format";
import { createVisit, type VisitFormState } from "../actions";

type PickerClient = { id: number; name: string; phone: string | null; stamps: number };
type PickerService = {
  id: number;
  name: string;
  audience: "femme" | "homme" | "mixte";
  defaultPrice: number;
};
type Payment = "especes" | "orange_money" | "mtn_momo";

export function VisitForm({
  clients,
  services,
  threshold,
  today,
  initialClientId,
}: {
  clients: PickerClient[];
  services: PickerService[];
  threshold: number;
  today: string;
  initialClientId?: number;
}) {
  const [state, formAction] = useActionState<VisitFormState, FormData>(createVisit, {});
  const e = state.errors ?? {};

  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [clientId, setClientId] = useState<number | null>(initialClientId ?? null);
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState<"tous" | "femme" | "homme">("tous");
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [price, setPrice] = useState("");
  const [payment, setPayment] = useState<Payment>("especes");
  const [date, setDate] = useState(today);
  const [useGift, setUseGift] = useState(false);

  const client = clients.find((c) => c.id === clientId) ?? null;
  const eligible = mode === "existing" && !!client && client.stamps >= threshold;
  const isFree = eligible && useGift;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients.slice(0, 6);
    const digits = q.replace(/\D/g, "");
    return clients
      .filter(
        (c) => c.name.toLowerCase().includes(q) || (digits && c.phone?.replace(/\D/g, "").includes(digits)),
      )
      .slice(0, 8);
  }, [clients, query]);

  const shownServices = services.filter(
    (s) => audience === "tous" || s.audience === audience || s.audience === "mixte",
  );

  function pickService(s: PickerService) {
    setServiceId(s.id);
    setPrice(String(s.defaultPrice));
  }

  const total = isFree ? 0 : Number(price) || 0;

  return (
    <form action={formAction} className="space-y-4 pb-24 lg:pb-0" noValidate>
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="clientId" value={mode === "existing" ? (clientId ?? "") : ""} />
      <input type="hidden" name="serviceId" value={serviceId ?? ""} />
      <input type="hidden" name="isFree" value={isFree ? "1" : "0"} />

      {/* 1. Client */}
      <Step number={1} title="Client" error={e.client}>
        {mode === "existing" && client ? (
          <div className="flex animate-scale-in items-center gap-3 rounded-xl border-2 border-brand-500 bg-brand-50 p-3">
            <span className="grid size-11 place-items-center rounded-full bg-white text-sm font-semibold text-brand-700">
              {initials(client.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{client.name}</p>
              <p className="text-sm text-stone-600">
                Fidélité : {Math.min(client.stamps, threshold)}/{threshold}
                {client.phone && ` · ${client.phone}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setClientId(null);
                setUseGift(false);
              }}
              className="grid size-9 place-items-center rounded-lg text-stone-500 hover:bg-white"
              aria-label="Changer de client"
            >
              <X className="size-5" />
            </button>
          </div>
        ) : mode === "existing" ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-stone-400" />
              <input
                value={query}
                onChange={(ev) => setQuery(ev.target.value)}
                placeholder="Nom ou téléphone du client"
                aria-label="Rechercher un client"
                autoFocus
                className="h-12 w-full rounded-xl border border-stone-200 bg-white pr-4 pl-12 text-base placeholder:text-stone-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none"
              />
            </div>
            <ul className="space-y-1.5">
              {matches.map((c, i) => (
                <li
                  key={c.id}
                  style={{ "--i": i } as React.CSSProperties}
                  className="animate-fade-up stagger"
                >
                  <button
                    type="button"
                    onClick={() => setClientId(c.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-stone-200 bg-white p-2.5 text-left transition-all hover:border-brand-300 hover:bg-brand-50/50 active:scale-[0.99]"
                  >
                    <span className="grid size-9 place-items-center rounded-full bg-sand text-xs font-semibold">
                      {initials(c.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{c.name}</span>
                      <span className="block truncate text-xs text-stone-500">{c.phone ?? "—"}</span>
                    </span>
                    {c.stamps >= threshold && (
                      <span className="flex items-center gap-1 rounded-full bg-gold-400/20 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        <Gift className="size-3.5" /> Offert
                      </span>
                    )}
                  </button>
                </li>
              ))}
              {matches.length === 0 && (
                <li className="py-3 text-center text-sm text-stone-500">Aucun client ne correspond.</li>
              )}
            </ul>
            <button
              type="button"
              onClick={() => setMode("new")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 py-3 text-sm font-semibold text-stone-600 transition-colors hover:border-brand-400 hover:text-brand-700"
            >
              <UserPlus className="size-5" />
              {query.trim() ? `Créer « ${query.trim()} »` : "Nouveau client"}
            </button>
          </div>
        ) : (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-brand-700">Nouveau client</p>
              <button
                type="button"
                onClick={() => setMode("existing")}
                className="text-sm font-medium text-stone-500 hover:text-stone-800"
              >
                Choisir un client existant
              </button>
            </div>
            <Field label="Nom complet" id="name" defaultValue={query} error={e.name} autoComplete="off" />
            <Field
              label="Téléphone"
              id="phone"
              type="tel"
              inputMode="tel"
              placeholder="6XX XX XX XX"
              error={e.phone}
            />
            <Segmented
              name="gender"
              label="Client"
              error={e.gender}
              options={[
                { value: "F", label: "Femme" },
                { value: "H", label: "Homme" },
              ]}
            />
          </div>
        )}

        {eligible && (
          <label className="mt-3 flex animate-scale-in cursor-pointer items-center gap-3 rounded-xl border border-gold-400 bg-gradient-to-r from-amber-50 to-gold-400/20 p-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold-400 text-brand-900">
              <Gift className="size-5" />
            </span>
            <span className="flex-1 text-sm">
              <b className="block text-amber-900">Prestation offerte disponible</b>
              <span className="text-amber-800">
                {threshold} passages atteints. L&apos;utiliser maintenant ?
              </span>
            </span>
            <input
              type="checkbox"
              checked={useGift}
              onChange={(ev) => setUseGift(ev.target.checked)}
              className="peer sr-only"
            />
            <span className="relative h-7 w-12 shrink-0 rounded-full bg-stone-300 transition-colors peer-checked:bg-brand-600 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
          </label>
        )}
      </Step>

      {/* 2. Service */}
      <Step number={2} title="Service" error={e.service}>
        <div className="mb-3 flex gap-1 rounded-xl bg-sand p-1">
          {(["tous", "femme", "homme"] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAudience(a)}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                audience === a ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800",
              )}
            >
              {a === "tous" ? "Tous" : AUDIENCE_LABELS[a]}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {shownServices.map((s, i) => {
            const selected = s.id === serviceId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => pickService(s)}
                style={{ "--i": i } as React.CSSProperties}
                className={cn(
                  "relative animate-fade-up rounded-xl border p-3 text-left transition-all stagger active:scale-[0.98]",
                  selected
                    ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100"
                    : "border-stone-200 bg-white hover:border-stone-300",
                )}
              >
                {selected && (
                  <Check className="absolute top-2.5 right-2.5 size-4 animate-pop text-brand-600" />
                )}
                <span className="block pr-5 text-sm font-semibold">{s.name}</span>
                <span className="mt-1 block text-xs text-stone-500">{formatFCFA(s.defaultPrice)}</span>
              </button>
            );
          })}
        </div>
      </Step>

      {/* 3. Paiement */}
      <Step number={3} title="Prix et paiement">
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Prix (FCFA)"
              id="price"
              type="number"
              inputMode="numeric"
              min={0}
              step={500}
              value={isFree ? "0" : price}
              onChange={(ev) => setPrice(ev.target.value)}
              disabled={isFree}
              error={e.price}
              hint={isFree ? "Prestation offerte : 0 FCFA." : "Pré-rempli selon le service, modifiable."}
            />
            <Field
              label="Date"
              id="date"
              type="date"
              value={date}
              max={today}
              onChange={(ev) => setDate(ev.target.value)}
              error={e.date}
            />
          </div>
          {!isFree && (
            <Segmented<Payment>
              name="paymentMethod"
              label="Mode de paiement"
              defaultValue={payment}
              onChange={setPayment}
              error={e.paymentMethod}
              options={[
                { value: "especes", label: "Espèces", icon: <Banknote className="size-4" /> },
                { value: "orange_money", label: "Orange Money", icon: <Smartphone className="size-4" /> },
                { value: "mtn_momo", label: "MTN MoMo", icon: <Smartphone className="size-4" /> },
              ]}
            />
          )}
          <TextArea label="Remarque" id="note" rows={2} placeholder="Facultatif" />
        </div>
      </Step>

      {/* Barre d'enregistrement : collée en bas sur téléphone */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur lg:static lg:rounded-2xl lg:border lg:p-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-stone-500">Total</p>
            <p key={total} className="animate-fade-in font-display text-xl font-semibold">
              {isFree ? "Offert" : formatFCFA(total)}
            </p>
          </div>
          <ButtonLink href="/" variant="ghost" className="hidden sm:inline-flex">
            Annuler
          </ButtonLink>
          <SubmitButton className="h-12 min-w-40">Enregistrer</SubmitButton>
        </div>
      </div>
    </form>
  );
}

function Step({
  number,
  title,
  error,
  children,
}: {
  number: number;
  title: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      style={{ "--i": number } as React.CSSProperties}
      className={cn("animate-fade-up p-4 stagger sm:p-5", error && "border-red-300")}
    >
      <h2 className="mb-4 flex items-center gap-3 font-semibold">
        <span className="grid size-7 place-items-center rounded-full bg-brand-600 text-sm text-white">
          {number}
        </span>
        {title}
      </h2>
      {error && <p className="-mt-2 mb-3 animate-fade-in text-sm text-red-600">{error}</p>}
      {children}
    </Card>
  );
}
