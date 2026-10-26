import { LogOut } from "lucide-react";
import { Suspense } from "react";
import { BottomNav, SidebarNav } from "@/components/app-nav";
import { Logo } from "@/components/logo";
import { Toast } from "@/components/toast";
import { requireUser } from "@/lib/auth";
import { initials } from "@/lib/format";
import { logout } from "../login/actions";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      {/* Menu latéral — ordinateur */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-stone-200 bg-white px-4 py-6 lg:flex">
        <Logo className="mb-8 px-2" />
        <SidebarNav />
        <div className="mt-auto flex items-center gap-3 rounded-xl bg-sand/60 p-3">
          <Avatar name={user.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-stone-500">Gérante</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="grid size-9 place-items-center rounded-lg text-stone-500 hover:bg-white hover:text-brand-700"
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </aside>

      {/* En-tête — téléphone */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-stone-200 bg-cream/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <Avatar name={user.name} />
          <form action={logout}>
            <button
              type="submit"
              className="grid size-9 place-items-center rounded-lg text-stone-500 hover:bg-sand hover:text-brand-700"
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:py-10">{children}</main>

      <BottomNav />
      <Suspense>
        <Toast />
      </Suspense>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
      {initials(name)}
    </span>
  );
}
