/** Valeur légale, ou un repère rouge « à compléter » si elle est vide. */
export function Fill({ value, label }: { value: string; label: string }) {
  return value ? (
    <>{value}</>
  ) : (
    <span className="bg-red-50 px-1 text-red-800">[{label} à compléter]</span>
  );
}

/** Titre de section numéroté des pages légales. */
export function Article({
  n,
  title,
  children,
}: {
  n?: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2>
        {n !== undefined && <span className="text-muted">{n}. </span>}
        {title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}
