"use client";

import { LoaderCircle, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

/** Recherche qui met à jour ?q= dans l'URL pendant la saisie. */
export function SearchBox({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [pending, startTransition] = useTransition();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (value.trim()) next.set("q", value.trim());
      else next.delete("q");
      startTransition(() => router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false }));
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seule la saisie déclenche la recherche
  }, [value]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-stone-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-12 w-full rounded-xl border border-stone-200 bg-white pr-11 pl-12 text-base placeholder:text-stone-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      <span className="absolute top-1/2 right-3 -translate-y-1/2">
        {pending ? (
          <LoaderCircle className="size-5 animate-spin text-stone-400" />
        ) : (
          value && (
            <button
              type="button"
              onClick={() => setValue("")}
              aria-label="Effacer la recherche"
              className="grid size-7 place-items-center rounded-full text-stone-400 hover:bg-sand hover:text-stone-700"
            >
              <X className="size-4" />
            </button>
          )
        )}
      </span>
    </div>
  );
}
