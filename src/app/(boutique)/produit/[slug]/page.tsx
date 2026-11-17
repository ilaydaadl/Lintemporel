import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductView } from "@/components/product-view";
import { categoryByLabel, formatPrice, SHIPPING } from "@/lib/config";
import { getProductBySlug } from "@/lib/products";

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
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
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
            <h1 className="font-display mt-2 text-4xl">{product.name}</h1>
            <p className="mt-3 text-xl font-normal">
              {formatPrice(product.price_cents)}
            </p>
            <p className="mt-6 whitespace-pre-line leading-relaxed">
              {product.description}
            </p>
          </>
        }
        footer={
          <ul className="mt-8 space-y-1 border-t border-line pt-5 text-sm text-muted">
            <li>
              Point relais {formatPrice(SHIPPING.methods.relay.cents)} (offert
              dès {formatPrice(SHIPPING.freeFromCents)}) · Domicile{" "}
              {formatPrice(SHIPPING.methods.home.cents)}
            </li>
            <li>Paiement sécurisé par carte (Stripe)</li>
          </ul>
        }
      />
    </>
  );
}
