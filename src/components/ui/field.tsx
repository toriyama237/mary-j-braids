import { ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-xl border bg-white px-4 text-base text-stone-900 placeholder:text-stone-400 transition focus:ring-4 focus:outline-none disabled:bg-stone-50";

function controlState(error?: string) {
  return error
    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
    : "border-stone-200 focus:border-brand-400 focus:ring-brand-100";
}

function Wrapper({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="animate-fade-in text-sm text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-stone-500">{hint}</p>
      )}
    </div>
  );
}

type Extra = { label: string; id: string; hint?: string; error?: string };

export function Field({ label, id, hint, error, className, ...props }: ComponentProps<"input"> & Extra) {
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} className={className}>
      <input
        id={id}
        name={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(control, "h-12", controlState(error))}
        {...props}
      />
    </Wrapper>
  );
}

export function TextArea({
  label,
  id,
  hint,
  error,
  className,
  ...props
}: ComponentProps<"textarea"> & Extra) {
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} className={className}>
      <textarea
        id={id}
        name={id}
        rows={3}
        aria-invalid={!!error}
        className={cn(control, "resize-none py-3", controlState(error))}
        {...props}
      />
    </Wrapper>
  );
}

export function Select({
  label,
  id,
  hint,
  error,
  className,
  children,
  ...props
}: ComponentProps<"select"> & Extra) {
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} className={className}>
      <div className="relative">
        <select
          id={id}
          name={id}
          aria-invalid={!!error}
          className={cn(control, "h-12 appearance-none pr-10", controlState(error))}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-stone-400" />
      </div>
    </Wrapper>
  );
}

/** Choix exclusif sous forme de boutons (ex. Homme / Femme, mode de paiement). */
export function Segmented<T extends string>({
  name,
  label,
  options,
  defaultValue,
  error,
  onChange,
}: {
  name: string;
  label: string;
  options: { value: T; label: string; icon?: ReactNode }[];
  defaultValue?: T;
  error?: string;
  onChange?: (value: T) => void;
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-1.5 block text-sm font-medium text-stone-700">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="flex-1 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={o.value}
              defaultChecked={o.value === defaultValue}
              onChange={() => onChange?.(o.value)}
              className="peer sr-only"
            />
            <span className="flex h-12 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium whitespace-nowrap text-stone-600 transition-all peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:text-brand-700 peer-checked:ring-2 peer-checked:ring-brand-100 peer-focus-visible:ring-4 hover:border-stone-300 active:scale-[0.98]">
              {o.icon}
              {o.label}
            </span>
          </label>
        ))}
      </div>
      {error && <p className="animate-fade-in text-sm text-red-600">{error}</p>}
    </fieldset>
  );
}
