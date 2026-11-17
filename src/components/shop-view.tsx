import Link from "next/link";
import { CATEGORIES } from "@/lib/config";
import { getProducts } from "@/lib/products";
import { ProductGrid } from "./product-card";

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-normal transition-colors ${
        active
          ? "border-ink bg-ink text-cream"
          : "border-line bg-white/60 hover:border-taupe hover:bg-white"
      }`}
    >
      {children}
    </Link>
  );
}

/** Page boutique : filtres par catégorie + grille d'articles. */
export async function ShopView({
  activeSlug = null,
}: {
  activeSlug?: string | null;
}) {
  const all = await getProducts();
  const active = CATEGORIES.find((c) => c.slug === activeSlug) ?? null;
  const products = active
    ? all.filter((p) => p.category === active.label)
    : all;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
      <p className="eyebrow text-center text-muted">
        {active ? "La boutique" : "Toute la collection"}
      </p>
      <h1 className="font-display mt-2 text-center text-5xl">
        {active ? active.label : "La boutique"}
      </h1>

      <nav
        aria-label="Catégories"
        className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0"
      >
        <Chip href="/boutique" active={!active}>
          Tout
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip
            key={c.slug}
            href={`/boutique/${c.slug}`}
            active={active?.slug === c.slug}
          >
            {c.label}
          </Chip>
        ))}
      </nav>

      <p className="mt-8 mb-6 text-sm text-muted">
        {products.length} article{products.length > 1 ? "s" : ""}
      </p>
      <ProductGrid products={products} />
    </section>
  );
}
