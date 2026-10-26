import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="animate-fade-in px-6 py-14 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon className="size-6" />
      </span>
      <p className="mt-4 font-medium text-stone-800">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-stone-500">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
