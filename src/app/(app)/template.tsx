// Recréé à chaque navigation : fait apparaître chaque page en douceur.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-up">{children}</div>;
}
