import type { Metadata } from "next";
import { Gift, Sparkles, Users } from "lucide-react";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

const highlights = [
  { icon: Users, text: "Tous vos clients et leur historique au même endroit" },
  { icon: Gift, text: "Une prestation offerte au 10e passage, calculée pour vous" },
  { icon: Sparkles, text: "Le chiffre du jour et du mois en un coup d'œil" },
];

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Panneau de marque (ordinateur) */}
      <aside className="relative hidden overflow-hidden bg-brand-700 p-12 text-cream lg:flex lg:flex-col lg:justify-between">
        <BraidPattern />
        <Logo tone="light" className="relative" />
        <div className="relative max-w-md">
          <h1 className="font-display text-4xl leading-tight font-semibold">
            Chaque client compte,
            <br />
            <span className="text-gold-400">chaque passage aussi.</span>
          </h1>
          <ul className="mt-10 space-y-5">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-4 text-brand-100">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10">
                  <Icon className="size-5 text-gold-400" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-brand-200">© {new Date().getFullYear()} Mary J Braids</p>
      </aside>

      {/* Formulaire */}
      <section className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Logo className="mb-10 lg:hidden" />
          <h2 className="font-display text-3xl font-semibold text-stone-900">Bon retour</h2>
          <p className="mt-2 mb-8 text-stone-500">Connectez-vous pour gérer le salon.</p>
          <LoginForm />
          <p className="mt-8 text-center text-xs text-stone-400">Accès réservé à l&apos;équipe du salon.</p>
        </div>
      </section>
    </main>
  );
}

/** Motif de tresses stylisées en arrière-plan. */
function BraidPattern() {
  return (
    <svg className="absolute inset-0 size-full opacity-[0.07]" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="braid" width="48" height="64" patternUnits="userSpaceOnUse">
          <path
            d="M12 0c12 8 12 24 0 32s-12 24 0 32M36 0c-12 8-12 24 0 32s12 24 0 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#braid)" />
    </svg>
  );
}
