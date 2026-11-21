/** Mise en page commune des pages d'aide. */
export function InfoPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-2xl px-4 py-14 sm:px-8">
      <p className="eyebrow text-center text-muted">{eyebrow}</p>
      <h1 className="font-display mt-3 text-center text-5xl">{title}</h1>
      <div className="mt-10 space-y-8 leading-relaxed [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink [&_p]:text-muted [&_li]:text-muted">
        {children}
      </div>
    </section>
  );
}
