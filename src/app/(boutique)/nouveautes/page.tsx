import type { Metadata } from "next";
import { ProductGrid } from "@/components/product-card";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = { title: "Nouveautés" };

export default async function NouveautesPage() {
  // Les articles cochés « Nouveauté » dans l'admin, du plus récent au plus
  // ancien. Si aucun n'est coché, les 8 derniers ajoutés.
  const all = await getProducts();
  const marked = all.filter((p) => p.is_new);
  const products = marked.length > 0 ? marked : all.slice(0, 8);
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
      <p className="eyebrow text-center text-muted">Fraîchement arrivées</p>
      <h1 className="font-display mt-2 mb-2 text-center text-5xl">Nouveautés</h1>
      <p className="mb-10 text-center text-muted">
        Les dernières pièces arrivées à la boutique.
      </p>
      <ProductGrid products={products} />
    </section>
  );
}
