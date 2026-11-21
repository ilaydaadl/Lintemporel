import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product-card";
import { ProductView } from "@/components/product-view";
import { categoryByLabel, formatPrice } from "@/lib/config";
import { getProductBySlug, getProducts } from "@/lib/products";

export async function generateMetadata({
  params,
}: PageProps<"/produit/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return product
    ? { title: product.name, description: product.description }
    : { title: "Article introuvable" };
}

export default function ProductPage({ params }: PageProps<"/produit/[slug]">) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
      <Suspense
        fallback={<div className="aspect-[4/5] max-w-md animate-pulse bg-sand" />}
      >
        <ProductDetails params={params} />
      </Suspense>
    </section>
  );
}

async function ProductDetails({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const category = categoryByLabel(product.category);
  // « Complétez le look » : d'autres pièces, en privilégiant une autre catégorie
  const others = (await getProducts()).filter((p) => p.id !== product.id);
  const related = [
    ...others.filter((p) => p.category !== product.category),
    ...others.filter((p) => p.category === product.category),
  ].slice(0, 4);

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="text-sm text-muted">
        <Link href="/boutique" className="hover:text-ink">
          Boutique
        </Link>
        {category && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/boutique/${category.slug}`} className="hover:text-ink">
              {category.label}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>
      <ProductView
        product={product}
        header={
          <>
            {product.category && (
              <p className="eyebrow text-muted">{product.category}</p>
            )}
            <h1 className="font-display mt-2 text-4xl sm:text-5xl">{product.name}</h1>
            <p className="mt-3 text-xl font-normal">
              {formatPrice(product.price_cents)}
            </p>
            {product.description && (
              <p className="mt-5 whitespace-pre-line leading-relaxed text-muted">
                {product.description}
              </p>
            )}
          </>
        }
      />

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display mb-7 text-4xl">Complétez le look</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </>
  );
}
