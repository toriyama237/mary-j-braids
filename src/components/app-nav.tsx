"use client";

import { House, Plus, Settings, Users, Wallet, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string; icon: LucideIcon };
type Role = "admin" | "staff";

/** Un employé ne voit pas les finances ; « Réglages » devient « Mon compte ». */
function navItems(role: Role): NavItem[] {
  return [
    { href: "/", label: "Accueil", icon: House },
    { href: "/clients", label: "Clients", icon: Users },
    ...(role === "admin" ? [{ href: "/finances", label: "Finances", icon: Wallet }] : []),
    { href: "/reglages", label: role === "admin" ? "Réglages" : "Mon compte", icon: Settings },
  ];
}

const NEW_VISIT = "/passages/nouveau";

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

/** Menu latéral (ordinateur et tablette). */
export function SidebarNav({ role }: { role: Role }) {
  const isActive = useIsActive();
  return (
    <nav className="space-y-1">
      <Link
        href={NEW_VISIT}
        className="mb-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-semibold text-white shadow-sm shadow-brand-900/20 transition-colors hover:bg-brand-700"
      >
        <Plus className="size-5" />
        Nouveau passage
      </Link>
      {navItems(role).map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={cn(
            "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
            isActive(href)
              ? "bg-brand-50 text-brand-700"
              : "text-stone-600 hover:bg-sand hover:text-stone-900",
          )}
        >
          <Icon className="size-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** Barre de navigation du bas (téléphone), avec le bouton « + » au centre. */
export function BottomNav({ role }: { role: Role }) {
  const isActive = useIsActive();
  // Le formulaire de passage a sa propre barre d'enregistrement en bas.
  if (isActive(NEW_VISIT)) return null;
  const [first, second, ...rest] = navItems(role);
  const tab = ({ href, label, icon: Icon }: NavItem) => (
    <Link
      key={href}
      href={href}
      aria-current={isActive(href) ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium",
        isActive(href) ? "text-brand-700" : "text-stone-500",
      )}
    >
      <Icon className="size-6" strokeWidth={isActive(href) ? 2.25 : 1.75} />
      {label}
    </Link>
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-md items-end px-2">
        {tab(first!)}
        {tab(second!)}
        <Link
          href={NEW_VISIT}
          aria-label="Nouveau passage"
          className="mx-1 -mt-6 grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg ring-4 shadow-brand-900/30 ring-cream"
        >
          <Plus className="size-7" />
        </Link>
        {rest.map(tab)}
      </div>
    </nav>
  );
}
